// src/songs/songs.controller.ts

import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiParam, ApiProperty } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GetSongStreamUseCase } from './use-cases/get-song-stream.use-case';
import { GetVideoStreamUseCase } from './use-cases/get-video-stream.use-case';
import { StreamDetails } from './types/stream-details.type';

@Controller('songs/player')
export class SongsPlayerController {
  constructor(
    private readonly getSongStreamUseCase: GetSongStreamUseCase,
    private readonly getVideoStreamUseCase: GetVideoStreamUseCase,
  ) {}

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
    @Query('region') region?: string,
  ) {
    const range = req.headers.range;
    const streamDetails = await this.getSongStreamUseCase.execute(
      songId,
      range,
      region,
    );
    this.handleStreamResponse(res, streamDetails);
  }

  @Get('video/:songId/:filename')
  @ApiParam({
    name: 'songId',
    required: true,
    description: 'ID of the song',
  })
  @ApiParam({
    name: 'filename',
    required: true,
    description: 'Specific HLS file (playlist.m3u8 or segments .ts)',
  })
  async streamVideo(
    @Param('songId') songId: string,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('region') region?: string,
  ) {
    const range = req.headers.range;

    const streamDetails = await this.getVideoStreamUseCase.execute(
      songId,
      filename,
      range,
      region,
    );

    this.handleStreamResponse(res, streamDetails);
  }

  private handleStreamResponse(res: Response, streamDetails: StreamDetails) {
    if (streamDetails.contentRange) {
      res.writeHead(206, {
        'Content-Range': streamDetails.contentRange,
        'Accept-Ranges': 'bytes',
        'Content-Length': streamDetails.contentLength,
        'Content-Type': streamDetails.contentType,
      });
    } else {
      res.writeHead(200, {
        'Content-Length': streamDetails.contentLength,
        'Content-Type': streamDetails.contentType,
        'Cache-Control': streamDetails.contentType.includes('mpegURL')
          ? 'no-cache'
          : 'public, max-age=31536000',
      });
    }
    streamDetails.stream.pipe(res);
  }
}
