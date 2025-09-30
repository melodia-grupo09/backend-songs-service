import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import mikroOrmConfig from 'mikro-orm.config';
import { SongsPlayerModule } from './business-modules/songs-player/songs-player.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
    }),

    // Business Modules
    SongsPlayerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
