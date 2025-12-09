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
      id: 'song-1',
      status: 'published',
      availability: { policy: 'custom-policy', regions: [] },
      auditLog: [],
      toDTO: jest.fn().mockReturnValue({
        id: 'song-1',
        title: 'Example',
      } as unknown as SongDTO),
    };
    mockRepository.findOne.mockImplementation((query: any) =>
      query.id === 'song-1' ? Promise.resolve(stubSong) : Promise.resolve(null),
    );

    const result = await useCase.execute('song-1');

    expect(stubSong.availability.regions).toEqual([
      { code: 'global', allowed: true, status: 'published' },
    ]);
    expect(stubSong.toDTO).toHaveBeenCalledWith(SongDTO);
    expect(result).toMatchObject({ id: 'song-1', title: 'Example' });
    expect(result.availability).toBe(stubSong.availability);
    expect(result.auditLog).toEqual([]);
  });

  it('returns the entity availability and audit log after transformation', async () => {
    const availability = {
      policy: 'global-allow',
      regions: [{ code: 'ar', allowed: true, status: 'published' }],
    };
    const auditLog = [
      {
        id: 'audit-1',
        timestamp: '2025-12-09T14:09:48.912Z',
        action: 'blocked-admin',
        actor: 'lucia.arias',
        details: 'Test audit entry',
      },
    ];
    const stubSong = {
      id: 'song-2',
      status: 'published',
      availability,
      auditLog,
      toDTO: jest.fn().mockReturnValue({
        id: 'song-2',
        title: 'Example 2',
      } as unknown as SongDTO),
    };
    mockRepository.findOne.mockImplementation((query: any) =>
      query.id === 'song-2' ? Promise.resolve(stubSong) : Promise.resolve(null),
    );

    const result = await useCase.execute('song-2');

    expect(stubSong.toDTO).toHaveBeenCalledWith(SongDTO);
    expect(result.availability).toBe(availability);
    expect(result.auditLog).toBe(auditLog);
  });

  it('supports multiple audit entries with optional fields and mixed availability', async () => {
    const availability = {
      policy: 'region-first',
      regions: [
        { code: 'ar', allowed: false, status: 'region-blocked' },
        { code: 'mx', allowed: true, status: 'published' },
        { code: 'global', allowed: false, status: 'admin-blocked' },
      ],
    };
    const auditLog = [
      {
        id: 'audit-2',
        timestamp: '2025-12-10T10:00:00.000Z',
        action: 'availability-update',
        actor: 'lucia.arias',
        details: 'Mixed availability',
        scope: 'regions',
        regions: ['AR', 'MX'],
        reasonCode: 'quality',
        previousState: 'Published',
        newState: 'Region blocked',
      },
      {
        id: 'audit-3',
        timestamp: '2025-12-10T11:00:00.000Z',
        action: 'blocked-admin',
        actor: 'admin',
        details: 'Global block',
        scope: 'global',
        newState: 'Admin blocked',
      },
    ];
    const stubSong = {
      id: 'song-3',
      status: 'published',
      availability,
      auditLog,
      toDTO: jest.fn().mockReturnValue({
        id: 'song-3',
        title: 'Example 3',
      } as unknown as SongDTO),
    };
    mockRepository.findOne.mockImplementation((query: any) =>
      query.id === 'song-3' ? Promise.resolve(stubSong) : Promise.resolve(null),
    );

    const result = await useCase.execute('song-3');

    expect(stubSong.toDTO).toHaveBeenCalledWith(SongDTO);
    expect(result.availability).toBe(availability);
    expect(result.availability.regions).toEqual(availability.regions);
    expect(result.auditLog).toBe(auditLog);
  });
});
