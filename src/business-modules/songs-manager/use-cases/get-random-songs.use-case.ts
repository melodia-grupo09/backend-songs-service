import { Injectable } from '@nestjs/common';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';

@Injectable()
export class GetRandomSongsUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(limit: number, page: number): Promise<SongDTO[]> {
    const songs = await this.songRepository.find(
      {},
      {
        limit,
        offset: (page - 1) * limit,
      },
    );
    return songs.map((song) => song.toDTO(SongDTO));
  }
}
