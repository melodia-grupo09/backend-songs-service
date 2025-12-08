import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReleaseInfoService {
  constructor(private readonly httpService: HttpService) {}

  async getReleaseDates(releaseIds: string[]): Promise<Record<string, string>> {
    const releaseDateMap: Record<string, string> = {};
    const uniqueIds = Array.from(new Set(releaseIds.filter(Boolean)));

    if (!uniqueIds.length) {
      return releaseDateMap;
    }

    await Promise.all(
      uniqueIds.map(async (releaseId) => {
        try {
          const response = await this.httpService.axiosRef.get<{
            releaseDate?: string | Date;
          }>(`/releases/${releaseId}`);
          const normalized = this.normalizeDate(response.data.releaseDate);
          if (normalized) {
            releaseDateMap[releaseId] = normalized;
          }
        } catch {
          // Silently ignore failures to keep catalog responsiveness predictable.
        }
      }),
    );

    return releaseDateMap;
  }

  private normalizeDate(value?: string | Date | null): string | undefined {
    if (!value) {
      return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  }
}
