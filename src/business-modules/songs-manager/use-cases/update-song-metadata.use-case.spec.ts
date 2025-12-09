import { NotFoundException } from '@nestjs/common';
import { UpdateSongMetadataUseCase } from './update-song-metadata.use-case';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { Song } from 'src/entity-modules/song/song.entity';

describe('UpdateSongMetadataUseCase', () => {
  let useCase: UpdateSongMetadataUseCase;
  let mockSongRepository: jest.Mocked<SongRepository>;

  beforeEach(() => {
    mockSongRepository = {
      findOne: jest.fn(),
      flush: jest.fn(),
    } as unknown as jest.Mocked<SongRepository>;

    useCase = new UpdateSongMetadataUseCase(mockSongRepository);
  });

  const createMockSong = (): Song => {
    const song = {
      id: 'test-song-id',
      title: 'Original Title',
      artists: [{ id: 'artist1', name: 'Original Artist' }],
      albumId: 'album1',
      duration: 180,
      releaseDate: new Date('2024-01-01'),
      hasVideo: false,
      status: 'published',
      availability: {
        policy: 'global-allow',
        regions: [{ code: 'global', allowed: true, status: 'published' }],
      },
      auditLog: [],
      toDTO: jest.fn().mockReturnValue({
        id: 'test-song-id',
        title: 'Original Title',
        artists: [{ id: 'artist1', name: 'Original Artist' }],
        albumId: 'album1',
        duration: 180,
        releaseDate: new Date('2024-01-01'),
        hasVideo: false,
        status: 'published',
      }),
    } as unknown as Song;
    return song;
  };

  it('should throw NotFoundException when song does not exist', async () => {
    mockSongRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent-id', { title: 'New Title' }),
    ).rejects.toThrow(NotFoundException);

    expect(mockSongRepository.findOne).toHaveBeenCalledWith({
      id: 'non-existent-id',
    });
  });

  it('should update only the title when only title is provided', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    await useCase.execute('test-song-id', { title: 'Updated Title' });

    expect(mockSong.title).toBe('Updated Title');
    expect(mockSong.artists).toEqual([
      { id: 'artist1', name: 'Original Artist' },
    ]);
    expect(mockSong.duration).toBe(180);
    expect(mockSongRepository.flush).toHaveBeenCalled();
  });

  it('should update only the artists when only artists are provided', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    const newArtists = [
      { id: 'artist2', name: 'New Artist 1' },
      { id: 'artist3', name: 'New Artist 2' },
    ];

    await useCase.execute('test-song-id', { artists: newArtists });

    expect(mockSong.title).toBe('Original Title');
    expect(mockSong.artists).toEqual(newArtists);
    expect(mockSongRepository.flush).toHaveBeenCalled();
  });

  it('should update multiple fields when provided', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    const newArtists = [{ id: 'artist4', name: 'Multi Artist' }];
    const newReleaseDate = new Date('2025-06-01');

    await useCase.execute('test-song-id', {
      title: 'Multi Update',
      artists: newArtists,
      duration: 240,
      albumId: 'new-album',
      releaseDate: newReleaseDate,
    });

    expect(mockSong.title).toBe('Multi Update');
    expect(mockSong.artists).toEqual(newArtists);
    expect(mockSong.duration).toBe(240);
    expect(mockSong.albumId).toBe('new-album');
    expect(mockSong.releaseDate).toEqual(newReleaseDate);
    expect(mockSongRepository.flush).toHaveBeenCalled();
  });

  it('should allow setting albumId to null', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    await useCase.execute('test-song-id', { albumId: null });

    expect(mockSong.albumId).toBeNull();
    expect(mockSongRepository.flush).toHaveBeenCalled();
  });

  it('should allow setting releaseDate to null', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    await useCase.execute('test-song-id', { releaseDate: null });

    expect(mockSong.releaseDate).toBeNull();
    expect(mockSongRepository.flush).toHaveBeenCalled();
  });

  it('should initialize availability if missing', async () => {
    const mockSong = createMockSong();
    mockSong.availability = { policy: 'global-allow', regions: [] };
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    const result = await useCase.execute('test-song-id', {
      title: 'Updated Title',
    });

    expect(result.availability).toBeDefined();
    expect(result.availability.regions).toHaveLength(1);
    expect(result.availability.regions[0]).toEqual({
      code: 'global',
      allowed: true,
      status: 'published',
    });
  });

  it('should return a complete SongDTO with availability and auditLog', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    const result = await useCase.execute('test-song-id', {
      title: 'DTO Test Title',
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('availability');
    expect(result).toHaveProperty('auditLog');
    expect(mockSong.toDTO).toHaveBeenCalled();
  });

  it('should not update fields that are not provided', async () => {
    const mockSong = createMockSong();
    mockSongRepository.findOne.mockResolvedValue(mockSong);

    await useCase.execute('test-song-id', {}); // empty payload

    expect(mockSong.title).toBe('Original Title');
    expect(mockSong.artists).toEqual([
      { id: 'artist1', name: 'Original Artist' },
    ]);
    expect(mockSong.duration).toBe(180);
    expect(mockSongRepository.flush).toHaveBeenCalled();
  });
});
