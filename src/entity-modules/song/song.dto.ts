import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDTO } from '../base.dto';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  hasVideo: boolean;
}
