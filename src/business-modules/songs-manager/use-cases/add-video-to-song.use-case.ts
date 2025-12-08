import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { MediaConverterService } from 'src/tools-modules/media-converter/media-converter.service';

@Injectable()
export class AddVideoToSongUseCase {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly firebaseStorage: FirebaseStorage,
    private readonly mediaConverterService: MediaConverterService,
  ) {}

  async execute(
    songId: string,
    videoFile: Express.Multer.File,
  ): Promise<SongDTO> {
    const song = await this.songRepository.findOne({ id: songId });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    const hlsFiles =
      await this.mediaConverterService.convertVideoToHLS(videoFile);
    const uploadPromises: Promise<any>[] = [];

    for (const file of hlsFiles) {
      const videoPath = `songs/${song.id}/video/${file.fileName}`;
      let mimeType = 'video/mp2t';
      if (file.fileName.endsWith('.m3u8')) {
        mimeType = 'application/x-mpegURL';
      }
      uploadPromises.push(
        this.firebaseStorage.uploadFile(videoPath, file.buffer, mimeType),
      );
    }
    song.setHasVideo(true);
    await Promise.all([...uploadPromises, this.songRepository.flush()]);
    return song.toDTO(SongDTO);
  }
}
