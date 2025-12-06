import {
  Entity,
  EntityRepositoryType,
  Index,
  Property,
} from '@mikro-orm/mongodb';
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

  @Property({ type: 'boolean', default: false })
  hasVideo: boolean = false;

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
}
