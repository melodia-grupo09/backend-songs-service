import {
  AvailabilityRegion,
  SongStatus,
} from 'src/entity-modules/song/song.entity';

export type EffectiveStatus =
  | 'Bloqueado-admin'
  | 'No-disponible-region'
  | 'Programado'
  | 'Publicado';

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
    return 'Bloqueado-admin';
  if (statuses.some((status) => status === 'region-blocked'))
    return 'No-disponible-region';
  if (statuses.some((status) => status === 'scheduled')) return 'Programado';
  return 'Publicado';
}
