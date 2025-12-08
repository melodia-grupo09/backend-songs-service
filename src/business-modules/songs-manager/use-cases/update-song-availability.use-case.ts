import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AvailabilityRegion,
  Song,
  SongStatus,
} from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { getEffectiveStatus } from 'src/utils/status.util';

export interface UpdateSongAvailabilityPayload {
  status?: SongStatus;
  scope?: 'global' | 'regions';
  regions?: string[];
  reason?: string;
  actor?: string;
  validFrom?: string;
  validTo?: string;
}

@Injectable()
export class UpdateSongAvailabilityUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  private ensureRegion(song: Song, code: string): AvailabilityRegion {
    const lowerCode = code.toLowerCase();
    const existing = song.availability.regions.find(
      (region) => region.code.toLowerCase() === lowerCode,
    );
    if (existing) return existing;
    const created: AvailabilityRegion = {
      code: lowerCode,
      allowed: true,
      status: 'published',
    };
    song.availability.regions.push(created);
    return created;
  }

  async execute(id: string, payload: UpdateSongAvailabilityPayload) {
    const song = await this.songRepository.findOne({ id });
    if (!song) throw new NotFoundException(`Song with ID ${id} not found`);
    if (!song.availability?.regions?.length) {
      song.availability = {
        policy: song.availability?.policy ?? 'global-allow',
        regions: [{ code: 'global', allowed: true, status: 'published' }],
      };
    }

    const previousState = getEffectiveStatus(
      song.status,
      song.availability.regions,
    );

    if (payload.status) {
      song.status = payload.status;
    }

    const resolveRegionStatus = (
      value: SongStatus | AvailabilityRegion['status'] | undefined,
    ): AvailabilityRegion['status'] => {
      if (!value) return 'published';
      return value === 'blocked' ? 'admin-blocked' : value;
    };

    if (payload.scope === 'global') {
      song.availability.regions = song.availability.regions.map((region) => ({
        ...region,
        allowed: payload.status !== 'region-blocked',
        status: resolveRegionStatus(payload.status ?? region.status),
      }));
    } else if (payload.scope === 'regions' && payload.regions?.length) {
      payload.regions.forEach((code) => {
        const regionEntry = this.ensureRegion(song, code);
        regionEntry.allowed = payload.status !== 'region-blocked';
        regionEntry.status = resolveRegionStatus(
          payload.status ?? regionEntry.status,
        );
      });
    }

    const newState = getEffectiveStatus(song.status, song.availability.regions);
    const validityNote =
      payload.validFrom || payload.validTo
        ? ` | validity ${payload.validFrom ?? 'immediate'} - ${
            payload.validTo ?? 'no end'
          }`
        : '';
    song.addAuditEntry({
      action: 'availability-update',
      actor: payload.actor ?? 'admin',
      details:
        payload.reason ??
        `Availability changed to ${payload.status ?? 'updated'} (${payload.scope ?? 'global'})${validityNote}`,
      scope: payload.scope,
      regions: payload.regions?.map((code) => code.toUpperCase()),
      previousState,
      newState,
    });

    await this.songRepository.persistAndFlush(song);
    return song;
  }
}
