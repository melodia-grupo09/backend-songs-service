import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SongDTO } from 'src/entity-modules/song/song.dto';
import {
  AvailabilityRegion,
  SongStatus,
} from 'src/entity-modules/song/song.entity';
import { getEffectiveStatus } from 'src/utils/status.util';
import { ListSongsUseCase } from './use-cases/list-songs.use-case';
import { GetSongByIdUseCase } from './use-cases/get-song-by-id.use-case';
import { UpdateSongAvailabilityUseCase } from './use-cases/update-song-availability.use-case';
import { BlockSongUseCase } from './use-cases/block-song.use-case';
import { UnblockSongUseCase } from './use-cases/unblock-song.use-case';

@ApiTags('songs-admin')
@Controller('songs/admin')
export class SongsAdminController {
  constructor(
    private readonly listSongsUseCase: ListSongsUseCase,
    private readonly getSongByIdUseCase: GetSongByIdUseCase,
    private readonly updateSongAvailabilityUseCase: UpdateSongAvailabilityUseCase,
    private readonly blockSongUseCase: BlockSongUseCase,
    private readonly unblockSongUseCase: UnblockSongUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'hasVideo', required: false, enum: ['yes', 'no'] })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'sort', required: false, enum: ['recent', 'title'] })
  async list(
    @Query('page', new DefaultValuePipe(1), new ParseIntPipe()) page: number,
    @Query('limit', new DefaultValuePipe(25), new ParseIntPipe()) limit: number,
    @Query('perPage') perPage?: number,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('hasVideo') hasVideo?: 'yes' | 'no',
    @Query('region') region?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sort') sort?: 'recent' | 'title',
  ) {
    const pageSize =
      typeof perPage === 'string'
        ? parseInt(perPage as unknown as string, 10) || limit
        : (perPage ?? limit);
    return this.listSongsUseCase.execute({
      page,
      limit: pageSize,
      q,
      status,
      hasVideo,
      region,
      from,
      to,
      sort,
    });
  }

  @Get(':id')
  async getSong(
    @Param('id') id: string,
  ): Promise<SongDTO & { effectiveStatus: string }> {
    const song = await this.getSongByIdUseCase.execute(id, false);
    const effectiveStatus = getEffectiveStatus(
      song.status as SongStatus,
      song.availability?.regions ?? ([] as AvailabilityRegion[]),
    );
    return { ...song, effectiveStatus };
  }

  @Patch(':id/availability')
  async updateAvailability(
    @Param('id') id: string,
    @Body()
    payload: {
      status?: SongStatus;
      scope?: 'global' | 'regions';
      regions?: string[];
      reason?: string;
      actor?: string;
      validFrom?: string;
      validTo?: string;
    },
  ): Promise<SongDTO> {
    return this.updateSongAvailabilityUseCase.execute(id, payload);
  }

  @Post(':id/block')
  async block(
    @Param('id') id: string,
    @Body()
    payload: {
      scope?: 'global' | 'regions';
      regions?: string[];
      reasonCode: string;
      actor?: string;
    },
  ): Promise<SongDTO> {
    return this.blockSongUseCase.execute(id, payload);
  }

  @Post(':id/unblock')
  async unblock(
    @Param('id') id: string,
    @Body() payload: { actor?: string },
  ): Promise<SongDTO> {
    return this.unblockSongUseCase.execute(id, payload);
  }
}
