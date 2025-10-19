// src/use-cases/get-song-stream.use-case.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';
import { File } from '@google-cloud/storage';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { UploadSongDTO } from '../dtos/upload-song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { Readable } from 'stream';
import Ffmpeg from 'fluent-ffmpeg';
import { Song } from 'src/entity-modules/song/song.entity';

@Injectable()
export class UploadSongUseCase {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly firebaseStorage: FirebaseStorage,
  ) {}

  async execute(
    uploadSongDto: UploadSongDTO,
    songFile: Express.Multer.File,
  ): Promise<SongDTO> {
    if (!songFile.mimetype.startsWith('audio/')) {
      throw new BadRequestException(
        'Invalid file type. Only audio files are allowed.',
      );
    }
    let convertedFile: { buffer: Buffer; duration: number };
    try {
      convertedFile = await this.convertFileToOGG(songFile);
    } catch {
      throw new BadRequestException('Error converting file to OGG format');
    }

    const song = new Song(
      uploadSongDto.title,
      uploadSongDto.artists,
      uploadSongDto.albumId || null,
      convertedFile.duration,
      '',
    );
    await this.songRepository.persistAndFlush(song);
    const songId = song.id;
    const filePath = `songs/${songId}.ogg`;
    song.setFilePath(filePath);
    await Promise.all([
      this.firebaseStorage.uploadFile(
        filePath,
        convertedFile.buffer,
        'audio/ogg',
      ),
      this.songRepository.flush(),
    ]);
    return song.toDTO(SongDTO);
  }

  private convertFileToOGG(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; duration: number }> {
    return new Promise((resolve, reject) => {
      const readableStream = Readable.from(file.buffer);
      const chunks: any[] = [];
      let durationStr: string;

      const command = Ffmpeg(readableStream)
        .on('progress', (progress) => {
          // progress.timemark es un string de la forma '00:01:23.45'
          // Lo guardamos para calcular la duración cuando termine de procesar
          if (progress.timemark) {
            durationStr = progress.timemark;
          }
        })
        .toFormat('ogg')
        .on('error', (err) => {
          reject(new Error(`FFMPEG Error: ${err.message}`));
        })
        .on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            duration: this.parseDurationToSeconds(durationStr),
          });
        });

      command.pipe().on('data', (chunk) => {
        chunks.push(chunk);
      });
    });
  }

  private parseDurationToSeconds(durationString: string): number {
    if (!durationString || typeof durationString !== 'string') {
      return 0;
    }
    const parts = durationString.split(':').map(parseFloat);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      seconds = parts[0];
    }
    return isNaN(seconds) ? 0 : seconds;
  }
}
