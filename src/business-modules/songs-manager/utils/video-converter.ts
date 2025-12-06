import Ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';
import { randomUUID } from 'crypto';
import { Song } from 'src/entity-modules/song/song.entity';
import { BadRequestException } from '@nestjs/common';
import { FirebaseStorage } from 'src/tools-modules/firebase/firebase.storage';

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);
const readdirAsync = util.promisify(fs.readdir);
const unlinkAsync = util.promisify(fs.unlink);
const rmdirAsync = util.promisify(fs.rmdir);
const mkdirAsync = util.promisify(fs.mkdir);

export async function addVideoToSong(
  song: Song,
  videoFile: Express.Multer.File,
  firebaseStorage: FirebaseStorage,
): Promise<Promise<any>[]> {
  const uploadPromises: Promise<any>[] = [];
  try {
    const hlsFiles = await convertVideoFileToHLS(videoFile);

    for (const file of hlsFiles) {
      const videoPath = `songs/${song.id}/video/${file.fileName}`;
      let mimeType = 'video/mp2t';
      if (file.fileName.endsWith('.m3u8')) {
        mimeType = 'application/x-mpegURL';
      }
      uploadPromises.push(
        firebaseStorage.uploadFile(videoPath, file.buffer, mimeType),
      );
    }
    song.setHasVideo(true);
    return uploadPromises;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error processing video';
    throw new BadRequestException(`Error processing video file: ${message}`);
  }
}

async function convertVideoFileToHLS(
  file: Express.Multer.File,
): Promise<{ fileName: string; buffer: Buffer }[]> {
  const tempDir = path.join(os.tmpdir(), `hls-proc-${randomUUID()}`);
  const inputFilePath = path.join(tempDir, 'input_video');
  const outputFileName = 'playlist.m3u8';
  const outputFilePath = path.join(tempDir, outputFileName);

  await mkdirAsync(tempDir);
  await writeFileAsync(inputFilePath, file.buffer);

  return new Promise((resolve, reject) => {
    const rejectWithError = (reason: unknown) => {
      reject(reason instanceof Error ? reason : new Error(String(reason)));
    };

    Ffmpeg(inputFilePath)
      .outputOptions([
        '-c:v libx264',
        '-crf 23',
        '-preset medium',
        '-c:a aac',
        '-b:a 128k',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls',
      ])
      .output(outputFilePath)
      .on('end', () => {
        void (async () => {
          try {
            const files = await readdirAsync(tempDir);
            const results: { fileName: string; buffer: Buffer }[] = [];

            for (const fileName of files) {
              if (fileName === 'input_video') continue;
              const filePath = path.join(tempDir, fileName);
              const buffer = await readFileAsync(filePath);
              results.push({ fileName, buffer });
            }

            await cleanupTempDir(tempDir);
            resolve(results);
          } catch (err) {
            rejectWithError(err);
          }
        })();
      })
      .on('error', (err) => {
        void cleanupTempDir(tempDir);
        rejectWithError(new Error(`FFMPEG HLS Error: ${err.message}`));
      })
      .run();
  });
}

async function cleanupTempDir(dirPath: string) {
  try {
    const files = await readdirAsync(dirPath);
    for (const file of files) {
      await unlinkAsync(path.join(dirPath, file));
    }
    await rmdirAsync(dirPath);
  } catch (e) {
    console.warn(`Failed to cleanup temp dir ${dirPath}`, e);
  }
}
