import { NotFoundException } from '@nestjs/common';
import { UpdateSongAvailabilityUseCase } from './update-song-availability.use-case';
import { Song } from 'src/entity-modules/song/song.entity';
import { SongRepository } from 'src/entity-modules/song/song.repository';

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

describe('UpdateSongAvailabilityUseCase', () => {
  const mockRepository = {
    findOne: jest.fn(),
    persistAndFlush: jest.fn(),
  };
  const useCase = new UpdateSongAvailabilityUseCase(
    mockRepository as unknown as SongRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws NotFoundException when the song does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', { status: 'published' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates song status globally when scope is global', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    const result = await useCase.execute('song-1', {
      status: 'region-blocked',
      scope: 'global',
      actor: 'admin-user',
      reason: 'Policy violation',
    });

    expect(song.status).toBe('region-blocked');
    expect(song.availability.regions.every((r) => !r.allowed)).toBe(true);
    expect(
      song.availability.regions.every((r) => r.status === 'region-blocked'),
    ).toBe(true);
    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'availability-update',
        actor: 'admin-user',
        details: 'Policy violation',
        scope: 'global',
      }),
    );
    expect(mockRepository.persistAndFlush).toHaveBeenCalledWith(song);
    expect(result.id).toBe('song-1');
    expect(result.availability).toBe(song.availability);
  });

  it('updates specific regions when scope is regions', async () => {
    const song = createSong();
    song.availability.regions = [
      { code: 'global', allowed: true, status: 'published' },
      { code: 'ar', allowed: true, status: 'published' },
      { code: 'mx', allowed: true, status: 'published' },
    ];
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'region-blocked',
      scope: 'regions',
      regions: ['ar', 'mx'],
      actor: 'moderator',
      reason: 'Regional restriction',
    });

    const arRegion = song.availability.regions.find((r) => r.code === 'ar');
    const mxRegion = song.availability.regions.find((r) => r.code === 'mx');
    const globalRegion = song.availability.regions.find(
      (r) => r.code === 'global',
    );

    expect(arRegion?.allowed).toBe(false);
    expect(arRegion?.status).toBe('region-blocked');
    expect(mxRegion?.allowed).toBe(false);
    expect(mxRegion?.status).toBe('region-blocked');
    expect(globalRegion?.allowed).toBe(true);
    expect(globalRegion?.status).toBe('published');
    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'availability-update',
        scope: 'regions',
        regions: ['AR', 'MX'],
      }),
    );
  });

  it('creates new region entries when they do not exist', async () => {
    const song = createSong();
    song.availability.regions = [
      { code: 'global', allowed: true, status: 'published' },
    ];
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'published',
      scope: 'regions',
      regions: ['br', 'cl'],
      actor: 'admin',
    });

    expect(song.availability.regions).toHaveLength(3);
    const brRegion = song.availability.regions.find((r) => r.code === 'br');
    const clRegion = song.availability.regions.find((r) => r.code === 'cl');

    expect(brRegion).toBeDefined();
    expect(brRegion?.allowed).toBe(true);
    expect(brRegion?.status).toBe('published');
    expect(clRegion).toBeDefined();
    expect(clRegion?.allowed).toBe(true);
    expect(clRegion?.status).toBe('published');
  });

  it('normalizes region codes to lowercase', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      scope: 'regions',
      regions: ['AR', 'MX', 'Br'],
      status: 'published',
    });

    expect(song.availability.regions.some((r) => r.code === 'ar')).toBe(true);
    expect(song.availability.regions.some((r) => r.code === 'mx')).toBe(true);
    expect(song.availability.regions.some((r) => r.code === 'br')).toBe(true);
    expect(song.availability.regions.some((r) => r.code === 'AR')).toBe(false);
  });

  it('handles blocked status by converting to admin-blocked', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'blocked',
      scope: 'global',
    });

    expect(song.status).toBe('blocked');
    expect(
      song.availability.regions.every((r) => r.status === 'admin-blocked'),
    ).toBe(true);
  });

  it('includes validity period in audit log when provided', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'scheduled',
      scope: 'global',
      validFrom: '2025-12-10T00:00:00Z',
      validTo: '2025-12-31T23:59:59Z',
      actor: 'scheduler',
    });

    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.stringContaining(
          'validity 2025-12-10T00:00:00Z - 2025-12-31T23:59:59Z',
        ),
      }),
    );
  });

  it('handles validity with only validFrom', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'scheduled',
      validFrom: '2025-12-10T00:00:00Z',
    });

    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.stringContaining(
          'validity 2025-12-10T00:00:00Z - no end',
        ),
      }),
    );
  });

  it('handles validity with only validTo', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'scheduled',
      validTo: '2025-12-31T23:59:59Z',
    });

    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.stringContaining(
          'validity immediate - 2025-12-31T23:59:59Z',
        ),
      }),
    );
  });

  it('uses default actor when not provided', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', { status: 'published' });

    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'admin',
      }),
    );
  });

  it('generates default reason when not provided', async () => {
    const song = createSong();
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'scheduled',
      scope: 'global',
    });

    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        details: 'Availability changed to scheduled (global)',
      }),
    );
  });

  it('initializes availability when song has no regions', async () => {
    const song = createSong();
    song.availability = { policy: 'custom', regions: [] };
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', { status: 'published' });

    expect(song.availability.regions).toHaveLength(1);
    expect(song.availability.regions[0]).toEqual({
      code: 'global',
      allowed: true,
      status: 'published',
    });
    expect(song.availability.policy).toBe('custom');
  });

  it('preserves policy when initializing availability', async () => {
    const song = createSong();
    song.availability = undefined as any;
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', { status: 'published' });

    expect(song.availability.policy).toBe('global-allow');
    expect(song.availability.regions).toHaveLength(1);
  });

  it('updates only status without changing regions when scope is not provided', async () => {
    const song = createSong();
    song.availability.regions = [
      { code: 'global', allowed: true, status: 'published' },
      { code: 'ar', allowed: false, status: 'region-blocked' },
    ];
    const originalRegions = [...song.availability.regions];
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'scheduled',
      actor: 'admin',
    });

    expect(song.status).toBe('scheduled');
    expect(song.availability.regions).toEqual(originalRegions);
  });

  it('does not change status when status is not provided', async () => {
    const song = createSong();
    song.status = 'scheduled';
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      scope: 'global',
      reason: 'Testing',
    });

    expect(song.status).toBe('scheduled');
  });

  it('returns complete DTO with availability and auditLog', async () => {
    const song = createSong();
    song.auditLog = [
      {
        id: 'audit-1',
        timestamp: '2025-12-09T12:00:00Z',
        action: 'created',
        actor: 'system',
        details: 'Song created',
      },
    ];
    mockRepository.findOne.mockResolvedValue(song);

    const result = await useCase.execute('song-1', { status: 'published' });

    expect(result.id).toBe('song-1');
    expect(result.title).toBe('Test Song');
    expect(result.availability).toBe(song.availability);
    expect(result.auditLog).toBe(song.auditLog);
    expect(result.auditLog).toHaveLength(1);
  });

  it('handles case-insensitive region matching', async () => {
    const song = createSong();
    song.availability.regions = [
      { code: 'global', allowed: true, status: 'published' },
      { code: 'ar', allowed: true, status: 'published' },
    ];
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      scope: 'regions',
      regions: ['AR'],
      status: 'region-blocked',
    });

    expect(song.availability.regions).toHaveLength(2);
    const arRegion = song.availability.regions.find((r) => r.code === 'ar');
    expect(arRegion?.status).toBe('region-blocked');
    expect(arRegion?.allowed).toBe(false);
  });

  it('tracks previous and new state in audit log', async () => {
    const song = createSong();
    song.status = 'published';
    song.availability.regions = [
      { code: 'global', allowed: true, status: 'published' },
    ];
    mockRepository.findOne.mockResolvedValue(song);

    await useCase.execute('song-1', {
      status: 'region-blocked',
      scope: 'global',
    });

    expect(song.addAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        previousState: expect.any(String),
        newState: expect.any(String),
      }),
    );
  });
});
