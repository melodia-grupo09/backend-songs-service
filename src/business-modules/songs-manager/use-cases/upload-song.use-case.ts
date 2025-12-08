import { BadRequestException, Injectable } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { UploadSongDTO } from '../dtos/upload-song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { Song } from 'src/entity-modules/song/song.entity';
import { MediaConverterService } from 'src/tools-modules/media-converter/media-converter.service';

@Injectable()
export class UploadSongUseCase {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly firebaseStorage: FirebaseStorage,
    private readonly mediaConverterService: MediaConverterService,
  ) {}

  async execute(
    uploadSongDto: UploadSongDTO,
    songFile: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ): Promise<SongDTO> {
    if (!songFile.mimetype.startsWith('audio/')) {
      throw new BadRequestException(
        'Invalid file type. Only audio files are allowed.',
      );
    }
    let convertedAudio: { buffer: Buffer; duration: number };

    try {
      convertedAudio =
        await this.mediaConverterService.convertAudioToOgg(songFile);
    } catch {
      throw new BadRequestException('Error converting file to OGG format');
    }

    const song = new Song(
      uploadSongDto.title,
      uploadSongDto.artists,
      uploadSongDto.albumId || null,
      convertedAudio.duration,
    );
    await this.songRepository.persistAndFlush(song);
    const songId = song.id;

    const uploadPromises: Promise<any>[] = [];

    const audioPath = `songs/${songId}.ogg`;
    uploadPromises.push(
      this.firebaseStorage.uploadFile(
        audioPath,
        convertedAudio.buffer,
        'audio/ogg',
      ),
    );

    if (videoFile !== undefined) {
      const hlsFiles = this.mediaConverterService.convertVideoToHLS(videoFile);
      for await (const file of hlsFiles) {
        const videoPath = `songs/${song.id}/video/${file.fileName}`;
        let mimeType = 'video/mp2t';
        if (file.fileName.endsWith('.m3u8')) {
          mimeType = 'application/x-mpegURL';
        }
        await this.firebaseStorage.uploadFile(videoPath, file.buffer, mimeType);
      }
      song.setHasVideo(true);
    }

    await Promise.all([...uploadPromises, this.songRepository.flush()]);
    return song.toDTO(SongDTO);
  }
}
