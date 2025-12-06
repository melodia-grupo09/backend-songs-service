export type SongStatus = 'scheduled' | 'published';

export type AvailabilityStatus = 'published' | 'scheduled' | 'region-blocked';

export type CatalogEffectiveStatus =
  | 'Bloqueado-admin'
  | 'No-disponible-region'
  | 'Programado'
  | 'Publicado';

export type BlockReasonCode =
  | 'legal'
  | 'copyright'
  | 'quality'
  | 'artist-request'
  | 'policy';

export interface AvailabilityRegion {
  code: string;
  allowed: boolean;
  status: AvailabilityStatus;
}

export interface SongAvailability {
  policy: string;
  regions: AvailabilityRegion[];
}

export interface AdminBlockMetadata {
  scope: 'global' | 'regions';
  regions?: string[];
  reasonCode: BlockReasonCode;
  actor: string;
  appliedAt: Date;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
  scope?: 'global' | 'regions';
  regions?: string[];
  reasonCode?: BlockReasonCode;
  previousState?: CatalogEffectiveStatus;
  newState?: CatalogEffectiveStatus;
}
