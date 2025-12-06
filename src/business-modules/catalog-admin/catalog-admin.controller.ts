import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CatalogAdminService } from './catalog-admin.service';
import {
  CatalogListQueryDto,
  CatalogListResponseDto,
} from './dtos/catalog-list.dto';
import {
  BlockCatalogItemDto,
  UnblockCatalogItemDto,
  UpdateAvailabilityDto,
} from './dtos/catalog-actions.dto';
import { SongDTO } from 'src/entity-modules/song/song.dto';

@Controller('catalog')
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  @Get()
  async listCatalog(
    @Query() query: CatalogListQueryDto,
  ): Promise<CatalogListResponseDto> {
    return this.catalogAdminService.listCatalog(query);
  }

  @Get(':kind/:id')
  async getCatalogItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
  ): Promise<SongDTO> {
    return this.catalogAdminService.getCatalogItem(kind, id);
  }

  @Patch(':kind/:id')
  async updateAvailability(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() payload: UpdateAvailabilityDto,
  ): Promise<SongDTO> {
    return this.catalogAdminService.updateAvailability(kind, id, payload);
  }

  @Post(':kind/:id/block')
  async blockItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() payload: BlockCatalogItemDto,
  ): Promise<SongDTO> {
    return this.catalogAdminService.blockItem(kind, id, payload);
  }

  @Post(':kind/:id/unblock')
  async unblockItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() payload: UnblockCatalogItemDto,
  ): Promise<SongDTO> {
    return this.catalogAdminService.unblockItem(kind, id, payload);
  }
}
