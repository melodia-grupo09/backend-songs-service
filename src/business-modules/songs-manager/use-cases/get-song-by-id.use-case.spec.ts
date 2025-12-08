import { NotFoundException } from '@nestjs/common';
import { GetSongByIdUseCase } from './get-song-by-id.use-case';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';

describe('GetSongByIdUseCase', () => {
  const mockRepository = {
    findOne: jest.fn(),
  };
  const useCase = new GetSongByIdUseCase(
    mockRepository as unknown as SongRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws when no song matches the requested id', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });

  it('fills the default availability regions before returning the DTO', async () => {
    const stubSong = {
      availability: { policy: 'custom-policy', regions: [] },
      toDTO: jest
        .fn()
        .mockReturnValue({ id: 'song-1', title: 'Example' } as SongDTO),
    };
    mockRepository.findOne.mockResolvedValue(stubSong);

    const result = await useCase.execute('song-1');

    expect(stubSong.availability.regions).toEqual([
      { code: 'global', allowed: true, status: 'published' },
    ]);
    expect(stubSong.toDTO).toHaveBeenCalledWith(SongDTO);
    expect(result).toEqual({ id: 'song-1', title: 'Example' });
  });
});
