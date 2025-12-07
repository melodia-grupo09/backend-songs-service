import { FilterQuery, QueryOrder } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Song } from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import {
  AvailabilityRegion,
  AvailabilityStatus,
  CatalogStatus,
  EffectiveCatalogStatus,
  SongAuditLogEntry,
  SongAvailability,
} from 'src/entity-modules/song/song.types';
import {
  BlockCatalogItemDto,
  UnblockCatalogItemDto,
  UpdateCatalogItemDto,
} from './dtos/catalog-actions.dto';
import {
  CatalogListItemDto,
  CatalogListQueryDto,
  CatalogListResponseDto,
} from './dtos/catalog-list.dto';

@Injectable()
export class CatalogAdminService {
  constructor(private readonly songRepository: SongRepository) {}

  async listCatalog(
    query: CatalogListQueryDto,
  ): Promise<CatalogListResponseDto> {
    if (query.type === 'collection') {
      return { items: [], total: 0 };
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 25;
    const orderBy =
      query.sort === 'title'
        ? { title: QueryOrder.ASC }
        : { createdAt: QueryOrder.DESC };

    const filter: FilterQuery<Song> = {};

    if (query.q?.trim()) {
      const regex = new RegExp(query.q.trim(), 'i');
      const artistFilter = {
        artists: {
          $elemMatch: { name: regex },
        },
      };
      filter.$or = [{ title: regex }, artistFilter as FilterQuery<Song>];
    }

    if (query.hasVideo === 'yes') {
      filter.hasVideo = true;
    } else if (query.hasVideo === 'no') {
      filter.hasVideo = false;
    }

    const songs = await this.songRepository.find(filter, { orderBy });

    let items = songs.map((song) => this.mapSongToListItem(song));

    if (query.status) {
      items = items.filter((item) => item.effectiveStatus === query.status);
    }

    if (query.region?.trim()) {
      const region = query.region.trim().toLowerCase();
      items = items.filter((item) =>
        item.regions?.some((entry) => entry.code.toLowerCase() === region),
      );
    }

    if (query.from || query.to) {
      const from = query.from ? new Date(query.from).getTime() : undefined;
      const to = query.to ? new Date(query.to).getTime() : undefined;

      items = items.filter((item) => {
        if (!item.releaseDate) return false;
        const timestamp = new Date(item.releaseDate).getTime();
        if (Number.isNaN(timestamp)) return false;
        if (from && timestamp < from) return false;
        if (to && timestamp > to) return false;
        return true;
      });
    }

    const total = items.length;
    const start = (page - 1) * perPage;
    const paginatedItems = items.slice(start, start + perPage);

    return { items: paginatedItems, total };
  }

  async getCatalogItem(
    kind: string,
    id: string,
  ): Promise<CatalogSongDetailDto> {
    const song = await this.findSongOrFail(kind, id);
    return this.mapSongToDetail(song);
  }

  async updateCatalogItem(
    kind: string,
    id: string,
    payload: UpdateCatalogItemDto,
  ): Promise<CatalogSongDetailDto> {
    const song = await this.findSongOrFail(kind, id);
    const availability = this.ensureAvailability(song);
    const previousState = this.getEffectiveStatus(
      song.status,
      availability.regions,
    );

    if (payload.status) {
      song.status = payload.status;
    }

    const scope = payload.scope ?? 'global';
    const normalizedRegions = this.normalizeRegions(payload.regions);
    const statusUpdate = payload.status
      ? this.mapStatusToAvailability(payload.status)
      : undefined;

    if (scope === 'global') {
      availability.regions = availability.regions.map((region) => ({
        ...region,
        allowed: statusUpdate?.allowed ?? region.allowed,
        status: statusUpdate?.status ?? region.status,
      }));
    } else if (normalizedRegions.length) {
      normalizedRegions.forEach((code) => {
        const region = this.ensureRegion(availability, code);
        if (statusUpdate) {
          region.allowed = statusUpdate.allowed;
          region.status = statusUpdate.status;
        }
      });
    }

    const newState = this.getEffectiveStatus(song.status, availability.regions);

    this.addAuditEntry(song, {
      action: 'availability-update',
      actor: payload.actor ?? 'system',
      details:
        payload.reason ??
        `Status changed to ${payload.status ?? song.status} with scope ${scope}`,
      scope,
      regions:
        scope === 'regions'
          ? normalizedRegions.map((region) => region.toUpperCase())
          : undefined,
      previousState,
      newState,
    });

    await this.songRepository.flush();
    return this.mapSongToDetail(song);
  }

  async blockCatalogItem(
    kind: string,
    id: string,
    payload: BlockCatalogItemDto,
  ): Promise<CatalogSongDetailDto> {
    const song = await this.findSongOrFail(kind, id);
    const availability = this.ensureAvailability(song);
    const previousState = this.getEffectiveStatus(
      song.status,
      availability.regions,
    );
    const scope = payload.scope ?? 'global';
    const normalizedRegions = this.normalizeRegions(payload.regions);

    if (scope === 'regions' && normalizedRegions.length === 0) {
      throw new BadRequestException(
        'regions are required when scope is regions',
      );
    }

    if (scope === 'global') {
      song.status = 'blocked';
      availability.regions = availability.regions.map((region) => ({
        ...region,
        allowed: false,
        status: 'admin-blocked',
      }));
    } else {
      normalizedRegions.forEach((code) => {
        const region = this.ensureRegion(availability, code);
        region.allowed = false;
        region.status = 'admin-blocked';
      });
    }

    const newState = this.getEffectiveStatus(song.status, availability.regions);

    this.addAuditEntry(song, {
      action: 'blocked-admin',
      actor: payload.actor ?? 'system',
      details:
        scope === 'global'
          ? `Admin block applied globally (${payload.reasonCode})`
          : `Admin block applied to ${normalizedRegions
              .map((region) => region.toUpperCase())
              .join(', ')}`,
      scope,
      regions:
        scope === 'regions'
          ? normalizedRegions.map((region) => region.toUpperCase())
          : undefined,
      reasonCode: payload.reasonCode,
      previousState,
      newState,
    });

    await this.songRepository.flush();
    return this.mapSongToDetail(song);
  }

  async unblockCatalogItem(
    kind: string,
    id: string,
    payload: UnblockCatalogItemDto,
  ): Promise<CatalogSongDetailDto> {
    const song = await this.findSongOrFail(kind, id);
    const availability = this.ensureAvailability(song);
    const previousState = this.getEffectiveStatus(
      song.status,
      availability.regions,
    );

    song.status = 'published';
    availability.regions = availability.regions.map((region) =>
      region.status === 'admin-blocked'
        ? { ...region, allowed: true, status: 'published' }
        : region,
    );

    const newState = this.getEffectiveStatus(song.status, availability.regions);

    this.addAuditEntry(song, {
      action: 'unblocked-admin',
      actor: payload.actor ?? 'system',
      details: 'Admin block removed and availability restored',
      scope: 'global',
      regions: availability.regions.map((region) => region.code),
      previousState,
      newState,
    });

    await this.songRepository.flush();
    return this.mapSongToDetail(song);
  }

  private mapSongToListItem(song: Song): CatalogListItemDto {
    const availability = this.ensureAvailability(song);
    const effectiveStatus = this.getEffectiveStatus(
      song.status,
      availability.regions,
    );
    const releaseDate = song.createdAt?.toISOString();
    const artist =
      song.artists
        .map((artist) => artist.name)
        .filter(Boolean)
        .join(', ') || 'Unknown artist';

    return {
      id: song.id,
      type: 'song',
      title: song.title,
      artist,
      collection: song.albumId ?? '—',
      releaseDate,
      effectiveStatus,
      hasVideo: song.hasVideo,
      regions: availability.regions,
    };
  }

  private mapSongToDetail(song: Song): CatalogSongDetailDto {
    const availability = this.ensureAvailability(song);
    const regions = availability.regions.map((region) => ({
      ...region,
      code: region.code.toUpperCase(),
    }));
    const mainArtist =
      song.artists
        .map((artist) => artist.name)
        .filter(Boolean)
        .join(', ') || 'Unknown artist';

    return {
      id: song.id,
      title: song.title,
      mainArtist,
      collectionId: song.albumId ?? null,
      collectionTitle: song.albumId ?? null,
      position: 1,
      durationMs: song.duration * 1000,
      explicit: false,
      hasVideo: song.hasVideo,
      releaseDate: song.createdAt ? song.createdAt.toISOString() : null,
      status: song.status ?? 'published',
      programmedAt: song.programmedAt,
      availability: {
        policy: availability.policy,
        regions,
      },
      appearances: [],
      auditLog: song.auditLog ?? [],
    };
  }

  private async findSongOrFail(kind: string, id: string): Promise<Song> {
    if (!this.isSongKind(kind)) {
      throw new NotFoundException('Catalog item kind is not supported');
    }

    const song = await this.songRepository.findOne({ id });
    if (!song) {
      throw new NotFoundException('Catalog item not found');
    }

    this.ensureAvailability(song);
    return song;
  }

  private ensureAvailability(song: Song): SongAvailability {
    if (!song.availability) {
      song.availability = { policy: 'global', regions: [] };
    }
    if (!song.availability.regions) {
      song.availability.regions = [];
    }
    return song.availability;
  }

  private ensureRegion(
    availability: SongAvailability,
    code: string,
  ): AvailabilityRegion {
    const existing = availability.regions.find(
      (region) => region.code.toLowerCase() === code.toLowerCase(),
    );
    if (existing) {
      return existing;
    }
    const region: AvailabilityRegion = {
      code: code.toUpperCase(),
      allowed: true,
      status: 'published',
    };
    availability.regions.push(region);
    return region;
  }

  private addAuditEntry(
    song: Song,
    entry: Omit<SongAuditLogEntry, 'id' | 'timestamp'>,
  ) {
    const auditEntry: SongAuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
      actor: entry.actor ?? 'system',
    };

    song.auditLog = [auditEntry, ...(song.auditLog ?? [])];
  }

  private normalizeRegions(regions?: string[]): string[] {
    return Array.from(
      new Set(
        (regions ?? [])
          .map((region) => region.trim())
          .filter(Boolean)
          .map((region) => region.toLowerCase()),
      ),
    );
  }

  private mapStatusToAvailability(status: CatalogStatus): {
    status: AvailabilityStatus;
    allowed: boolean;
  } {
    switch (status) {
      case 'blocked':
        return { status: 'admin-blocked', allowed: false };
      case 'region-blocked':
        return { status: 'region-blocked', allowed: false };
      case 'scheduled':
        return { status: 'scheduled', allowed: true };
      case 'published':
      default:
        return { status: 'published', allowed: true };
    }
  }

  private getEffectiveStatus(
    status: CatalogStatus | undefined,
    regions: AvailabilityRegion[],
  ): EffectiveCatalogStatus {
    const statuses = [status, ...regions.map((region) => region.status)];

    if (
      statuses.some((entry) => entry === 'blocked' || entry === 'admin-blocked')
    ) {
      return 'Bloqueado-admin';
    }

    if (statuses.some((entry) => entry === 'region-blocked')) {
      return 'No-disponible-region';
    }

    if (statuses.some((entry) => entry === 'scheduled')) {
      return 'Programado';
    }

    return 'Publicado';
  }

  private isSongKind(kind: string): boolean {
    const normalizedKind = kind?.toLowerCase();
    return normalizedKind === 'song' || normalizedKind === 'songs';
  }
}

export interface CatalogSongDetailDto {
  id: string;
  title: string;
  mainArtist: string;
  collectionId: string | null;
  collectionTitle: string | null;
  position: number;
  durationMs: number;
  explicit: boolean;
  hasVideo: boolean;
  releaseDate: string | null;
  status: CatalogStatus;
  programmedAt: string | null;
  availability: SongAvailability;
  appearances: Array<{
    type: string;
    title: string;
    owner: string;
    position?: number;
    count?: number;
  }>;
  auditLog: SongAuditLogEntry[];
}
