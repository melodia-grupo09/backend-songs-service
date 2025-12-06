import {
  AdminBlockMetadata,
  AvailabilityRegion,
  AvailabilityStatus,
  CatalogEffectiveStatus,
  SongAvailability,
  SongStatus,
} from 'src/entity-modules/song/song.types';

export type AvailabilityRegionView = Omit<AvailabilityRegion, 'status'> & {
  status: AvailabilityStatus | 'admin-blocked';
};

export const normalizeRegionCodes = (regions?: string[]): string[] =>
  Array.from(
    new Set(
      regions?.map((region) => region.trim().toLowerCase()).filter(Boolean) ??
        [],
    ),
  );

export const ensureRegionsExist = (
  availability: SongAvailability,
  regions: string[],
): void => {
  regions.forEach((code) => {
    const exists = availability.regions.some(
      (region) => region.code.toLowerCase() === code,
    );
    if (!exists) {
      availability.regions.push({
        code: code.toUpperCase(),
        allowed: true,
        status: 'published',
      });
    }
  });
};

const getBlockedRegions = (adminBlock: AdminBlockMetadata | null) => {
  const blocked = new Set<string>();
  if (!adminBlock) {
    return blocked;
  }
  if (adminBlock.scope === 'global') {
    blocked.add('global');
    return blocked;
  }
  adminBlock.regions?.forEach((code) => blocked.add(code.toLowerCase()));
  return blocked;
};

export const isAdminBlocked = (
  adminBlock: AdminBlockMetadata | null,
): boolean => Boolean(adminBlock);

export const isRegionAdminBlocked = (
  adminBlock: AdminBlockMetadata | null,
  region?: string | null,
): boolean => {
  if (!adminBlock) {
    return false;
  }
  if (adminBlock.scope === 'global') {
    return true;
  }
  if (!region) {
    return false;
  }
  return (
    adminBlock.regions?.some(
      (code) => code.toLowerCase() === region.toLowerCase(),
    ) ?? false
  );
};

const resolveRegionEntry = (
  availability: SongAvailability,
  region?: string | null,
): AvailabilityRegion | undefined => {
  const normalized = region?.toLowerCase();
  if (normalized) {
    const match = availability.regions.find(
      (entry) => entry.code.toLowerCase() === normalized,
    );
    if (match) {
      return match;
    }
  }
  return availability.regions.find(
    (entry) => entry.code.toLowerCase() === 'global',
  );
};

export const isRegionAvailable = (
  status: SongStatus,
  availability: SongAvailability,
  adminBlock: AdminBlockMetadata | null,
  region?: string | null,
): boolean => {
  if (isRegionAdminBlocked(adminBlock, region)) {
    return false;
  }
  const entry = resolveRegionEntry(availability, region);
  if (!entry) {
    return true;
  }
  if (entry.status === 'region-blocked') {
    return false;
  }
  if (status === 'scheduled') {
    return false;
  }
  return entry.allowed;
};

export const getAvailabilityView = (
  availability: SongAvailability,
  adminBlock: AdminBlockMetadata | null,
): AvailabilityRegionView[] => {
  const blockedRegions = getBlockedRegions(adminBlock);
  return availability.regions.map((region) => {
    const isBlocked =
      blockedRegions.has('global') ||
      blockedRegions.has(region.code.toLowerCase());
    return {
      code: region.code,
      allowed: isBlocked ? false : region.allowed,
      status: isBlocked ? 'admin-blocked' : region.status,
    };
  });
};

export const computeEffectiveStatus = (
  status: SongStatus,
  availability: SongAvailability,
  adminBlock: AdminBlockMetadata | null,
): CatalogEffectiveStatus => {
  if (isAdminBlocked(adminBlock)) {
    return 'Bloqueado-admin';
  }
  if (
    availability.regions.some((region) => region.status === 'region-blocked')
  ) {
    return 'No-disponible-region';
  }
  if (status === 'scheduled') {
    return 'Programado';
  }
  return 'Publicado';
};
