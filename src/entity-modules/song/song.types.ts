export type CatalogStatus =
  | 'scheduled'
  | 'published'
  | 'region-blocked'
  | 'blocked';

export type AvailabilityStatus =
  | 'published'
  | 'scheduled'
  | 'region-blocked'
  | 'admin-blocked';

export type EffectiveCatalogStatus =
  | 'Bloqueado-admin'
  | 'No-disponible-region'
  | 'Programado'
  | 'Publicado';

export interface AvailabilityRegion {
  code: string;
  allowed: boolean;
  status: AvailabilityStatus;
}

export interface SongAvailability {
  policy: string;
  regions: AvailabilityRegion[];
}

export interface SongAuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  scope?: 'global' | 'regions';
  regions?: string[];
  reasonCode?: string;
  previousState?: EffectiveCatalogStatus;
  newState?: EffectiveCatalogStatus;
}
