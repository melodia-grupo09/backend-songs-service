import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';
import { BaseEntity } from '../base.entity';
import { SongRepository } from './song.repository';

@Entity({ repository: () => SongRepository })
export class Song extends BaseEntity<Song> {
  [EntityRepositoryType]: SongRepository;

  @Property({ nullable: false })
  title: string;

  @Property({ nullable: false })
  artist: string;

  @Property({ nullable: false })
  duration: number; // duration in seconds

  @Property({ nullable: false, hidden: true })
  storagePath: string;

  constructor(
    title: string,
    artist: string,
    duration: number,
    storagePath: string,
  ) {
    super();
    this.title = title;
    this.artist = artist;
    this.duration = duration;
    this.storagePath = storagePath;
  }
}
