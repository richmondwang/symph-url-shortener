import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;
  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(this.configService.get<string>('REDIS_URL')!);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expire?: number): Promise<'OK'> {
    if (expire) {
      return this.client.set(key, value, 'EX', expire);
    }
    return this.client.set(key, value);
  }

  async setSlugCache(
    slug: string,
    data: { url: string; expireAt?: string; trackClicks?: boolean },
    expire: number = 60 * 60 * 24,
  ): Promise<'OK'> {
    return this.set(slug, JSON.stringify(data), expire);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }
}
