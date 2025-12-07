import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CatalogAdminService,
  CatalogSongDetailDto,
} from './catalog-admin.service';
import {
  BlockCatalogItemDto,
  UnblockCatalogItemDto,
  UpdateCatalogItemDto,
} from './dtos/catalog-actions.dto';
import {
  CatalogListQueryDto,
  CatalogListResponseDto,
} from './dtos/catalog-list.dto';

@Controller('catalog')
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  @Get()
  listCatalog(
    @Query() query: CatalogListQueryDto,
  ): Promise<CatalogListResponseDto> {
    return this.catalogAdminService.listCatalog(query);
  }

  @Get(':kind/:id')
  getCatalogItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
  ): Promise<CatalogSongDetailDto> {
    return this.catalogAdminService.getCatalogItem(kind, id);
  }

  @Patch(':kind/:id')
  updateCatalogItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() payload: UpdateCatalogItemDto,
  ): Promise<CatalogSongDetailDto> {
    return this.catalogAdminService.updateCatalogItem(kind, id, payload);
  }

  @Post(':kind/:id/block')
  blockCatalogItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() payload: BlockCatalogItemDto,
  ): Promise<CatalogSongDetailDto> {
    return this.catalogAdminService.blockCatalogItem(kind, id, payload);
  }

  @Post(':kind/:id/unblock')
  unblockCatalogItem(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() payload: UnblockCatalogItemDto,
  ): Promise<CatalogSongDetailDto> {
    return this.catalogAdminService.unblockCatalogItem(kind, id, payload);
  }
}
