import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';
import { StreamDetails } from '../interfaces/stream';

@Injectable()
export class GetVideoStreamUseCase {
  constructor(private readonly firebaseStorage: FirebaseStorage) {}

  async execute(
    songId: string,
    filename: string,
    range?: string,
  ): Promise<StreamDetails> {
    try {
      // HLS requiere buscar el archivo específico (.m3u8 o .ts) dentro de la carpeta del video
      const filePath = `songs/${songId}/video/${filename}`;
      const file = this.firebaseStorage.getFile(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        throw new NotFoundException(
          `File ${filename} not found for song ${songId}`,
        );
      }

      const [metadata] = await file.getMetadata();
      const fileSize = parseInt(metadata.size as string, 10); // GCloud a veces devuelve string

      // Fallback de Content-Type si Google Cloud no lo tiene
      let contentType = metadata.contentType;
      if (!contentType) {
        contentType = filename.endsWith('.m3u8')
          ? 'application/x-mpegURL'
          : 'video/mp2t';
      }

      // Lógica de Rango (Range Requests)
      // Aunque HLS suele pedir archivos completos, soportar range es buena práctica
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const stream = file.createReadStream({ start, end });

        return {
          stream,
          contentType,
          contentLength: chunkSize,
          contentRange: `bytes ${start}-${end}/${fileSize}`,
        };
      } else {
        const stream = file.createReadStream();

        return {
          stream,
          contentType,
          contentLength: fileSize,
        };
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error.code === 404) {
        throw new NotFoundException('Video resource not found');
      }
      throw error;
    }
  }
}
