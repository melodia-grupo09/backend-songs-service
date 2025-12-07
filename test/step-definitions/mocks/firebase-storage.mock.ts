import { Readable } from 'stream';

export class FirebaseStorageMock {
  private storage: Map<string, { buffer: Buffer; contentType: string }> =
    new Map();

  async uploadFile(
    filePath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    this.storage.set(filePath, { buffer, contentType });
    return Promise.resolve();
  }

  getFile(filePath: string): any {
    return {
      save: (buffer: Buffer, options?: any) => {
        this.storage.set(filePath, {
          buffer,
          contentType:
            options?.metadata?.contentType || 'application/octet-stream',
        });
        return Promise.resolve();
      },
      exists: () => Promise.resolve([this.storage.has(filePath)]),
      delete: () => {
        this.storage.delete(filePath);
        return Promise.resolve();
      },
      getMetadata: () => {
        const fileData = this.storage.get(filePath);
        if (!fileData) return Promise.reject({ code: 404 });
        return Promise.resolve([
          { size: fileData.buffer.length, contentType: fileData.contentType },
        ]);
      },
      createReadStream: (options?: { start?: number; end?: number }) => {
        const fileData = this.storage.get(filePath);
        if (!fileData) {
          // Emulating stream error behavior somewhat
          const stream = new Readable();
          stream.destroy(new Error('File not found'));
          return stream;
        }

        let start = 0;
        let end = fileData.buffer.length;

        if (options && typeof options.start === 'number') {
          start = options.start;
        }
        if (options && typeof options.end === 'number') {
          // slice end is exclusive, but range end is inclusive.
          // If range=0-10, we want 11 bytes (0 to 10). slice(0, 11).
          end = options.end + 1;
        }

        const slicedBuffer = fileData.buffer.slice(start, end);
        return Readable.from(slicedBuffer);
      },
    };
  }

  // Helper for tests to verify uploads
  getUploadedFile(filePath: string): Buffer | undefined {
    return this.storage.get(filePath)?.buffer;
  }
}
