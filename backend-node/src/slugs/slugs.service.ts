import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';
import { ConfigService } from '@nestjs/config';
import { ShortURL } from '../models/ShortURL';
import { ShortenDto } from '../dto/shorten.dto';
import { generateSlug } from '../utils/generateSlug';
import { validateURL } from '../utils/validateURL';
import { validateSlug } from '../utils/validateSlug';

@Injectable()
export class SlugsService {
  constructor(
    private readonly mongo: MongoService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async shorten(dto: ShortenDto, req: any): Promise<any> {
    const { url, slug, utms, expiration, trackClicks } = dto;
    if (!validateURL(url)) {
      throw new BadRequestException('Invalid URL');
    }

    // Compose destination URL with UTMs if provided
    let destination = url;
    if (utms && typeof utms === 'object') {
      try {
        const urlObj = new URL(url);
        // Merge UTM params with existing query params
        Object.entries(utms).forEach(([key, value]) => {
          urlObj.searchParams.set(key, value as string);
        });
        destination = urlObj.toString();
      } catch {
        // fallback to naive append if url is not absolute
        const params = new URLSearchParams(utms).toString();
        destination += (destination.includes('?') ? '&' : '?') + params;
      }
    }

    let theSlug = slug;
    if (theSlug) {
      if (!validateSlug(theSlug)) {
        throw new BadRequestException('Invalid custom slug');
      }
      const existing = await this.mongo.findUrlBySlug(theSlug);
      if (existing) {
        throw new ConflictException('Slug already exists');
      }
    } else {
      let tries = 0;
      do {
        theSlug = generateSlug();
        const existing = await this.mongo.findUrlBySlug(theSlug);
        if (!existing) break;
        tries++;
      } while (tries < 5);
      if (tries === 5) {
        throw new ConflictException('Failed to generate unique slug');
      }
    }

    // Parse expiration
    let expireAt: Date | undefined = undefined;
    if (expiration) {
      const expDate = new Date(expiration);
      if (!isNaN(expDate.getTime())) {
        expireAt = expDate;
      }
    }

    const now = new Date();
    const shortUrl: ShortURL = {
      url: destination,
      slug: theSlug,
      createdAt: now,
      createdBy: req.user?.username,
      expireAt,
      utms,
      trackClicks,
      redirectCount: 0,
    };

    await this.mongo.insertShortUrl(shortUrl);
    await this.redis.setSlugCache(
      theSlug,
      { url: destination, expireAt: expireAt?.toISOString(), trackClicks },
      60 * 60 * 24,
    );

    // Compose response
    const base = this.configService.get<string>('BASE_URL')!;
    return {
      slug: theSlug,
      shortLink: `${base}/${theSlug}`,
      destination,
      expiration: expireAt ? expireAt.toISOString() : undefined,
      trackClicks,
    };
  }

  async listUserSlugs(
    username: string,
    page: number,
    size: number,
    includeExpired: boolean,
  ) {
    const results = await this.mongo.findUserSlugs(
      username,
      page,
      size,
      includeExpired,
    );
    const baseURL = this.configService.get<string>('BASE_URL')!;
    return {
      slugs: results.map((doc: any) => ({
        slug: doc.slug,
        shortLink: `${baseURL}/${doc.slug}`,
        destination: doc.url,
        expiration: doc.expireAt ? doc.expireAt.toISOString() : undefined,
        utms: doc.utms,
        redirectCount: doc.clicks || 0,
        trackClicks: doc.trackClicks,
      })),
    };
  }
}
