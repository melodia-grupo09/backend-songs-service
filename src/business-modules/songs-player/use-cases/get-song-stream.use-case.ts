import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';
import { File } from '@google-cloud/storage';
import { StreamDetails } from '../types/stream-details.type';

@Injectable()
export class GetSongStreamUseCase {
  constructor(
    private readonly firebaseStorage: FirebaseStorage,
    private readonly songRepository: SongRepository,
  ) {}

  async execute(
    songId: string,
    range?: string,
    region?: string,
  ): Promise<StreamDetails> {
    const song = await this.songRepository.findOne({ id: songId });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    if (!song.isAvailableInRegion(region ?? null)) {
      throw new ForbiddenException('Song is not available in this region');
    }
    try {
      const songFile: File = this.firebaseStorage.getFile(
        `songs/${songId}.ogg`,
      );

      const [metadata] = await songFile.getMetadata();
      const fileSize = parseInt(metadata.size as string, 10);
      const contentType = metadata.contentType || 'audio/ogg';

      // CASO 1: Se solicita un fragmento de la canción (streaming)
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const stream = songFile.createReadStream({ start, end });

        return {
          stream,
          contentType,
          contentLength: chunkSize,
          contentRange: `bytes ${start}-${end}/${fileSize}`,
        };
      }

      // CASO 2: No se especifica un rango, se envía el archivo completo
      else {
        const stream = songFile.createReadStream();

        return {
          stream,
          contentType,
          contentLength: fileSize,
        };
      }
    } catch (error) {
      if (error?.code === 404) {
        throw new NotFoundException('Song not found');
      }
      throw error;
    }
  }
}
