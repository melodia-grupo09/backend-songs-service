export class MediaConverterServiceMock {
  async convertAudioToOgg(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; duration: number }> {
    return {
      buffer: file.buffer, // Just return original buffer
      duration: 180, // Mock duration 3 mins
    };
  }

  async *convertVideoToHLS(
    file: Express.Multer.File,
  ): AsyncGenerator<{ fileName: string; buffer: Buffer }> {
    yield { fileName: 'playlist.m3u8', buffer: Buffer.from('#EXTM3U') };
    yield { fileName: 'segment0.ts', buffer: Buffer.from('video data') };
  }
}
