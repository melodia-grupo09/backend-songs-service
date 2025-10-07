import { Song } from './song.entity';
import { BaseRepository } from '../base.repository';

export class SongRepository extends BaseRepository<Song> {
  async searchByText(
    query: string,
    limit: number,
    page: number,
  ): Promise<Song[]> {
    const filter = { $fulltext: query };
    const options = {
      fields: ['*', { score: { $meta: 'textScore' } }],
      limit,
      offset: (page - 1) * limit,
      orderBy: { score: { $meta: 'textScore' } },
    };

    return this.find(filter as any, options as any);
  }
}
