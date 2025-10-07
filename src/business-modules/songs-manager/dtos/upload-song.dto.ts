import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UploadSongDTO {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The song file to upload (OGG format)',
  })
  file: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    description: 'Title of the song',
    example: 'My Awesome Song',
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: 'string',
    description: 'Artists IDs',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174000',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  artists: string[];

  @ApiProperty({
    type: 'string',
    description: 'Album ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  albumId: string;
}
