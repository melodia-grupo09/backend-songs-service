import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDTO } from '../base.dto';

export class SongDTO extends BaseEntityDTO {
  @ApiProperty({
    type: String,
    example: 'Imagine',
    description: 'Title of the song',
  })
  title: string;

  @ApiProperty({
    type: String,
    example: 'John Lennon',
    description: 'Artist of the song',
  })
  artist: string;

  @ApiProperty({
    type: Number,
    example: 183,
    description: 'Duration of the song in seconds',
  })
  duration: number;
}
