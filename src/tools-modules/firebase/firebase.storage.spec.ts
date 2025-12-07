import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseStorage } from './firebase.storage';
import { app } from 'firebase-admin';

describe('FirebaseStorage', () => {
  let service: FirebaseStorage;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(async () => {
    mockFile = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
      name: 'test-bucket',
    };

    const mockFirebaseApp = {
      storage: jest.fn().mockReturnValue({
        bucket: jest.fn().mockReturnValue(mockBucket),
      }),
    } as unknown as app.App;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseStorage,
        {
          provide: 'FIREBASE_APP',
          useValue: mockFirebaseApp,
        },
      ],
    }).compile();

    service = module.get<FirebaseStorage>(FirebaseStorage);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const filePath = 'path/to/file.mp3';
      const buffer = Buffer.from('file content');
      const contentType = 'audio/mpeg';

      await service.uploadFile(filePath, buffer, contentType);

      expect(mockBucket.file).toHaveBeenCalledWith(filePath);
      expect(mockFile.save).toHaveBeenCalledWith(buffer, {
        metadata: {
          contentType,
        },
      });
    });
  });

  describe('getFile', () => {
    it('should return a file object', () => {
      const filePath = 'path/to/file.mp3';
      const result = service.getFile(filePath);

      expect(mockBucket.file).toHaveBeenCalledWith(filePath);
      expect(result).toBe(mockFile);
    });
  });
});
