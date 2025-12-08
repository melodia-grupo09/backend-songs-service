import { Injectable } from '@nestjs/common';
import Ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

@Injectable()
export class MediaConverterService {
  convertAudioToOgg(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; duration: number }> {
    return new Promise((resolve, reject) => {
      const readableStream = Readable.from(file.buffer);
      const chunks: any[] = [];
      let durationStr: string;

      const command = Ffmpeg(readableStream)
        .on('progress', (progress) => {
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

  async *convertVideoToHLS(
    file: Express.Multer.File,
  ): AsyncGenerator<{ fileName: string; buffer: Buffer }> {
    const tempDir = path.join(os.tmpdir(), `hls-proc-${randomUUID()}`);
    const inputFilePath = path.join(tempDir, 'input_video');
    const outputFileName = 'playlist.m3u8';
    const outputFilePath = path.join(tempDir, outputFileName);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    fs.writeFileSync(inputFilePath, file.buffer);

    try {
      await new Promise<void>((resolve, reject) => {
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
          .on('end', () => resolve())
          .on('error', (err) => {
            reject(new Error(`FFMPEG HLS Error: ${err.message}`));
          })
          .run();
      });

      const files = fs.readdirSync(tempDir);

      for (const fileName of files) {
        if (fileName === 'input_video') continue;
        const filePath = path.join(tempDir, fileName);
        const buffer = fs.readFileSync(filePath);
        yield { fileName, buffer };
        // Optional: unlink immediately after yield if we want to be super aggressive with disk space,
        // but the main goal here is RAM.
      }
    } finally {
      this.cleanupTempDir(tempDir);
    }
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

  private cleanupTempDir(dirPath: string) {
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
}
