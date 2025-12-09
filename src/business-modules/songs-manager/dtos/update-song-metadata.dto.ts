import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSongMetadataDTO {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  artists?: { id: string; name: string }[];

  @IsOptional()
  @IsString()
  albumId?: string | null;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date | null;
}
