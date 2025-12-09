import { NotFoundException } from '@nestjs/common';
import { BlockSongUseCase } from './block-song.use-case';
import { Song } from 'src/entity-modules/song/song.entity';

const createSong = (): Song =>
  ({
    id: 'song-1',
    status: 'published',
    availability: {
      policy: 'global-allow',
      regions: [{ code: 'global', allowed: true, status: 'published' }],
    },
    artists: [],
    albumId: null,
    duration: 180,
    hasVideo: false,
    addAuditEntry: jest.fn(),
    setHasVideo: jest.fn(),
    toDTO: jest.fn().mockReturnValue({
      id: 'song-1',
      title: 'Test Song',
    }),
    appearances: [],
    auditLog: [],
    programmedAt: null,
  }) as unknown as Song;

describe('BlockSongUseCase', () => {
  const mockRepository = {
    findOne: jest.fn(),
    persistAndFlush: jest.fn(),
  };
  const useCase = new BlockSongUseCase(mockRepository as any);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws when the requested song is missing', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', { reasonCode: 'policy' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('applies a global admin block', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    const result = await useCase.execute('song-1', { reasonCode: 'legal' });

    expect(song.status).toBe('blocked');
    expect(
      song.availability.regions.every(
        (region) => region.status === 'admin-blocked',
      ),
    ).toBe(true);
    expect(mockRepository.persistAndFlush).toHaveBeenCalledWith(song);
    expect(result.id).toBe('song-1');
    expect(result.availability).toBe(song.availability);
    expect(result.auditLog).toBe(song.auditLog);
  });

  it('applies a regional block when regions list is provided', async () => {
    const song = createSong();
    song.availability.regions = [
      { code: 'ar', allowed: true, status: 'published' },
    ];
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      reasonCode: 'policy',
      scope: 'regions',
      regions: ['mx'],
    });

    expect(
      song.availability.regions.find((region) => region.code === 'mx'),
    ).toBeDefined();
    expect(
      song.availability.regions.some(
        (region) => region.code === 'mx' && region.status === 'admin-blocked',
      ),
    ).toBe(true);
  });
});
