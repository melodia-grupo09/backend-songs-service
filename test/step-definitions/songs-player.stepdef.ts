import { Given, When, Then } from '@cucumber/cucumber';
import { TestWorld } from './common.stepdef';
import assert from 'assert';
import supertest from 'supertest';
import * as path from 'path';
import * as fs from 'fs';

When(
  'I request to stream the song {string}',
  async function (this: TestWorld, title: string) {
    if (!this.lastUploadedSongId) {
      throw new Error('No song uploaded yet to stream');
    }
    // TODO: Verify title matches if needed, but for now we rely on strict sequence in test

    this.response = await supertest(this.app.getHttpServer())
      .get(`/songs/player/play/${this.lastUploadedSongId}`)
      .set('Range', 'bytes=0-10'); // Request partial content
  },
);

Then(
  'the response header {string} should be {string}',
  function (this: TestWorld, header: string, value: string) {
    assert.strictEqual(this.response?.headers[header.toLowerCase()], value);
  },
);

Then(
  'the response body should match the file {string}',
  function (this: TestWorld, fileName: string) {
    const filePath = path.join(__dirname, '..', 'fixtures', fileName);
    const fileContent = fs.readFileSync(filePath);

    let expectedContent = fileContent;
    if (this.response?.status === 206) {
      const contentRange = this.response.headers['content-range'];
      if (contentRange) {
        const matches = contentRange.match(/bytes (\d+)-(\d+)\//);
        if (matches) {
          const start = parseInt(matches[1], 10);
          const end = parseInt(matches[2], 10);
          // Content-Range end is inclusive, slice end is exclusive
          expectedContent = fileContent.subarray(start, end + 1);
        }
      }
    }

    if (Buffer.isBuffer(this.response?.body)) {
      assert.ok(
        expectedContent
          .subarray(0, this.response.body.length)
          .equals(this.response.body),
        `Response body (length ${this.response.body.length}) does not match file ${fileName} chunk (length ${expectedContent.length})`,
      );
    } else {
      if (this.response?.text) {
        // For text, trimming is already applied
        assert.strictEqual(
          this.response.text.trim(),
          expectedContent.toString().trim(),
          `Response text does not match file ${fileName}`,
        );
      } else {
        assert.deepStrictEqual(
          this.response?.body,
          expectedContent,
          `Response body does not match file ${fileName}`,
        );
      }
    }
  },
);

Given(
  'I add a video {string} to the song {string}',
  async function (this: TestWorld, videoFileName: string, songTitle: string) {
    if (!this.lastUploadedSongId) {
      throw new Error('No song uploaded to add video to');
    }
    const filePath = path.join(__dirname, '..', 'fixtures', videoFileName);
    // Ensure fixture exists
    // We can create a dummy one if needed like we did for audio

    this.response = await supertest(this.app.getHttpServer())
      .post(`/songs/video/${this.lastUploadedSongId}`)
      .attach('videoFile', filePath);

    assert.strictEqual(
      this.response.status,
      201,
      `Failed to upload video: ${JSON.stringify(this.response.body)}`,
    );
  },
);

When(
  'I request to stream the video playlist provided by the server',
  async function (this: TestWorld) {
    if (!this.lastUploadedSongId) {
      throw new Error('No song available');
    }
    // Usually we would fetch the song first to get the video manifest URL,
    // but assuming standard path conventions or mocking:
    // The controller is @Get('video/:songId/:filename')

    this.response = await supertest(this.app.getHttpServer()).get(
      `/songs/player/video/${this.lastUploadedSongId}/playlist.m3u8`,
    );
  },
);
