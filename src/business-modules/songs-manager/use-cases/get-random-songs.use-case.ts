import { Injectable } from '@nestjs/common';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import type { SongStatus } from 'src/entity-modules/song/song.entity';

@Injectable()
export class GetRandomSongsUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(
    limit: number,
    page: number,
    publishedOnly: boolean = true,
  ): Promise<SongDTO[]> {
    const filter = publishedOnly ? { status: 'published' as SongStatus } : {};
    const songs = await this.songRepository.find(filter, {
      limit,
      offset: (page - 1) * limit,
    });
    return songs.map((song) => song.toDTO(SongDTO));
  }
}
