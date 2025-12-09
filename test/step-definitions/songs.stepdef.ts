import { Given, When, Then } from '@cucumber/cucumber';
import { TestWorld } from './common.stepdef';
import assert from 'assert';
import supertest from 'supertest';
import * as path from 'path';

Given(
  'a song with title {string} and file {string}',
  async function (this: TestWorld, title: string, fileName: string) {
    const filePath = path.join(__dirname, '..', 'fixtures', fileName);
    // Create a dummy file if it doesn't exist or just mock the buffer content in the request
    // For simplicity, we'll send a buffer directly if we can, or we rely on the file existing.
    // Let's create a dummy buffer for the test instead of reading a real file to simplify "fixtures" dependency.

    // We need to match the DTO expected by the controller: UploadSongDTO
    // and the file upload.

    this.response = await supertest(this.app.getHttpServer())
      .post('/songs/upload')
      .field('title', title)
      .field(
        'artists',
        JSON.stringify([
          { name: 'Test Artist', id: '123e4567-e89b-12d3-a456-426614174000' },
        ]),
      )
      .attach('file', filePath);

    if (this.response.status === 201) {
      this.lastUploadedSongId = this.response.body.id;
      this.uploadedSongs.set(title, this.response.body.id);
    }
  },
);

When(
  'I request the song {string} by its ID',
  async function (this: TestWorld, title: string) {
    const songId = this.uploadedSongs.get(title);
    if (!songId) {
      throw new Error(`Song with title "${title}" not found to get by ID`);
    }

    this.response = await supertest(this.app.getHttpServer()).get(
      `/songs/id/${songId}`,
    );
  },
);

Then(
  'the response should match the Song DTO structure',
  function (this: TestWorld) {
    const song = this.response?.body;
    assert.ok(song, 'Response body should not be empty');
    assert.ok(song.id, 'Song should have an ID');
    assert.strictEqual(typeof song.title, 'string', 'Title should be a string');
    assert.strictEqual(
      typeof song.duration,
      'number',
      'Duration should be a number',
    );
    assert.ok(Array.isArray(song.artists), 'Artists should be an array');
    if (song.artists.length > 0) {
      assert.ok(song.artists[0].id, 'Artist should have an ID');
      assert.ok(song.artists[0].name, 'Artist should have a name');
    }
    assert.strictEqual(
      typeof song.hasVideo,
      'boolean',
      'hasVideo should be a boolean',
    );
    assert.ok(song.createdAt, 'Song should have createdAt');
    assert.ok(song.updatedAt, 'Song should have updatedAt');
  },
);

Then(
  'the song title should be {string}',
  function (this: TestWorld, expectedTitle: string) {
    assert.strictEqual(this.response?.body.title, expectedTitle);
  },
);

When(
  'I search for songs with query {string}',
  async function (this: TestWorld, query: string) {
    this.response = await supertest(this.app.getHttpServer())
      .get(`/songs/search`)
      .query({ query });
  },
);

Then(
  'the response should contain a song with title {string}',
  function (this: TestWorld, expectedTitle: string) {
    const songs = this.response?.body;
    assert(Array.isArray(songs), 'Response body should be an array');
    const song = songs.find((s: any) => s.title === expectedTitle);
    assert(song, `Song with title ${expectedTitle} not found in response`);
  },
);

When(
  'I request {int} random songs',
  async function (this: TestWorld, limit: number) {
    this.response = await supertest(this.app.getHttpServer())
      .get('/songs/random')
      .query({ limit });
  },
);

Then(
  'I should receive a list containing the song {string}',
  function (this: TestWorld, expectedTitle: string) {
    const songs = this.response?.body;
    assert(Array.isArray(songs), 'Response body should be an array');
    const song = songs.find((s: any) => s.title === expectedTitle);
    assert(song, `Song with title ${expectedTitle} not found in response`);
  },
);

When(
  'I attach a video {string} to the song {string}',
  async function (this: TestWorld, videoName: string, songTitle: string) {
    const songId = this.uploadedSongs.get(songTitle);
    if (!songId) {
      throw new Error(
        `Song with title "${songTitle}" not found to attach video`,
      );
    }

    const filePath = path.join(__dirname, '..', 'fixtures', videoName);

    this.response = await supertest(this.app.getHttpServer())
      .post(`/songs/video/${songId}`)
      .attach('videoFile', filePath);
  },
);

Then('the song should have video available', function (this: TestWorld) {
  assert.strictEqual(
    this.response?.body?.hasVideo,
    true,
    'Song should have hasVideo=true',
  );
});

When(
  'I upload a song {string} with file {string} and video {string}',
  async function (
    this: TestWorld,
    title: string,
    songFileName: string,
    videoFileName: string,
  ) {
    const songPath = path.join(__dirname, '..', 'fixtures', songFileName);
    const videoPath = path.join(__dirname, '..', 'fixtures', videoFileName);

    this.response = await supertest(this.app.getHttpServer())
      .post('/songs/upload')
      .field('title', title)
      .field(
        'artists',
        JSON.stringify([
          { name: 'Test Artist', id: '123e4567-e89b-12d3-a456-426614174000' },
        ]),
      )
      .attach('file', songPath)
      .attach('videoFile', videoPath);

    if (this.response.status === 201) {
      this.lastUploadedSongId = this.response.body.id;
    }
  },
);

// Availability update step definitions
When(
  'I update the availability of song {string} with status {string} and scope {string}',
  async function (
    this: TestWorld,
    songTitle: string,
    status: string,
    scope: string,
  ) {
    const songId = this.uploadedSongs.get(songTitle);
    if (!songId) {
      throw new Error(
        `Song with title "${songTitle}" not found to update availability`,
      );
    }

    this.response = await supertest(this.app.getHttpServer())
      .patch(`/songs/admin/${songId}/availability`)
      .send({
        status,
        scope,
        actor: 'test-admin',
        reason: 'Test update',
      });
  },
);

When(
  'I update the availability of song {string} for regions {string} with status {string}',
  async function (
    this: TestWorld,
    songTitle: string,
    regions: string,
    status: string,
  ) {
    const songId = this.uploadedSongs.get(songTitle);
    if (!songId) {
      throw new Error(
        `Song with title "${songTitle}" not found to update availability`,
      );
    }

    const regionList = regions.split(',').map((r) => r.trim());

    this.response = await supertest(this.app.getHttpServer())
      .patch(`/songs/admin/${songId}/availability`)
      .send({
        status,
        scope: 'regions',
        regions: regionList,
        actor: 'test-admin',
        reason: 'Regional update',
      });
  },
);

When(
  'I update the availability of song {string} with status {string} from {string} to {string}',
  async function (
    this: TestWorld,
    songTitle: string,
    status: string,
    validFrom: string,
    validTo: string,
  ) {
    const songId = this.uploadedSongs.get(songTitle);
    if (!songId) {
      throw new Error(
        `Song with title "${songTitle}" not found to update availability`,
      );
    }

    this.response = await supertest(this.app.getHttpServer())
      .patch(`/songs/admin/${songId}/availability`)
      .send({
        status,
        validFrom,
        validTo,
        actor: 'scheduler',
        // Don't provide reason so validity info is included in the generated details
      });
  },
);

const blockSongGlobally = async function (
  this: TestWorld,
  songTitle: string,
  reasonCode: string,
  saveResponse: boolean = true,
) {
  const songId = this.uploadedSongs.get(songTitle);
  if (!songId) {
    throw new Error(`Song with title "${songTitle}" not found to block`);
  }

  const response = await supertest(this.app.getHttpServer())
    .post(`/songs/admin/${songId}/block`)
    .send({
      scope: 'global',
      reasonCode,
      actor: 'test-admin',
    });

  if (saveResponse) {
    this.response = response;
  }
};

When(
  'I block song {string} globally with reason code {string}',
  async function (this: TestWorld, songTitle: string, reasonCode: string) {
    await blockSongGlobally.call(this, songTitle, reasonCode, true);
  },
);

Given(
  'the song {string} is blocked globally with reason code {string}',
  async function (this: TestWorld, songTitle: string, reasonCode: string) {
    await blockSongGlobally.call(this, songTitle, reasonCode, false);
  },
);

When(
  'I unblock song {string}',
  async function (this: TestWorld, songTitle: string) {
    const songId = this.uploadedSongs.get(songTitle);
    if (!songId) {
      throw new Error(`Song with title "${songTitle}" not found to unblock`);
    }

    this.response = await supertest(this.app.getHttpServer())
      .post(`/songs/admin/${songId}/unblock`)
      .send({
        actor: 'test-admin',
      });
  },
);

Then(
  'the song status should be {string}',
  function (this: TestWorld, expectedStatus: string) {
    assert.strictEqual(
      this.response?.body.status,
      expectedStatus,
      `Expected status to be ${expectedStatus}`,
    );
  },
);

Then(
  'all regions should have allowed set to {word}',
  function (this: TestWorld, expectedAllowed: string) {
    const song = this.response?.body;
    assert.ok(song.availability, 'Song should have availability');
    assert.ok(song.availability.regions, 'Availability should have regions');

    const expectedBool = expectedAllowed === 'true';
    const allMatch = song.availability.regions.every(
      (region: any) => region.allowed === expectedBool,
    );
    assert.ok(
      allMatch,
      `All regions should have allowed=${expectedAllowed}, but some didn't match`,
    );
  },
);

Then(
  'all regions should have status {string}',
  function (this: TestWorld, expectedStatus: string) {
    const song = this.response?.body;
    assert.ok(song.availability, 'Song should have availability');
    assert.ok(song.availability.regions, 'Availability should have regions');

    const allMatch = song.availability.regions.every(
      (region: any) => region.status === expectedStatus,
    );
    assert.ok(
      allMatch,
      `All regions should have status=${expectedStatus}, but some didn't match`,
    );
  },
);

Then(
  'the audit log should contain an {string} action',
  function (this: TestWorld, expectedAction: string) {
    const song = this.response?.body;
    assert.ok(song.auditLog, 'Song should have auditLog');
    assert.ok(Array.isArray(song.auditLog), 'auditLog should be an array');

    const hasAction = song.auditLog.some(
      (entry: any) => entry.action === expectedAction,
    );
    assert.ok(hasAction, `Audit log should contain action "${expectedAction}"`);
  },
);

Then(
  'the regions {string} should have status {string}',
  function (this: TestWorld, regions: string, expectedStatus: string) {
    const song = this.response?.body;
    const regionList = regions.split(',').map((r) => r.trim().toLowerCase());

    assert.ok(song.availability, 'Song should have availability');
    assert.ok(song.availability.regions, 'Availability should have regions');

    regionList.forEach((regionCode) => {
      const region = song.availability.regions.find(
        (r: any) => r.code === regionCode,
      );
      assert.ok(region, `Region "${regionCode}" should exist`);
      assert.strictEqual(
        region.status,
        expectedStatus,
        `Region "${regionCode}" should have status "${expectedStatus}"`,
      );
    });
  },
);

Then(
  'the regions {string} should have allowed set to {word}',
  function (this: TestWorld, regions: string, expectedAllowed: string) {
    const song = this.response?.body;
    const regionList = regions.split(',').map((r) => r.trim().toLowerCase());
    const expectedBool = expectedAllowed === 'true';

    assert.ok(song.availability, 'Song should have availability');
    assert.ok(song.availability.regions, 'Availability should have regions');

    regionList.forEach((regionCode) => {
      const region = song.availability.regions.find(
        (r: any) => r.code === regionCode,
      );
      assert.ok(region, `Region "${regionCode}" should exist`);
      assert.strictEqual(
        region.allowed,
        expectedBool,
        `Region "${regionCode}" should have allowed=${expectedAllowed}`,
      );
    });
  },
);

Then(
  'the audit log should contain regions {string}',
  function (this: TestWorld, expectedRegions: string) {
    const song = this.response?.body;
    const regionList = expectedRegions.split(',').map((r) => r.trim());

    assert.ok(song.auditLog, 'Song should have auditLog');
    assert.ok(Array.isArray(song.auditLog), 'auditLog should be an array');

    const latestEntry = song.auditLog[0];
    assert.ok(latestEntry, 'Audit log should have at least one entry');
    assert.ok(latestEntry.regions, 'Latest audit entry should have regions');

    regionList.forEach((regionCode) => {
      assert.ok(
        latestEntry.regions.includes(regionCode),
        `Audit log should contain region "${regionCode}"`,
      );
    });
  },
);

Then(
  'the audit log should contain validity information',
  function (this: TestWorld) {
    const song = this.response?.body;
    assert.ok(song.auditLog, 'Song should have auditLog');
    assert.ok(Array.isArray(song.auditLog), 'auditLog should be an array');
    assert.ok(
      song.auditLog.length > 0,
      'Audit log should have at least one entry',
    );

    const latestEntry = song.auditLog[0];
    assert.ok(latestEntry, 'Latest audit entry should exist');
    assert.ok(latestEntry.details, 'Audit entry should have details');
    assert.ok(
      latestEntry.details.includes('validity'),
      `Audit log details should contain validity information. Got: ${latestEntry.details}`,
    );
  },
);
