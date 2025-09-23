import { Module } from '@nestjs/common';
import { Song } from './song.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [MikroOrmModule.forFeature([Song])],
  controllers: [],
  providers: [],
  exports: [MikroOrmModule.forFeature([Song])],
})
export class SongModule {}
