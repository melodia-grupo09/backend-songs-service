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
      convertedFile.duration,
      '',
    );
    const songId = song.id;
    const filePath = `songs/${songId}.ogg`;
    song.setFilePath(filePath);
    await Promise.all([
      this.firebaseStorage.uploadFile(
        filePath,
        convertedFile.buffer,
        'audio/ogg',
      ),
      this.songRepository.persistAndFlush(song),
    ]);
    return song.toDTO(SongDTO);
  }

  private convertFileToOGG(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; duration: number }> {
    return new Promise((resolve, reject) => {
      const readableStream = Readable.from(file.buffer);
      const chunks: any[] = [];

      Ffmpeg(readableStream)
        .toFormat('ogg')
        .on('error', (err) => {
          reject(err);
        })
        .on('end', () => {
          resolve({ buffer: Buffer.concat(chunks), duration: 0 });
        })
        .pipe()
        .on('data', (chunk) => {
          chunks.push(chunk);
        });
    });
  }
}
