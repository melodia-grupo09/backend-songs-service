import { Migration } from '@mikro-orm/migrations';

export class Migration20250923144638_addSongEntity extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "song" ("id" uuid not null, "title" varchar(255) not null, "artist" varchar(255) not null, "duration" int not null, "storage_path" varchar(255) not null, constraint "song_pkey" primary key ("id"));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "song" cascade;`);
  }
}
