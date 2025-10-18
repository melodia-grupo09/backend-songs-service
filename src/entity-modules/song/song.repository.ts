import { Song } from './song.entity';
import { BaseRepository } from '../base.repository';

export class SongRepository extends BaseRepository<Song> {
  async searchByText(
    query: string,
    limit: number,
    page: number,
  ): Promise<Song[]> {
    return this.find(
      {
        title: new RegExp(query, 'i'),
      },
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: 'ASC' },
      },
    );
  }
}
