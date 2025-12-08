import { ListSongsUseCase } from './list-songs.use-case';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { ReleaseInfoService } from '../services/release-info.service';
import type { Song } from 'src/entity-modules/song/song.entity';

const createSong = (overrides: Partial<Song> = {}): Song =>
  ({
    id: overrides.id ?? 'song-default',
    title: overrides.title ?? 'Test song',
    artists: overrides.artists ?? [{ id: 'artist-1', name: 'Artist' }],
    albumId: overrides.albumId ?? 'album-1',
    duration: overrides.duration ?? 180,
    hasVideo: overrides.hasVideo ?? false,
    releaseDate: overrides.releaseDate ?? '2024-01-01',
    status: overrides.status ?? 'published',
    availability: overrides.availability ?? {
      policy: 'global-allow',
      regions: [],
    },
  }) as Song;

describe('ListSongsUseCase', () => {
  const mockRepository = {
    listWithFilters: jest.fn(),
  };
  const mockReleaseInfoService = {
    getReleaseDates: jest.fn(),
  };
  const useCase = new ListSongsUseCase(
    mockRepository as unknown as SongRepository,
    mockReleaseInfoService as unknown as ReleaseInfoService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mockReleaseInfoService.getReleaseDates.mockResolvedValue({});
  });

  it('adds the global region when no regions exist and returns paging info', async () => {
    const song = createSong({
      availability: { policy: 'global-allow', regions: [] },
    });
    mockRepository.listWithFilters.mockResolvedValue([song]);

    const result = await useCase.execute({ page: 1, limit: 5 });

    expect(song.availability.regions).toEqual([
      { code: 'global', allowed: true, status: 'published' },
    ]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].regions).toEqual(song.availability.regions);
    expect(result.total).toBe(1);
    expect(mockRepository.listWithFilters).toHaveBeenCalledWith({
      page: 1,
      limit: 5,
    });
  });

  it('filters songs by the requested effective status', async () => {
    const regionBlockedSong = createSong({
      id: 'region-blocked',
      availability: {
        policy: 'global-allow',
        regions: [{ code: 'ar', allowed: false, status: 'region-blocked' }],
      },
    });
    const publishedSong = createSong({
      id: 'published',
      availability: {
        policy: 'global-allow',
        regions: [{ code: 'global', allowed: true, status: 'published' }],
      },
    });
    mockRepository.listWithFilters.mockResolvedValue([
      regionBlockedSong,
      publishedSong,
    ]);

    const result = await useCase.execute({
      page: 1,
      limit: 10,
      status: 'Region blocked',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('region-blocked');
    expect(result.items[0].effectiveStatus).toBe('Region blocked');
  });

  it('prefers release info when available and falls back to the entity date', async () => {
    const song = createSong({
      id: 'release-song',
      albumId: 'release-123',
      releaseDate: '2024-01-01',
    });
    mockRepository.listWithFilters.mockResolvedValue([song]);

    mockReleaseInfoService.getReleaseDates.mockResolvedValueOnce({
      'release-123': '2024-05-02T00:00:00.000Z',
    });
    const result = await useCase.execute({ page: 1, limit: 5 });
    expect(mockReleaseInfoService.getReleaseDates).toHaveBeenCalledWith([
      'release-123',
    ]);
    expect(result.items[0].releaseDate).toBe('2024-05-02T00:00:00.000Z');

    mockReleaseInfoService.getReleaseDates.mockResolvedValueOnce({});
    const fallbackResult = await useCase.execute({ page: 1, limit: 5 });
    expect(fallbackResult.items[0].releaseDate).toBe(
      new Date('2024-01-01').toISOString(),
    );
  });
});
