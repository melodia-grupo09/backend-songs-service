import { Module } from '@nestjs/common';
import { SongModule } from 'src/entity-modules/song/song.module';
import { CatalogAdminController } from './catalog-admin.controller';
import { CatalogAdminService } from './catalog-admin.service';

@Module({
  imports: [SongModule],
  controllers: [CatalogAdminController],
  providers: [CatalogAdminService],
})
export class CatalogAdminModule {}
