import { Module } from '@nestjs/common';
import { SongModule } from 'src/entity-modules/song/song.module';
import { GetSongStreamUseCase } from './use-cases/get-song-stream.use-case';
import { SongsPlayerController } from './songs-player.controller';
import { FirebaseModule } from 'src/tools-modules/firebase/firebase.module';
import { GetVideoStreamUseCase } from './use-cases/get-video-stream.use-case';

@Module({
  imports: [SongModule, FirebaseModule],
  controllers: [SongsPlayerController],
  providers: [
    // Use Cases
    GetSongStreamUseCase,
    GetVideoStreamUseCase,
  ],
  exports: [],
})
export class SongsPlayerModule {}
