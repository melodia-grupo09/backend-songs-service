// src/songs/songs.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiProperty, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SearchSongsUseCase } from './use-cases/search-songs.use-case';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { UploadSongDTO } from './dtos/upload-song.dto';
import { UploadSongUseCase } from './use-cases/upload-song.use-case';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('songs')
export class SongsManagerController {
  constructor(
    private readonly searchSongsUseCase: SearchSongsUseCase,
    private readonly uploadSongUseCase: UploadSongUseCase,
  ) {}

  @Get('search')
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Search query for songs',
  })
  @ApiProperty({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiProperty({
    name: 'limit',
    required: false,
    description: 'Number of results per page',
  })
  async searchSongs(
    @Query('query') query: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
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
  @ApiConsumes('multipart/form-data')
  async uploadSong(
    @Body() body: UploadSongDTO,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadSongUseCase.execute(body, file);
  }
}
