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
      expected: 'Admin blocked',
    },
    {
      name: 'admin block from region',
      base: 'published',
      regions: [region({ status: 'admin-blocked' })],
      expected: 'Admin blocked',
    },
    {
      name: 'region blocked when no admin override',
      base: 'published',
      regions: [region({ status: 'region-blocked' })],
      expected: 'Region blocked',
    },
    {
      name: 'scheduled yields Scheduled when no blocks',
      base: 'scheduled',
      regions: [region({ status: 'scheduled' })],
      expected: 'Scheduled',
    },
    {
      name: 'published default',
      base: 'published',
      regions: [region({ status: 'published' })],
      expected: 'Published',
    },
  ];

  it.each(cases)('$name', ({ base, regions, expected }) => {
    expect(getEffectiveStatus(base, regions)).toBe(expected);
  });
});
