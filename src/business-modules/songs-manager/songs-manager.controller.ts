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
import type { Request, Response } from 'express';
import { SearchSongsUseCase } from './use-cases/search-songs.use-case';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { UploadSongDTO } from './dtos/upload-song.dto';
import { UploadSongUseCase } from './use-cases/upload-song.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetSongByIdUseCase } from './use-cases/get-song-by-id.use-case';

@Controller('songs')
export class SongsManagerController {
  constructor(
    private readonly getSongByIdUseCase: GetSongByIdUseCase,
    private readonly searchSongsUseCase: SearchSongsUseCase,
    private readonly uploadSongUseCase: UploadSongUseCase,
  ) {}

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
