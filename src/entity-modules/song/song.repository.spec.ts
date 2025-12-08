import { QueryOrder } from '@mikro-orm/mongodb';
import { SongRepository } from './song.repository';

describe('SongRepository.listWithFilters', () => {
  it('builds filters from the provided params and sorts by release date desc when sort is recent', async () => {
    const findMock = jest.fn().mockResolvedValue([]);
    const repo = { find: findMock } as unknown as SongRepository;

    const params = {
      q: 'Beat',
      hasVideo: 'yes',
      region: 'US',
      sort: 'recent' as const,
      from: '2024-01-01',
      to: '2024-01-31',
    };

    await SongRepository.prototype.listWithFilters.call(repo, params);

    expect(findMock).toHaveBeenCalledWith(
      {
        title: new RegExp(params.q, 'i'),
        hasVideo: true,
        'availability.regions.code': 'us',
        releaseDate: {
          $gte: new Date(params.from),
          $lte: new Date(params.to),
        },
      },
      {
        orderBy: { releaseDate: QueryOrder.DESC, createdAt: QueryOrder.DESC },
      },
    );
  });

  it('uses title sorting when requested and sanitizes region casing', async () => {
    const findMock = jest.fn().mockResolvedValue([]);
    const repo = { find: findMock } as unknown as SongRepository;

    await SongRepository.prototype.listWithFilters.call(repo, {
      sort: 'title',
      region: 'Ar',
      hasVideo: 'no',
    });

    expect(findMock).toHaveBeenCalledWith(
      {
        hasVideo: false,
        'availability.regions.code': 'ar',
      },
      {
        orderBy: { title: QueryOrder.ASC },
      },
    );
  });
});
