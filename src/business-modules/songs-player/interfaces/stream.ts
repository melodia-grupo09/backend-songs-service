import { Readable } from 'stream';

export interface StreamDetails {
  stream: Readable;
  contentType: string;
  contentLength: number;
  contentRange?: string;
}
