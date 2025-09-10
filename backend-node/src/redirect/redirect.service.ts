import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { MongoService } from '../services/mongo.service';

@Injectable()
export class RedirectService {
  constructor(
    private readonly mongo: MongoService,
    private readonly redis: RedisService,
  ) {}

  async getSlug(slug: string) {
    // Try Redis cache first
    let url: string | undefined;
    let expireAt: string | undefined;
    let trackClicks: boolean | undefined;
    const cached = await this.redis.get(slug);
    if (cached) {
      try {
        const cachedObj = JSON.parse(cached);
        url = cachedObj.url;
        expireAt = cachedObj.expireAt;
        trackClicks = cachedObj.trackClicks;
      } catch {
        url = cached;
      }
    } else {
      // Fallback to MongoDB
      const doc = await this.mongo.findUrlBySlug(slug);
      if (!doc) return { error: 'Slug not found' };
      url = doc.url;
      expireAt = doc.expireAt;
      trackClicks = doc.trackClicks;
      // Store in cache
      await this.redis.setSlugCache(slug, {
        url: url ?? '',
        expireAt: expireAt ? expireAt.toString() : '',
        trackClicks,
      });
    }
    // Click tracking (increment only if trackClicks is true)
    if (trackClicks) {
      await this.mongo.incrementClicks(slug);
    }
    // Expiration check
    if (expireAt && new Date(expireAt) < new Date()) {
      // 410 Gone
      return { error: 'This link has expired', url, expireAt, trackClicks };
    }
    return { url, expireAt, trackClicks };
  }
}
