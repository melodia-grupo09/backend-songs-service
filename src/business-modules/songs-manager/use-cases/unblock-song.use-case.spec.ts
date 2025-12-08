import { NotFoundException } from '@nestjs/common';
import { UnblockSongUseCase } from './unblock-song.use-case';
import { Song } from 'src/entity-modules/song/song.entity';

const createSong = (): Song =>
  ({
    id: 'song-1',
    status: 'blocked',
    availability: {
      policy: 'global-allow',
      regions: [
        { code: 'global', allowed: false, status: 'admin-blocked' },
        { code: 'ar', allowed: false, status: 'admin-blocked' },
      ],
    },
    artists: [],
    albumId: null,
    duration: 180,
    hasVideo: false,
    addAuditEntry: jest.fn(),
    setHasVideo: jest.fn(),
    appearances: [],
    auditLog: [],
    programmedAt: null,
  }) as unknown as Song;

describe('UnblockSongUseCase', () => {
  const mockRepository = {
    findOne: jest.fn(),
    persistAndFlush: jest.fn(),
  };
  const useCase = new UnblockSongUseCase(mockRepository as any);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws when the song does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    await expect(useCase.execute('missing', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('restores blocked songs to published status', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', { actor: 'admin-user' });

    expect(song.status).toBe('published');
    expect(song.availability.regions.every((region) => region.allowed)).toBe(
      true,
    );
    expect(
      song.availability.regions.every(
        (region) => region.status !== 'admin-blocked',
      ),
    ).toBe(true);
    expect(mockRepository.persistAndFlush).toHaveBeenCalledWith(song);
  });
});
