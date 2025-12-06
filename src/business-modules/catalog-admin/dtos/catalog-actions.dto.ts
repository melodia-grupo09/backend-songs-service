import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { BlockReasonCode } from 'src/entity-modules/song/song.types';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: ['global', 'regions'], required: false })
  @IsOptional()
  @IsEnum(['global', 'regions'])
  scope?: 'global' | 'regions';

  @ApiProperty({
    enum: ['published', 'region-blocked', 'scheduled'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['published', 'region-blocked', 'scheduled'])
  status?: 'published' | 'region-blocked' | 'scheduled';

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actor?: string;
}

export class BlockCatalogItemDto {
  @ApiProperty({ enum: ['global', 'regions'], default: 'global' })
  @IsEnum(['global', 'regions'])
  scope: 'global' | 'regions' = 'global';

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({
    enum: ['legal', 'copyright', 'quality', 'artist-request', 'policy'],
  })
  @IsEnum(['legal', 'copyright', 'quality', 'artist-request', 'policy'])
  reasonCode: BlockReasonCode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actor?: string;
}

export class UnblockCatalogItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actor?: string;
}
