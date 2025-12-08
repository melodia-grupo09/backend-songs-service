import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SongModule } from 'src/entity-modules/song/song.module';
import { SongsManagerController } from './songs-manager.controller';
import { FirebaseModule } from 'src/tools-modules/firebase/firebase.module';
import { MediaConverterModule } from 'src/tools-modules/media-converter/media-converter.module';
import { SearchSongsUseCase } from './use-cases/search-songs.use-case';
import { UploadSongUseCase } from './use-cases/upload-song.use-case';
import { GetSongByIdUseCase } from './use-cases/get-song-by-id.use-case';
import { GetRandomSongsUseCase } from './use-cases/get-random-songs.use-case';
import { AddVideoToSongUseCase } from './use-cases/add-video-to-song.use-case';
import { SongsAdminController } from './songs-admin.controller';
import { ListSongsUseCase } from './use-cases/list-songs.use-case';
import { UpdateSongAvailabilityUseCase } from './use-cases/update-song-availability.use-case';
import { BlockSongUseCase } from './use-cases/block-song.use-case';
import { UnblockSongUseCase } from './use-cases/unblock-song.use-case';
import { ReleaseInfoService } from './services/release-info.service';

@Module({
  imports: [
    SongModule,
    FirebaseModule,
    MediaConverterModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL:
          configService.get<string>('ARTISTS_SERVICE_URL') ??
          configService.get<string>('RELEASES_SERVICE_URL') ??
          '',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SongsManagerController, SongsAdminController],
  providers: [
    // Use Cases
    GetSongByIdUseCase,
    GetRandomSongsUseCase,
    SearchSongsUseCase,
    UploadSongUseCase,
    AddVideoToSongUseCase,
    ListSongsUseCase,
    UpdateSongAvailabilityUseCase,
    BlockSongUseCase,
    UnblockSongUseCase,
    ReleaseInfoService,
  ],
  exports: [],
})
export class SongsManagerModule {}
