import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDTO } from '../base.dto';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  AvailabilityStatus,
  BlockReasonCode,
  CatalogEffectiveStatus,
  SongStatus,
} from './song.types';

export class ArtistDTO {
  @ApiProperty({
    type: String,
    example: '3',
    description: 'ID of the artist',
  })
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    example: 'John Lennon',
    description: 'Name of the artist',
  })
  @IsString()
  name: string;
}
export class SongDTO extends BaseEntityDTO {
  @ApiProperty({
    type: String,
    example: 'Imagine',
    description: 'Title of the song',
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: [Object],
    example: '[{id: 3, name: "John Lennon"}]',
    description: 'Artists of the song',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtistDTO)
  artists: ArtistDTO[];

  @ApiProperty({
    type: Number,
    example: 183,
    description: 'Duration of the song in seconds',
  })
  @IsNumber()
  duration: number;

  @ApiProperty({
    enum: ['scheduled', 'published'],
    example: 'published',
  })
  @IsEnum(['scheduled', 'published'])
  status: SongStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  programmedAt?: string | null;

  @ApiProperty({ type: Boolean, example: false })
  @IsBoolean()
  hasVideo: boolean;

  @ApiProperty({
    enum: [
      'Bloqueado-admin',
      'No-disponible-region',
      'Programado',
      'Publicado',
    ],
  })
  @IsEnum([
    'Bloqueado-admin',
    'No-disponible-region',
    'Programado',
    'Publicado',
  ])
  effectiveStatus: CatalogEffectiveStatus;

  @ApiProperty({ type: () => SongAvailabilityDTO })
  @ValidateNested()
  @Type(() => SongAvailabilityDTO)
  availability: SongAvailabilityDTO;

  @ApiProperty({ type: () => AuditEntryDTO, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditEntryDTO)
  auditLog: AuditEntryDTO[];
}

export class AvailabilityRegionDTO {
  @ApiProperty({ example: 'ar' })
  @IsString()
  code: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  allowed: boolean;

  @ApiProperty({
    enum: ['published', 'scheduled', 'region-blocked', 'admin-blocked'],
  })
  @IsEnum(['published', 'scheduled', 'region-blocked', 'admin-blocked'])
  status: AvailabilityStatus | 'admin-blocked';
}

export class SongAvailabilityDTO {
  @ApiProperty({ example: 'global-allow' })
  @IsString()
  policy: string;

  @ApiProperty({ type: () => AvailabilityRegionDTO, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRegionDTO)
  regions: AvailabilityRegionDTO[];
}

export class AuditEntryDTO {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsDateString()
  timestamp: string;

  @ApiProperty()
  @IsString()
  action: string;

  @ApiProperty()
  @IsString()
  actor: string;

  @ApiProperty()
  @IsString()
  details: string;

  @ApiProperty({ enum: ['global', 'regions'], required: false })
  @IsOptional()
  @IsEnum(['global', 'regions'])
  scope?: 'global' | 'regions';

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({
    enum: ['legal', 'copyright', 'quality', 'artist-request', 'policy'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['legal', 'copyright', 'quality', 'artist-request', 'policy'])
  reasonCode?: BlockReasonCode;

  @ApiProperty({
    enum: [
      'Bloqueado-admin',
      'No-disponible-region',
      'Programado',
      'Publicado',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'Bloqueado-admin',
    'No-disponible-region',
    'Programado',
    'Publicado',
  ])
  previousState?: CatalogEffectiveStatus;

  @ApiProperty({
    enum: [
      'Bloqueado-admin',
      'No-disponible-region',
      'Programado',
      'Publicado',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'Bloqueado-admin',
    'No-disponible-region',
    'Programado',
    'Publicado',
  ])
  newState?: CatalogEffectiveStatus;
}
