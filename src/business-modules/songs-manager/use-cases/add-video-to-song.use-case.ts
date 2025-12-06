import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { addVideoToSong } from '../utils/video-converter';


@Injectable()
export class AddVideoToSongUseCase {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly firebaseStorage: FirebaseStorage,
  ) { }

  async execute(
    songId: string,
    videoFile: Express.Multer.File,
  ): Promise<SongDTO> {

    const song = await this.songRepository.findOne({ id: songId });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    const uploadPromises = await addVideoToSong(song, videoFile, this.firebaseStorage);
    await Promise.all([...uploadPromises, this.songRepository.flush()]);
    return song.toDTO(SongDTO);
  }
}
