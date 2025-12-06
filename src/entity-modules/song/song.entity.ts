import {
  Entity,
  EntityRepositoryType,
  Index,
  Property,
} from '@mikro-orm/mongodb';
import { randomUUID } from 'crypto';
import { ClassCtor } from 'src/utils/dto.utils';
import {
  AvailabilityRegionView,
  computeEffectiveStatus,
  getAvailabilityView,
  isAdminBlocked as utilIsAdminBlocked,
  isRegionAdminBlocked as utilIsRegionAdminBlocked,
  isRegionAvailable,
} from 'src/utils/song-availability.util';
import type {
  AdminBlockMetadata,
  AuditEntry,
  CatalogEffectiveStatus,
  SongAvailability,
  SongStatus,
} from './song.types';
import { BaseEntity } from '../base.entity';
import { SongRepository } from './song.repository';

@Entity({ repository: () => SongRepository })
export class Song extends BaseEntity<Song> {
  [EntityRepositoryType]: SongRepository;

  @Property({ nullable: false, type: 'text' })
  @Index()
  title: string;

  @Property({ nullable: false, type: 'json' })
  artists: { id: string; name: string }[];

  @Property({ nullable: true })
  albumId: string | null;

  @Property({ nullable: false, type: 'numeric' })
  duration: number; // duration in seconds

  @Property({ nullable: false, type: 'string' })
  status: SongStatus = 'published';

  @Property({ nullable: true })
  programmedAt?: Date | null;

  @Property({ nullable: false })
  hasVideo = false;

  @Property({ type: 'json' })
  availability: SongAvailability = {
    policy: 'global-allow',
    regions: [{ code: 'GLOBAL', allowed: true, status: 'published' }],
  };

  @Property({ type: 'json', nullable: true })
  adminBlock: AdminBlockMetadata | null = null;

  @Property({ type: 'json' })
  auditLog: AuditEntry[] = [];

  constructor(
    title: string,
    artists: { id: string; name: string }[],
    albumId: string | null,
    duration: number,
  ) {
    super();
    this.title = title;
    this.artists = artists;
    this.albumId = albumId;
    this.duration = duration;
  }

  getEffectiveStatus(): CatalogEffectiveStatus {
    return computeEffectiveStatus(
      this.status,
      this.availability,
      this.adminBlock,
    );
  }

  getAvailabilityForDisplay(): AvailabilityRegionView[] {
    return getAvailabilityView(this.availability, this.adminBlock);
  }

  isAdminBlocked(): boolean {
    return utilIsAdminBlocked(this.adminBlock);
  }

  isBlockedInRegion(region?: string | null): boolean {
    return utilIsRegionAdminBlocked(this.adminBlock, region ?? null);
  }

  isAvailableInRegion(region?: string | null): boolean {
    return isRegionAvailable(
      this.status,
      this.availability,
      this.adminBlock,
      region ?? null,
    );
  }

  addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    this.auditLog.unshift({
      id: randomUUID(),
      timestamp: new Date(),
      ...entry,
    });
  }

  setHasVideo(hasVideo: boolean): void {
    this.hasVideo = hasVideo;
  }

  override toDTO<Dto extends object>(dtoClass: ClassCtor<Dto>): Dto {
    const dto = super.toDTO(dtoClass);
    if (dtoClass.name === 'SongDTO') {
      Object.assign(dto as Record<string, unknown>, {
        hasVideo: this.hasVideo,
        availability: {
          policy: this.availability.policy,
          regions: this.getAvailabilityForDisplay(),
        },
        effectiveStatus: this.getEffectiveStatus(),
      });
    }
    return dto;
  }
}
