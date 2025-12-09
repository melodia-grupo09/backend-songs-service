import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityRegionDTO {
  @ApiProperty({ example: 'us' })
  @IsString()
  code: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  allowed: boolean;

  @ApiProperty({
    enum: ['published', 'scheduled', 'region-blocked', 'admin-blocked'],
    example: 'published',
  })
  @IsIn(['published', 'scheduled', 'region-blocked', 'admin-blocked'])
  status: string;
}

export class SongAvailabilityDTO {
  @ApiProperty({ example: 'global-allow' })
  @IsString()
  policy: string;

  @ApiProperty({ type: [AvailabilityRegionDTO] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRegionDTO)
  regions: AvailabilityRegionDTO[];
}
