import { Song } from './song.entity';
import { BaseRepository } from '../base.repository';
import { FilterQuery, QueryOrder } from '@mikro-orm/mongodb';

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

  async listWithFilters(params: {
    q?: string;
    status?: string;
    hasVideo?: 'yes' | 'no';
    region?: string;
    from?: string;
    to?: string;
    sort?: 'recent' | 'title';
  }): Promise<Song[]> {
    const filters: FilterQuery<Song> = {};
    if (params.q) filters.title = new RegExp(params.q, 'i');
    if (params.hasVideo) filters.hasVideo = params.hasVideo === 'yes';
    if (params.region)
      filters['availability.regions.code'] = params.region.toLowerCase();

    if (params.from || params.to) {
      filters.releaseDate = {};
      if (params.from)
        (filters.releaseDate as any).$gte = new Date(params.from);
      if (params.to) (filters.releaseDate as any).$lte = new Date(params.to);
    }

    const orderBy =
      params.sort === 'title'
        ? { title: QueryOrder.ASC }
        : { releaseDate: QueryOrder.DESC, createdAt: QueryOrder.DESC };

    return this.find(filters, { orderBy });
  }
}
