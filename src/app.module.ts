import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import mikroOrmConfig from 'mikro-orm.config';
import { SongsPlayerModule } from './business-modules/songs-player/songs-player.module';
import { SongsManagerModule } from './business-modules/songs-manager/songs-manager.module';
import { CatalogAdminModule } from './business-modules/catalog-admin/catalog-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
    }),

    // Business Modules
    SongsPlayerModule,
    SongsManagerModule,
    CatalogAdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
