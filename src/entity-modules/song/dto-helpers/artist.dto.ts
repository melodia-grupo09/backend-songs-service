import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

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
