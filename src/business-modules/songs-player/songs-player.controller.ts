// src/songs/songs.controller.ts

import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiParam, ApiProperty } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GetSongStreamUseCase } from './use-cases/get-song-stream.use-case';

@Controller('songs/player')
export class SongsPlayerController {
  constructor(private readonly getSongStreamUseCase: GetSongStreamUseCase) {}

  @Get('play/:songId')
  @ApiParam({
    name: 'songId',
    required: true,
    description: 'ID of the song to stream',
  })
  @ApiProperty({
    name: 'range',
    required: false,
    description: 'Range of bytes to stream',
  })
  async streamSong(
    @Param('songId') songId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const range = req.headers.range;
    const streamDetails = await this.getSongStreamUseCase.execute(
      songId,
      range,
    );

    // Si el use-case devuelve un 'contentRange', es una petición parcial (206)
    if (streamDetails.contentRange) {
      res.writeHead(206, {
        'Content-Range': streamDetails.contentRange,
        'Accept-Ranges': 'bytes',
        'Content-Length': streamDetails.contentLength,
        'Content-Type': streamDetails.contentType,
      });
    }
    // Si no, es una petición completa (200)
    else {
      res.writeHead(200, {
        'Content-Length': streamDetails.contentLength,
        'Content-Type': streamDetails.contentType,
      });
    }

    streamDetails.stream.pipe(res);
  }
}
