import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDTO } from '../base.dto';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class SongDTO extends BaseEntityDTO {
  @ApiProperty({
    type: String,
    example: 'Imagine',
    description: 'Title of the song',
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: String,
    example: 'John Lennon',
    description: 'Artists of the song',
  })
  @IsArray()
  artists: { id: string; name: string }[];

  @ApiProperty({
    type: Number,
    example: 183,
    description: 'Duration of the song in seconds',
  })
  @IsNumber()
  duration: number;
}
