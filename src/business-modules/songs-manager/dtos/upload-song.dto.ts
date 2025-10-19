import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ArtistDTO } from 'src/entity-modules/song/song.dto';

export class UploadSongDTO {
  @ApiProperty({
    type: 'string',
    description: 'Title of the song',
    example: 'My Awesome Song',
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: [ArtistDTO],
    description: 'List of artists associated with the song',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Artist Name',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtistDTO)
  artists: ArtistDTO[];

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
