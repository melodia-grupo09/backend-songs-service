import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogAdminService } from './catalog-admin.service';
import { Song } from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';

describe('CatalogAdminService', () => {
  let service: CatalogAdminService;
  let songRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    flush: jest.Mock;
  };

  beforeEach(() => {
    songRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      flush: jest.fn(),
    };
    service = new CatalogAdminService(
      songRepository as unknown as SongRepository,
    );
  });

  const buildSong = (id: string, title = 'Test song') => {
    const song = new Song(
      title,
      [{ id: 'artist-1', name: 'Artist 1' }],
      null,
      200,
    );
    song.id = id;
    song.createdAt = new Date('2024-01-01T00:00:00Z');
    return song;
  };

  it('filters the catalog list by effective status', async () => {
    const publishedSong = buildSong('song-1', 'Published');
    const blockedSong = buildSong('song-2', 'Blocked');
    blockedSong.status = 'blocked';
    blockedSong.availability.regions = [
      { code: 'ar', allowed: false, status: 'admin-blocked' },
    ];

    songRepository.find.mockResolvedValue([publishedSong, blockedSong]);

    const result = await service.listCatalog({
      status: 'Bloqueado-admin',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('song-2');
  });

  it('maps song details with derived fields', async () => {
    const song = buildSong('song-3', 'Anthem');
    song.artists = [
      { id: 'a1', name: 'Artist One' },
      { id: 'a2', name: 'Artist Two' },
    ];
    song.albumId = 'album-9';
    song.hasVideo = true;
    song.duration = 180;
    song.availability.regions = [
      { code: 'br', allowed: true, status: 'published' },
    ];

    songRepository.findOne.mockResolvedValue(song);

    const detail = await service.getCatalogItem('song', 'song-3');

    expect(detail.mainArtist).toBe('Artist One, Artist Two');
    expect(detail.durationMs).toBe(180000);
    expect(detail.collectionId).toBe('album-9');
    expect(detail.availability.regions[0].code).toBe('BR');
  });

  it('applies a global admin block and records an audit entry', async () => {
    const song = buildSong('song-4', 'To Block');
    song.availability.regions = [
      { code: 'mx', allowed: true, status: 'published' },
    ];

    songRepository.findOne.mockResolvedValue(song);
    songRepository.flush.mockResolvedValue(undefined);

    const result = await service.blockCatalogItem('song', 'song-4', {
      scope: 'global',
      reasonCode: 'legal',
      actor: 'tester',
    });

    expect(song.status).toBe('blocked');
    expect(song.availability.regions[0].status).toBe('admin-blocked');
    expect(song.availability.regions[0].allowed).toBe(false);
    expect(song.auditLog[0].action).toBe('blocked-admin');
    expect(result.auditLog[0].reasonCode).toBe('legal');
    expect(songRepository.flush).toHaveBeenCalled();
  });

  it('restores availability on unblock', async () => {
    const song = buildSong('song-5', 'To Unblock');
    song.status = 'blocked';
    song.availability.regions = [
      { code: 'cl', allowed: false, status: 'admin-blocked' },
    ];
    songRepository.findOne.mockResolvedValue(song);
    songRepository.flush.mockResolvedValue(undefined);

    const result = await service.unblockCatalogItem('song', 'song-5', {
      actor: 'tester',
    });

    expect(song.status).toBe('published');
    expect(song.availability.regions[0]).toMatchObject({
      allowed: true,
      status: 'published',
    });
    expect(result.auditLog[0].action).toBe('unblocked-admin');
  });

  it('throws when attempting to block without regions in regional scope', async () => {
    const song = buildSong('song-6', 'Regional Block');
    songRepository.findOne.mockResolvedValue(song);

    await expect(
      service.blockCatalogItem('song', 'song-6', {
        scope: 'regions',
        reasonCode: 'legal',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported catalog kinds', async () => {
    await expect(
      service.getCatalogItem('collection', 'id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
