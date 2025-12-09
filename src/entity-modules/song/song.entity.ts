import {
  Entity,
  EntityRepositoryType,
  Index,
  Property,
} from '@mikro-orm/mongodb';
import { BaseEntity } from '../base.entity';
import { SongRepository } from './song.repository';

export type SongStatus =
  | 'scheduled'
  | 'published'
  | 'region-blocked'
  | 'blocked';

export interface AvailabilityRegion {
  code: string;
  allowed: boolean;
  status: 'published' | 'scheduled' | 'region-blocked' | 'admin-blocked';
}

export interface SongAvailability {
  policy: string;
  regions: AvailabilityRegion[];
}

export interface SongAppearance {
  id?: string;
  type: string;
  title: string;
  owner: string;
  position?: number;
  count?: number;
  kind?: 'song' | 'collection' | 'playlist';
}

export interface SongAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  scope?: 'global' | 'regions';
  regions?: string[];
  reasonCode?: string;
  previousState?: string;
  newState?: string;
}

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

  @Property({ type: 'boolean', default: false })
  hasVideo: boolean = false;

  @Property({ nullable: true })
  releaseDate: Date | null = null;

  @Property({ type: 'string', default: 'published' })
  status: SongStatus = 'published';

  @Property({ nullable: true })
  programmedAt: Date | null = null;

  @Property({ type: 'json' })
  availability: SongAvailability = {
    policy: 'global-allow',
    regions: [{ code: 'global', allowed: true, status: 'published' }],
  };

  @Property({ type: 'json', default: [] })
  appearances: SongAppearance[] = [];

  @Property({ type: 'json', default: [] })
  auditLog: SongAuditEntry[] = [];

  constructor(
    title: string,
    artists: { id: string; name: string }[],
    albumId: string | null,
    duration: number,
    hasVideo: boolean = false,
  ) {
    super();
    this.title = title;
    this.artists = artists;
    this.albumId = albumId;
    this.duration = duration;
    this.hasVideo = hasVideo;
  }

  setHasVideo(hasVideo: boolean) {
    this.hasVideo = hasVideo;
  }

  addAuditEntry(entry: Omit<SongAuditEntry, 'id' | 'timestamp'>) {
    const newEntry: SongAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLog.unshift(newEntry);
  }
}
