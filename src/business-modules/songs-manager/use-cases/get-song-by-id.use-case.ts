import { Injectable, NotFoundException } from '@nestjs/common';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import { SongRepository } from 'src/entity-modules/song/song.repository';

@Injectable()
export class GetSongByIdUseCase {
  constructor(private readonly songRepository: SongRepository) {}

  async execute(id: string): Promise<SongDTO> {
    const song = await this.songRepository.findOne({ id });
    if (song === null) {
      throw new NotFoundException(`Song with ID ${id} not found`);
    }
    if (!song.availability?.regions?.length) {
      song.availability = {
        policy: song.availability?.policy ?? 'global-allow',
        regions: [{ code: 'global', allowed: true, status: 'published' }],
      };
    }
    return song.toDTO(SongDTO);
  }
}
