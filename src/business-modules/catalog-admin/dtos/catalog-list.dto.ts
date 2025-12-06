import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  AvailabilityRegionDTO,
  CatalogEffectiveStatus,
} from 'src/entity-modules/song/song.dto';

export class CatalogListQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, enum: ['song', 'collection'] })
  @IsOptional()
  @IsEnum(['song', 'collection'])
  type?: 'song' | 'collection';

  @ApiProperty({
    required: false,
    enum: [
      'Bloqueado-admin',
      'No-disponible-region',
      'Programado',
      'Publicado',
    ],
  })
  @IsOptional()
  @IsEnum([
    'Bloqueado-admin',
    'No-disponible-region',
    'Programado',
    'Publicado',
  ])
  status?: CatalogEffectiveStatus;

  @ApiProperty({ required: false, enum: ['yes', 'no'] })
  @IsOptional()
  @IsEnum(['yes', 'no'])
  hasVideo?: 'yes' | 'no';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiProperty({ required: false, enum: ['recent', 'title'] })
  @IsOptional()
  @IsEnum(['recent', 'title'])
  sort?: 'recent' | 'title';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 25 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number;
}

export class CatalogListItemDto {
  @ApiProperty({ enum: ['song', 'collection'] })
  type: 'song' | 'collection';

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  artist: string;

  @ApiProperty()
  collection: string;

  @ApiProperty({ required: false })
  releaseDate?: string;

  @ApiProperty({
    enum: [
      'Bloqueado-admin',
      'No-disponible-region',
      'Programado',
      'Publicado',
    ],
  })
  effectiveStatus: CatalogEffectiveStatus;

  @ApiProperty()
  hasVideo: boolean;

  @ApiProperty({
    type: () => AvailabilityRegionDTO,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  regions?: AvailabilityRegionDTO[];
}

export class CatalogListResponseDto {
  @ApiProperty({ type: () => CatalogListItemDto, isArray: true })
  items: CatalogListItemDto[];

  @ApiProperty()
  total: number;
}
