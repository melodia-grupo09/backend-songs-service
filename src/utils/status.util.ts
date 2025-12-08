import {
  AvailabilityRegion,
  SongStatus,
} from 'src/entity-modules/song/song.entity';

export type EffectiveStatus =
  | 'Admin blocked'
  | 'Region blocked'
  | 'Scheduled'
  | 'Published';

export function getEffectiveStatus(
  baseStatus: SongStatus,
  regions: AvailabilityRegion[] = [],
): EffectiveStatus {
  const statuses = [baseStatus, ...regions.map((region) => region.status)];

  if (
    statuses.some(
      (status) => status === 'blocked' || status === 'admin-blocked',
    )
  )
    return 'Admin blocked';
  if (statuses.some((status) => status === 'region-blocked'))
    return 'Region blocked';
  if (statuses.some((status) => status === 'scheduled')) return 'Scheduled';
  return 'Published';
}
