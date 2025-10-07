import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UploadSongDTO {
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
  @Transform(({ value }) => (value as string).split(','))
  @IsArray()
  @IsString({ each: true })
  artists: string[];

  @ApiProperty({
    type: 'string',
    description: 'Album ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  albumId?: string | null;
}
