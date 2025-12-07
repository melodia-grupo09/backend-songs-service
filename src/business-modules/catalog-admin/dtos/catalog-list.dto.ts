import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type {
  AvailabilityRegion,
  EffectiveCatalogStatus,
} from 'src/entity-modules/song/song.types';

export class CatalogListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['song', 'collection'])
  type?: 'song' | 'collection';

  @IsOptional()
  @IsIn(['Bloqueado-admin', 'No-disponible-region', 'Programado', 'Publicado'])
  status?: EffectiveCatalogStatus;

  @IsOptional()
  @IsIn(['yes', 'no'])
  hasVideo?: 'yes' | 'no';

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['recent', 'title'])
  sort?: 'recent' | 'title';
}

export interface CatalogListItemDto {
  id: string;
  type: 'song';
  title: string;
  artist: string;
  collection: string;
  releaseDate?: string;
  effectiveStatus: EffectiveCatalogStatus;
  hasVideo: boolean;
  regions?: AvailabilityRegion[];
}

export interface CatalogListResponseDto {
  items: CatalogListItemDto[];
  total: number;
}
