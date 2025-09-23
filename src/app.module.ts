import { Module } from '@nestjs/common';
import { FirebaseModule } from './tools-modules/firebase/firebase.module';
import { SongModule } from './entity-modules/song/song.module';
@Module({
  imports: [FirebaseModule, SongModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
