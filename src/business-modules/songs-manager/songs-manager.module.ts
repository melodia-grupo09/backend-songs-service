import { Module } from '@nestjs/common';
import { SongModule } from 'src/entity-modules/song/song.module';
import { SongsManagerController } from './songs-manager.controller';
import { FirebaseModule } from 'src/tools-modules/firebase/firebase.module';
import { SearchSongsUseCase } from './use-cases/search-songs.use-case';
import { UploadSongUseCase } from './use-cases/upload-song.use-case';

@Module({
  imports: [SongModule, FirebaseModule],
  controllers: [SongsManagerController],
  providers: [
    // Use Cases
    SearchSongsUseCase,
    UploadSongUseCase,
  ],
  exports: [],
})
export class SongsManagerModule {}
