import { Module } from '@nestjs/common';
// import { MikroOrmModule } from '@mikro-orm/nestjs';
// import { Song } from './song.entity';

@Module({
  imports: [], // MikroOrmModule.forFeature([Song])
  controllers: [],
  providers: [],
  exports: [], // MikroOrmModule.forFeature([Song])
})
export class SongModule {}
