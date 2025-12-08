import { Injectable } from '@nestjs/common';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { getEffectiveStatus } from 'src/utils/status.util';

interface ListSongsParams {
  q?: string;
  page: number;
  limit: number;
  status?: string;
  hasVideo?: 'yes' | 'no';
  region?: string;
  from?: string;
  to?: string;
  sort?: 'recent' | 'title';
}

@Injectable()
export class ListSongsUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(params: ListSongsParams) {
    const { page, limit } = params;
    const songs = await this.songRepository.listWithFilters(params);

    const filtered = songs
      .map((song) => {
        if (!song.availability?.regions?.length) {
          song.availability = {
            policy: song.availability?.policy ?? 'global-allow',
            regions: [{ code: 'global', allowed: true, status: 'published' }],
          };
        }
        return song;
      })
      .filter((song) => {
        if (params.status) {
          const effective = getEffectiveStatus(
            song.status,
            song.availability?.regions ?? [],
          );
          if (effective !== params.status) return false;
        }
        return true;
      });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((song) => {
      const effectiveStatus = getEffectiveStatus(
        song.status,
        song.availability?.regions ?? [],
      );
      return {
        id: song.id,
        type: 'song',
        title: song.title,
        artist: song.artists?.[0]?.name ?? 'Unknown artist',
        collection: song.albumId ?? 'Single',
        releaseDate: song.releaseDate ?? undefined,
        effectiveStatus,
        hasVideo: song.hasVideo,
        regions: song.availability?.regions ?? [],
      };
    });

    return { items, total };
  }
}
