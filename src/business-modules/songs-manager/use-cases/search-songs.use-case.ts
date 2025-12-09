import { Injectable } from '@nestjs/common';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';

@Injectable()
export class SearchSongsUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(
    query: string,
    limit: number,
    page: number,
    publishedOnly: boolean = true,
  ): Promise<SongDTO[]> {
    const songs = await this.songRepository.searchByText(
      query,
      limit,
      page,
      publishedOnly,
    );
    return songs.map((song) => song.toDTO(SongDTO));
  }
}
