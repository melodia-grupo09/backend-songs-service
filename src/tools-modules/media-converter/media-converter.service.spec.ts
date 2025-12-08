import { Test, TestingModule } from '@nestjs/testing';
import { MediaConverterService } from './media-converter.service';
import * as fs from 'fs';

// Mock fluent-ffmpeg
const mockFfmpegChain = {
  on: jest.fn().mockReturnThis(),
  toFormat: jest.fn().mockReturnThis(),
  outputOptions: jest.fn().mockReturnThis(),
  output: jest.fn().mockReturnThis(),
  run: jest.fn(),
  pipe: jest.fn(),
};

jest.mock('fluent-ffmpeg', () => {
  return jest.fn(() => mockFfmpegChain);
});
// Re-import to get the mocked function for assertions
import * as ffmpeg from 'fluent-ffmpeg';
const mockFfmpeg = ffmpeg as unknown as jest.Mock;

// Mock filesystem
jest.mock('fs');
jest.mock('os', () => ({
  tmpdir: jest.fn().mockReturnValue('/tmp'),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('MediaConverterService', () => {
  let service: MediaConverterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaConverterService],
    }).compile();

    service = module.get<MediaConverterService>(MediaConverterService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertAudioToOgg', () => {
    it('should convert audio to ogg successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('audio content'),
      } as Express.Multer.File;

      // Setup mock behavior for the chain
      mockFfmpegChain.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          // Simulate async end
          setTimeout(callback, 10);
        } else if (event === 'progress') {
          // trigger progress
          callback({ timemark: '00:03:00.00' });
        }
        return mockFfmpegChain;
      });

      // We need to capture the data handler to push chunks
      let dataHandler: (chunk: any) => void;
      const pipeMock = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            dataHandler = callback;
            // Push a chunk immediately
            setTimeout(() => dataHandler(Buffer.from('converted')), 5);
          }
          return pipeMock;
        }),
      };
      mockFfmpegChain.pipe.mockReturnValue(pipeMock);

      const result = await service.convertAudioToOgg(mockFile);

      expect(mockFfmpeg).toHaveBeenCalled();
      expect(result.buffer).toBeDefined();
      expect(result.buffer.toString()).toBe('converted');
      expect(result.duration).toBe(180); // 3 minutes
    });

    it('should handle ffmpeg error', async () => {
      const mockFile = {
        buffer: Buffer.from('audio content'),
      } as Express.Multer.File;

      mockFfmpegChain.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Conversion failed')), 10);
        }
        return mockFfmpegChain;
      });
      mockFfmpegChain.pipe.mockReturnValue({ on: jest.fn() });

      await expect(service.convertAudioToOgg(mockFile)).rejects.toThrow(
        'FFMPEG Error: Conversion failed',
      );
    });
  });

  describe('convertVideoToHLS', () => {
    it('should convert video to HLS successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('video content'),
      } as Express.Multer.File;

      // Mock fs calls
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (fs.readdirSync as jest.Mock).mockReturnValue([
        'input_video',
        'playlist.m3u8',
        'segment0.ts',
      ]);
      (fs.readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('playlist.m3u8')) return Buffer.from('#EXTM3U');
        if (path.includes('segment0.ts')) return Buffer.from('segment-data');
        return Buffer.from('');
      });
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      (fs.rmdirSync as jest.Mock).mockImplementation(() => {});

      mockFfmpegChain.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          setTimeout(callback, 10);
        }
        return mockFfmpegChain;
      });
      mockFfmpegChain.run.mockImplementation(() => {});

      const result = await service.convertVideoToHLS(mockFile);

      expect(mockFfmpeg).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result.find((f) => f.fileName === 'playlist.m3u8')).toBeDefined();
      expect(result.find((f) => f.fileName === 'segment0.ts')).toBeDefined();
      expect(fs.rmdirSync).toHaveBeenCalled(); // cleanup
    });

    it('should handle HLS conversion error', async () => {
      const mockFile = {
        buffer: Buffer.from('video content'),
      } as Express.Multer.File;

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      mockFfmpegChain.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('HLS failed')), 10);
        }
        return mockFfmpegChain;
      });

      await expect(service.convertVideoToHLS(mockFile)).rejects.toThrow(
        'FFMPEG HLS Error: HLS failed',
      );
      expect(fs.rmdirSync).toHaveBeenCalled(); // cleanup even on error (actually cleanupTempDir catches error but ensure it's called)
    });
  });
});
