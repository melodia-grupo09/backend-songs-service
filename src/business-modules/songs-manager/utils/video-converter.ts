import Ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { Song } from 'src/entity-modules/song/song.entity';
import { BadRequestException } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';

export async function addVideoToSong(
  song: Song,
  videoFile: Express.Multer.File,
  firebaseStorage: FirebaseStorage,
): Promise<Promise<any>[]> {
  const uploadPromises: Promise<any>[] = [];
  try {
    const hlsFiles = await convertVideoFileToHLS(videoFile);

    // El archivo .m3u8 principal suele llamarse 'master.m3u8' o 'playlist.m3u8'
    // Guardamos la referencia a la carpeta o al archivo playlist en la entidad si tienes una columna para ello.
    // Asumo que podrías querer guardar la ruta base del video.

    for (const file of hlsFiles) {
      const videoPath = `songs/${song.id}/video/${file.fileName}`;
      // application/x-mpegURL para .m3u8, video/mp2t para .ts
      let mimeType = 'video/mp2t';
      if (file.fileName.endsWith('.m3u8')) {
        mimeType = 'application/x-mpegURL';
      }
      uploadPromises.push(
        firebaseStorage.uploadFile(videoPath, file.buffer, mimeType),
      );
    }
    return uploadPromises;
  } catch (err) {
    throw new BadRequestException(
      'Error processing video file: ' + err.message,
    );
  }
}

async function convertVideoFileToHLS(
  file: Express.Multer.File,
): Promise<{ fileName: string; buffer: Buffer }[]> {
  const tempDir = path.join(os.tmpdir(), `hls-proc-${randomUUID()}`);
  const inputFilePath = path.join(tempDir, 'input_video');
  const outputFileName = 'playlist.m3u8';
  const outputFilePath = path.join(tempDir, outputFileName);

  fs.mkdirSync(tempDir);
  fs.writeFileSync(inputFilePath, file.buffer);

  return new Promise((resolve, reject) => {
    Ffmpeg(inputFilePath)
      .outputOptions([
        '-c:v libx264', // Codec H.264
        '-crf 23', // Calidad visual constante (18-28 es el rango sano, 23 es default balanceado)
        '-preset medium', // Balance velocidad/compresión
        '-c:a aac', // Audio codec AAC
        '-b:a 128k', // Bitrate de audio decente
        '-hls_time 10', // Duración de cada segmento (chunk) en segundos
        '-hls_list_size 0', // 0 significa incluir todos los segmentos en la playlist (VOD)
        '-f hls', // Formato de salida
      ])
      .output(outputFilePath)
      .on('end', () => {
        try {
          const files = fs.readdirSync(tempDir);
          const results: { fileName: string; buffer: Buffer }[] = [];

          for (const fileName of files) {
            if (fileName === 'input_video') continue;
            const filePath = path.join(tempDir, fileName);
            const buffer = fs.readFileSync(filePath);
            results.push({ fileName, buffer });
          }

          cleanupTempDir(tempDir);
          resolve(results);
        } catch (err) {
          reject(
            new Error(
              typeof err.message === 'string'
                ? (err.message as string)
                : 'Unknown error during HLS processing',
            ),
          );
        }
      })
      .on('error', (err) => {
        cleanupTempDir(tempDir);
        reject(new Error(`FFMPEG HLS Error: ${err.message}`));
      })
      .run();
  });
}

function cleanupTempDir(dirPath: string) {
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      fs.unlinkSync(path.join(dirPath, file));
    }
    fs.rmdirSync(dirPath);
  } catch (e) {
    console.warn(`Failed to cleanup temp dir ${dirPath}`, e);
  }
}
