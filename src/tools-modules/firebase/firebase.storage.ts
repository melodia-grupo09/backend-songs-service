import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { Bucket, File } from '@google-cloud/storage';

@Injectable()
export class FirebaseStorage {
  private bucket: Bucket;

  constructor(@Inject('FIREBASE_APP') firebaseApp: app.App) {
    this.bucket = firebaseApp.storage().bucket();
  }

  getFile(filePath: string): File {
    return this.bucket.file(filePath);
  }
}
