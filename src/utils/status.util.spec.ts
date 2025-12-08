import { getEffectiveStatus, type EffectiveStatus } from './status.util';
import type {
  AvailabilityRegion,
  SongStatus,
} from 'src/entity-modules/song/song.entity';

const region = (
  overrides: Partial<AvailabilityRegion> = {},
): AvailabilityRegion => ({
  code: overrides.code ?? 'global',
  allowed: overrides.allowed ?? true,
  status: overrides.status ?? 'published',
});

describe('getEffectiveStatus', () => {
  const cases: Array<{
    base: SongStatus;
    regions: AvailabilityRegion[];
    expected: EffectiveStatus;
    name: string;
  }> = [
    {
      name: 'admin block from base status',
      base: 'blocked',
      regions: [region()],
      expected: 'Bloqueado-admin',
    },
    {
      name: 'admin block from region',
      base: 'published',
      regions: [region({ status: 'admin-blocked' })],
      expected: 'Bloqueado-admin',
    },
    {
      name: 'region blocked when no admin override',
      base: 'published',
      regions: [region({ status: 'region-blocked' })],
      expected: 'No-disponible-region',
    },
    {
      name: 'scheduled yields Programado when no blocks',
      base: 'scheduled',
      regions: [region({ status: 'scheduled' })],
      expected: 'Programado',
    },
    {
      name: 'published default',
      base: 'published',
      regions: [region({ status: 'published' })],
      expected: 'Publicado',
    },
  ];

  it.each(cases)('$name', ({ base, regions, expected }) => {
    expect(getEffectiveStatus(base, regions)).toBe(expected);
  });
});
