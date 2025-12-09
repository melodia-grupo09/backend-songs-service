import { Injectable, NotFoundException } from '@nestjs/common';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';
import { UpdateSongMetadataDTO } from '../dtos/update-song-metadata.dto';

@Injectable()
export class UpdateSongMetadataUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(id: string, payload: UpdateSongMetadataDTO): Promise<SongDTO> {
    const song = await this.songRepository.findOne({ id });
    if (!song) throw new NotFoundException(`Song with ID ${id} not found`);

    // Update only the provided fields
    if (payload.title !== undefined) {
      song.title = payload.title;
    }

    if (payload.artists !== undefined) {
      song.artists = payload.artists;
    }

    if (payload.albumId !== undefined) {
      song.albumId = payload.albumId;
    }

    if (payload.duration !== undefined) {
      song.duration = payload.duration;
    }

    if (payload.releaseDate !== undefined) {
      song.releaseDate = payload.releaseDate;
    }

    await this.songRepository.flush();

    // Initialize availability if missing for consistent response
    if (!song.availability?.regions?.length) {
      song.availability = {
        policy: song.availability?.policy ?? 'global-allow',
        regions: [{ code: 'global', allowed: true, status: 'published' }],
      };
    }

    const dto = song.toDTO(SongDTO);
    return {
      ...dto,
      availability: song.availability,
      auditLog: song.auditLog ?? [],
    };
  }
}
