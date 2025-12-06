import 'reflect-metadata';
jest.mock('src/entity-modules/song/song.dto', () => ({
  SongDTO: class {},
}));

import { CatalogAdminService } from './catalog-admin.service';
import { Song } from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { CatalogListQueryDto } from './dtos/catalog-list.dto';
import type { SongDTO } from 'src/entity-modules/song/song.dto';

describe('CatalogAdminService', () => {
  let service: CatalogAdminService;
  let songRepository: SongRepository;
  let findAll: jest.Mock;
  let findOne: jest.Mock;
  let flush: jest.Mock;

  beforeEach(() => {
    findAll = jest.fn();
    findOne = jest.fn();
    flush = jest.fn();
    songRepository = {
      findAll,
      findOne,
      flush,
    } as unknown as SongRepository;
    service = new CatalogAdminService(songRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  let songCounter = 0;

  const createSong = (overrides: Partial<Song> = {}): Song => {
    songCounter += 1;
    const song = new Song(
      overrides.title ?? 'Test song',
      overrides.artists ?? [{ id: 'artist-1', name: 'Artist 1' }],
      overrides.albumId ?? null,
      overrides.duration ?? 180,
    );
    song.id = overrides.id ?? `song-${songCounter}`;
    song.createdAt =
      overrides.createdAt ?? new Date('2024-01-01T00:00:00.000Z');
    Object.assign(song, overrides);
    jest.spyOn(song, 'toDTO').mockImplementation(
      () =>
        ({
          id: song.id,
          createdAt: song.createdAt.toISOString(),
          updatedAt: song.updatedAt.toISOString(),
          title: song.title,
          artists: song.artists,
          duration: song.duration,
          status: song.status,
          programmedAt: song.programmedAt?.toISOString() ?? null,
          hasVideo: song.hasVideo,
          effectiveStatus: song.getEffectiveStatus(),
          availability: {
            policy: song.availability.policy,
            regions: song.getAvailabilityForDisplay(),
          },
          auditLog: song.auditLog.map((entry) => ({
            ...entry,
            timestamp: entry.timestamp.toISOString(),
          })),
        }) as SongDTO,
    );
    return song;
  };

  it('filters catalog entries by hasVideo flag', async () => {
    const audioOnly = createSong({
      id: 'audio-only',
      hasVideo: false,
      createdAt: new Date('2024-01-05T00:00:00.000Z'),
    });
    const withVideo = createSong({
      id: 'with-video',
      hasVideo: true,
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    });
    findAll.mockResolvedValue([audioOnly, withVideo]);

    const query = { hasVideo: 'yes' } as CatalogListQueryDto;
    const result = await service.listCatalog(query);

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('with-video');
    expect(result.items[0].hasVideo).toBe(true);
  });

  it('applies a global admin block and records an audit entry', async () => {
    const song = createSong({ id: 'song-1' });
    findOne.mockResolvedValue(song);

    const response = await service.blockItem('song', 'song-1', {
      scope: 'global',
      reasonCode: 'legal',
      actor: 'admin-user',
    });

    expect(findOne).toHaveBeenCalledWith({ id: 'song-1' });
    expect(song.adminBlock).toMatchObject({
      scope: 'global',
      regions: [],
      reasonCode: 'legal',
      actor: 'admin-user',
    });
    expect(song.adminBlock?.appliedAt).toBeInstanceOf(Date);
    expect(song.auditLog[0]).toMatchObject({
      action: 'blocked-admin',
      actor: 'admin-user',
      scope: 'global',
      regions: ['GLOBAL'],
      reasonCode: 'legal',
      previousState: 'Publicado',
      newState: 'Bloqueado-admin',
    });
    expect(response.hasVideo).toBe(song.hasVideo);
    expect(flush).toHaveBeenCalled();
  });

  it('updates regional availability and audits the change', async () => {
    const song = createSong({ id: 'song-2' });
    findOne.mockResolvedValue(song);

    const result = await service.updateAvailability('song', 'song-2', {
      scope: 'regions',
      regions: ['ar'],
      status: 'region-blocked',
      actor: 'ops-user',
      reason: 'Temporary takedown',
    });

    const regionalEntry = song.availability.regions.find(
      (region) => region.code === 'AR',
    );
    expect(regionalEntry).toMatchObject({
      code: 'AR',
      status: 'region-blocked',
      allowed: false,
    });
    expect(song.auditLog[0]).toMatchObject({
      action: 'availability-update',
      actor: 'ops-user',
      scope: 'regions',
      regions: ['AR'],
      previousState: 'Publicado',
      newState: 'No-disponible-region',
    });
    expect(result.availability.regions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'AR', allowed: false }),
      ]),
    );
    expect(flush).toHaveBeenCalled();
  });
});
