import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import type { CatalogStatus } from 'src/entity-modules/song/song.types';

export class UpdateCatalogItemDto {
  @IsOptional()
  @IsIn(['scheduled', 'published', 'region-blocked', 'blocked'])
  status?: CatalogStatus;

  @IsOptional()
  @IsIn(['global', 'regions'])
  scope?: 'global' | 'regions';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  actor?: string;
}

export class BlockCatalogItemDto extends UpdateCatalogItemDto {
  @IsString()
  reasonCode: string;
}

export class UnblockCatalogItemDto {
  @IsOptional()
  @IsString()
  actor?: string;
}
