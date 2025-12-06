// src/songs/songs.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { SearchSongsUseCase } from './use-cases/search-songs.use-case';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { UploadSongDTO } from './dtos/upload-song.dto';
import { UploadSongUseCase } from './use-cases/upload-song.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetSongByIdUseCase } from './use-cases/get-song-by-id.use-case';
import { GetRandomSongsUseCase } from './use-cases/get-random-songs.use-case';
import { AddVideoToSongUseCase } from './use-cases/add-video-to-song.use-case';

@Controller('songs')
export class SongsManagerController {
  constructor(
    private readonly getSongByIdUseCase: GetSongByIdUseCase,
    private readonly getRandomSongsUseCase: GetRandomSongsUseCase,
    private readonly searchSongsUseCase: SearchSongsUseCase,
    private readonly uploadSongUseCase: UploadSongUseCase,
    private readonly addVideoToSongUseCase: AddVideoToSongUseCase,
  ) { }

  @Get('search')
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Search query for songs',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    default: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    default: 20,
    description: 'Number of results per page',
  })
  async searchSongs(
    @Query('query') query: string,
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number,
    @Query('limit', new DefaultValuePipe(20), new ParseIntPipe())
    limit: number,
  ): Promise<SongDTO[]> {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }
    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    return this.searchSongsUseCase.execute(query, limit, page);
  }

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    description: 'ID of the song to retrieve',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'The song has been successfully retrieved.',
    type: SongDTO,
  })
  async getSongById(@Param('id') id: string): Promise<SongDTO> {
    return this.getSongByIdUseCase.execute(id);
  }

  @Get('random')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Retrieve random songs.',
    type: [SongDTO],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of random songs to retrieve',
    example: 10,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  async getRandomSongs(
    @Query('limit', new DefaultValuePipe(10), new ParseIntPipe())
    limit: number,
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe())
    page: number,
  ): Promise<SongDTO[]> {
    return this.getRandomSongsUseCase.execute(limit, page);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'), FileInterceptor('videoFile'))
  @ApiBody({
    description: 'Upload a new song',
    required: true,
    type: UploadSongDTO,
  })
  @ApiProperty({
    name: 'file',
    type: 'string',
    format: 'binary',
    description: 'The song file to upload',
  })
  @ApiProperty({
    name: 'videoFile',
    type: 'string',
    format: 'binary',
    description: 'The optional video file to upload',
  })
  @ApiConsumes('multipart/form-data')
  async uploadSong(
    @Body() body: UploadSongDTO,
    @UploadedFile() file: Express.Multer.File,
    @UploadedFile('videoFile') videoFile?: Express.Multer.File,
  ) {
    return this.uploadSongUseCase.execute(body, file, videoFile);
  }


  @Post('video/:songId')
  @UseInterceptors(FileInterceptor('videoFile'))
  @ApiParam({
    name: 'songId',
    description: 'ID of the song to which the video will be added',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiProperty({
    name: 'videoFile',
    type: 'string',
    format: 'binary',
    description: 'The optional video file to upload',
  })
  @ApiConsumes('multipart/form-data')
  async addVideoToSong(
    @Param('songId') songId: string,
    @UploadedFile('videoFile') videoFile: Express.Multer.File,
  ) {
    return this.addVideoToSongUseCase.execute(songId, videoFile);
  }
}
