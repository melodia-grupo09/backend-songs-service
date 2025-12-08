import { Injectable, NotFoundException } from '@nestjs/common';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { getEffectiveStatus } from 'src/utils/status.util';

interface UnblockSongPayload {
  actor?: string;
}

@Injectable()
export class UnblockSongUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(id: string, payload: UnblockSongPayload) {
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

    song.status = song.status === 'blocked' ? 'published' : song.status;
    song.availability.regions = song.availability.regions.map((region) => ({
      ...region,
      allowed: true,
      status: region.status === 'admin-blocked' ? 'published' : region.status,
    }));

    const newState = getEffectiveStatus(song.status, song.availability.regions);
    song.addAuditEntry({
      action: 'unblocked-admin',
      actor: payload.actor ?? 'admin',
      details: 'Admin block removed and availability restored',
      scope: 'global',
      previousState,
      newState,
    });

    await this.songRepository.persistAndFlush(song);
    return song;
  }
}
