import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDTO } from '../base.dto';
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  AvailabilityRegion,
  SongAppearance,
  SongAuditEntry,
} from './song.entity';

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
    type: Boolean,
    example: false,
    description: 'Indicates if the song has an associated video',
  })
  @IsBoolean()
  hasVideo: boolean;

  @ApiProperty({
    type: String,
    example: '2025-02-14',
    required: false,
    description: 'Release date of the song',
  })
  @IsOptional()
  @IsDateString()
  @Transform(
    ({ value }): string | null =>
      value instanceof Date ? value.toISOString() : value,
    { toClassOnly: true },
  )
  releaseDate?: string | null;

  @ApiProperty({
    enum: ['scheduled', 'published', 'region-blocked', 'blocked'],
    example: 'published',
    description: 'Base availability status for the song',
  })
  @IsIn(['scheduled', 'published', 'region-blocked', 'blocked'])
  status: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Scheduled publish datetime',
  })
  @IsOptional()
  @IsDateString()
  @Transform(
    ({ value }): string | null =>
      value instanceof Date ? value.toISOString() : value,
    { toClassOnly: true },
  )
  programmedAt?: string | null;

  @ApiProperty({
    type: Object,
    description: 'Regional availability policy and regions',
  })
  availability: { policy: string; regions: AvailabilityRegion[] };

  @ApiProperty({
    type: [Object],
    description: 'Collections or playlists where the song appears',
    required: false,
  })
  @IsOptional()
  appearances?: SongAppearance[];

  @ApiProperty({
    type: [Object],
    description: 'Admin/audit trail of availability actions',
    required: false,
  })
  @IsOptional()
  auditLog?: SongAuditEntry[];
}
