import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { Song } from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import {
  ensureRegionsExist,
  normalizeRegionCodes,
} from 'src/utils/song-availability.util';
import {
  CatalogListResponseDto,
  CatalogListItemDto,
  CatalogListQueryDto,
} from './dtos/catalog-list.dto';
import {
  BlockCatalogItemDto,
  UnblockCatalogItemDto,
  UpdateAvailabilityDto,
} from './dtos/catalog-actions.dto';

@Injectable()
export class CatalogAdminService {
  constructor(private readonly songRepository: SongRepository) {}

  async listCatalog(
    query: CatalogListQueryDto,
  ): Promise<CatalogListResponseDto> {
    if (query.type && query.type !== 'song') {
      return { items: [], total: 0 };
    }

    const songs = await this.songRepository.findAll();
    const filtered = songs
      .filter((song) => this.matchesQuery(song, query))
      .sort((a, b) => this.sortSongs(a, b, query.sort));

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 25;
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    return {
      total: filtered.length,
      items: paginated.map((song) => this.toCatalogListItem(song)),
    };
  }

  async getCatalogItem(kind: string, id: string): Promise<SongDTO> {
    const song = await this.findSongOrThrow(kind, id);
    return song.toDTO(SongDTO);
  }

  async updateAvailability(
    kind: string,
    id: string,
    payload: UpdateAvailabilityDto,
  ): Promise<SongDTO> {
    const song = await this.findSongOrThrow(kind, id);
    const scope = payload.scope ?? 'global';
    const previousState = song.getEffectiveStatus();

    let regionsForScope: string[] = [];
    if (scope === 'regions') {
      const regions = normalizeRegionCodes(payload.regions);
      regionsForScope = regions;
      if (!regions.length) {
        throw new BadRequestException(
          'Regions are required for regional scope',
        );
      }
      ensureRegionsExist(song.availability, regions);
      song.availability.regions = song.availability.regions.map((region) => {
        if (regions.some((code) => code === region.code.toLowerCase())) {
          const nextStatus = payload.status ?? region.status;
          return {
            ...region,
            allowed: nextStatus !== 'region-blocked',
            status: nextStatus,
          };
        }
        return region;
      });
    } else {
      song.availability.regions = song.availability.regions.map((region) => {
        const nextStatus = payload.status ?? region.status;
        return {
          ...region,
          allowed: nextStatus !== 'region-blocked',
          status: nextStatus,
        };
      });
    }

    song.addAuditEntry({
      action: 'availability-update',
      actor: payload.actor ?? 'system',
      details: payload.reason ?? 'Availability updated',
      scope,
      regions:
        scope === 'regions'
          ? regionsForScope.map((code) => code.toUpperCase())
          : ['GLOBAL'],
      previousState,
      newState: song.getEffectiveStatus(),
    });

    await this.songRepository.flush();
    return song.toDTO(SongDTO);
  }

  async blockItem(
    kind: string,
    id: string,
    payload: BlockCatalogItemDto,
  ): Promise<SongDTO> {
    const song = await this.findSongOrThrow(kind, id);
    const regions =
      payload.scope === 'regions' ? normalizeRegionCodes(payload.regions) : [];
    if (payload.scope === 'regions' && regions.length === 0) {
      throw new BadRequestException('Regions are required for regional blocks');
    }
    if (regions.length) {
      ensureRegionsExist(song.availability, regions);
    }

    const previousState = song.getEffectiveStatus();
    song.adminBlock = {
      scope: payload.scope ?? 'global',
      regions,
      reasonCode: payload.reasonCode,
      actor: payload.actor ?? 'system',
      appliedAt: new Date(),
    };

    song.addAuditEntry({
      action: 'blocked-admin',
      actor: payload.actor ?? 'system',
      details:
        payload.scope === 'global'
          ? `Admin block applied globally (${payload.reasonCode})`
          : `Admin block applied to ${regions.map((code) => code.toUpperCase()).join(', ')}`,
      scope: payload.scope ?? 'global',
      regions:
        payload.scope === 'global'
          ? ['GLOBAL']
          : regions.map((code) => code.toUpperCase()),
      reasonCode: payload.reasonCode,
      previousState,
      newState: song.getEffectiveStatus(),
    });

    await this.songRepository.flush();
    return song.toDTO(SongDTO);
  }

  async unblockItem(
    kind: string,
    id: string,
    payload: UnblockCatalogItemDto,
  ): Promise<SongDTO> {
    const song = await this.findSongOrThrow(kind, id);
    const previousState = song.getEffectiveStatus();
    song.adminBlock = null;
    song.addAuditEntry({
      action: 'unblocked-admin',
      actor: payload.actor ?? 'system',
      details: 'Admin block removed',
      scope: 'global',
      regions: ['GLOBAL'],
      previousState,
      newState: song.getEffectiveStatus(),
    });
    await this.songRepository.flush();
    return song.toDTO(SongDTO);
  }

  private matchesQuery(song: Song, query: CatalogListQueryDto): boolean {
    if (query.hasVideo && (query.hasVideo === 'yes') !== song.hasVideo) {
      return false;
    }
    if (query.q) {
      const haystack = `${song.title} ${song.artists
        .map((artist) => artist.name)
        .join(' ')}`.toLowerCase();
      if (!haystack.includes(query.q.toLowerCase().trim())) {
        return false;
      }
    }
    if (query.status && song.getEffectiveStatus() !== query.status) {
      return false;
    }
    if (query.region) {
      const regionCode = query.region.toLowerCase();
      const availability = song.getAvailabilityForDisplay();
      const match =
        availability.find(
          (region) => region.code.toLowerCase() === regionCode,
        ) ??
        availability.find((region) => region.code.toLowerCase() === 'global');
      if (!match) {
        return false;
      }
      if (!match.allowed) {
        return false;
      }
    }
    if (query.from) {
      const from = new Date(query.from).getTime();
      if (!Number.isNaN(from) && song.createdAt.getTime() < from) {
        return false;
      }
    }
    if (query.to) {
      const to = new Date(query.to).getTime();
      if (!Number.isNaN(to) && song.createdAt.getTime() > to) {
        return false;
      }
    }
    return true;
  }

  private sortSongs(
    a: Song,
    b: Song,
    sort: 'recent' | 'title' = 'recent',
  ): number {
    if (sort === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  }

  private toCatalogListItem(song: Song): CatalogListItemDto {
    return {
      type: 'song',
      id: song.id,
      title: song.title,
      artist: song.artists.map((artist) => artist.name).join(', '),
      collection: song.albumId ?? 'Single',
      releaseDate: song.createdAt.toISOString(),
      effectiveStatus: song.getEffectiveStatus(),
      hasVideo: song.hasVideo,
      regions: song.getAvailabilityForDisplay(),
    };
  }

  private async findSongOrThrow(kind: string, id: string): Promise<Song> {
    if (kind !== 'song') {
      throw new NotFoundException('Only song catalog entries are available');
    }
    const song = await this.songRepository.findOne({ id });
    if (!song) {
      throw new NotFoundException('Catalog item not found');
    }
    return song;
  }
}
