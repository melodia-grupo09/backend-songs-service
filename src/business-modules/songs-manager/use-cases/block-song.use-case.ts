import { Injectable, NotFoundException } from '@nestjs/common';
import { Song } from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { getEffectiveStatus } from 'src/utils/status.util';

interface BlockSongPayload {
  scope?: 'global' | 'regions';
  regions?: string[];
  reasonCode: string;
  actor?: string;
}

@Injectable()
export class BlockSongUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  private ensureRegion(song: Song, code: string) {
    const lowerCode = code.toLowerCase();
    const existing = song.availability.regions.find(
      (region) => region.code.toLowerCase() === lowerCode,
    );
    if (existing) return existing;
    const created = {
      code: lowerCode,
      allowed: true,
      status: 'published' as const,
    };
    song.availability.regions.push(created);
    return created;
  }

  async execute(id: string, payload: BlockSongPayload) {
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

    const scope = payload.scope ?? 'global';
    if (scope === 'global') {
      song.status = 'blocked';
      song.availability.regions = song.availability.regions.map((region) => ({
        ...region,
        allowed: false,
        status: 'admin-blocked',
      }));
    } else if (payload.regions?.length) {
      payload.regions.forEach((code) => {
        const regionEntry = this.ensureRegion(song, code);
        regionEntry.allowed = false;
        regionEntry.status = 'admin-blocked';
      });
    }

    const newState = getEffectiveStatus(song.status, song.availability.regions);
    song.addAuditEntry({
      action: 'blocked-admin',
      actor: payload.actor ?? 'admin',
      details:
        scope === 'global'
          ? `Admin block applied globally (${payload.reasonCode})`
          : `Admin block applied to ${(payload.regions ?? []).join(', ')}`,
      scope,
      regions: payload.regions?.map((code) => code.toUpperCase()),
      reasonCode: payload.reasonCode,
      previousState,
      newState,
    });

    await this.songRepository.persistAndFlush(song);
    return song;
  }
}
