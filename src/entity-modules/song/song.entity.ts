import { Entity, EntityRepositoryType, Index, Property } from '@mikro-orm/core';
import { BaseEntity } from '../base.entity';
import { SongRepository } from './song.repository';

@Entity({ repository: () => SongRepository })
export class Song extends BaseEntity<Song> {
  [EntityRepositoryType]: SongRepository;

  @Property({ nullable: false })
  @Index({ type: 'fulltext' })
  title: string;

  @Property({ nullable: false, type: 'array' })
  artists: string[];

  @Property({ nullable: true })
  albumId: string | null;

  @Property({ nullable: false })
  duration: number; // duration in seconds

  @Property({ nullable: false, hidden: true })
  filePath: string;

  @Property({ persist: false, hidden: true })
  score?: number;

  constructor(
    title: string,
    artists: string[],
    albumId: string | null,
    duration: number,
    filePath: string,
  ) {
    super();
    this.title = title;
    this.artists = artists;
    this.albumId = albumId;
    this.duration = duration;
    this.filePath = filePath;
  }

  setFilePath(filePath: string) {
    this.filePath = filePath;
  }
}
