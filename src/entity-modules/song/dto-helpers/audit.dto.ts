import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { SongAuditEntry } from '../song.entity';

export class SongAuditEntryDTO implements SongAuditEntry {
  @ApiProperty({
    type: String,
    example: 'audit-1765287837184',
    description: 'Unique identifier of the audit entry',
  })
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    example: '2025-12-09T13:43:57.184Z',
    description: 'Timestamp of the audit action',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    type: String,
    example: 'availability-update',
    description: 'Action that was performed',
  })
  @IsString()
  action: string;

  @ApiProperty({
    type: String,
    example: 'lucia.arias',
    description: 'Actor responsible for the action',
  })
  @IsString()
  actor: string;

  @ApiProperty({
    type: String,
    example: 'Territory update | validity 2025-12-09T10:43 - 2025-12-10T10:43',
    description: 'Human readable details about the change',
  })
  @IsString()
  details: string;

  @ApiProperty({
    enum: ['global', 'regions'],
    required: false,
    description: 'Scope that was affected by the action',
  })
  @IsOptional()
  @IsIn(['global', 'regions'])
  scope?: 'global' | 'regions';

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Region codes involved in the audit entry',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({
    required: false,
    description: 'Optional reason code provided for the action',
  })
  @IsOptional()
  @IsString()
  reasonCode?: string;

  @ApiProperty({
    required: false,
    description: 'State before the action',
  })
  @IsOptional()
  @IsString()
  previousState?: string;

  @ApiProperty({
    required: false,
    description: 'State after the action',
  })
  @IsOptional()
  @IsString()
  newState?: string;
}
