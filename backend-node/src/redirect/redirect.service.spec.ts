import { Test, TestingModule } from '@nestjs/testing';
import { RedirectService } from './redirect.service';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';
import { ConfigService } from '@nestjs/config';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getLinksCollection = jest.fn();
  incrementClicks = jest.fn();
  findUrlBySlug = jest.fn();
}

class MockRedisService {
  get = jest.fn();
  set = jest.fn();
  setSlugCache = jest.fn();
  del = jest.fn();
}

describe('RedirectService', () => {
  let service: RedirectService;
  let mongo: MockMongoService;
  let redis: MockRedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectService,
        { provide: MongoService, useClass: MockMongoService },
        { provide: RedisService, useClass: MockRedisService },
        ConfigService,
      ],
    }).compile();
    service = module.get<RedirectService>(RedirectService);
    mongo = module.get<MockMongoService>(MongoService as any);
    redis = module.get<MockRedisService>(RedisService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return url from cache', async () => {
    redis.get = jest
      .fn()
      .mockResolvedValue(JSON.stringify({ url: 'http://a.com' }));
    const result = await service.getSlug('slug');
    expect(result.url).toBe('http://a.com');
  });

  it('should return url from db if not cached', async () => {
    redis.get = jest.fn().mockResolvedValue(null);
    mongo.findUrlBySlug = jest
      .fn()
      .mockResolvedValue({ url: 'http://b.com', trackClicks: false });
    redis.setSlugCache = jest.fn();
    const result = await service.getSlug('slug');
    expect(result.url).toBe('http://b.com');
  });

  it('should increment clicks if trackClicks is true', async () => {
    redis.get = jest.fn().mockResolvedValue(null);
    mongo.findUrlBySlug = jest
      .fn()
      .mockResolvedValue({ url: 'http://c.com', trackClicks: true });
    mongo.incrementClicks = jest.fn();
    await service.getSlug('slug');
    expect(mongo.incrementClicks).toHaveBeenCalledWith('slug');
  });

  it('should return error if expired', async () => {
    redis.get = jest.fn().mockResolvedValue(null);
    mongo.findUrlBySlug = jest.fn().mockResolvedValue({
      url: 'http://d.com',
      expireAt: new Date(Date.now() - 1000).toISOString(),
      trackClicks: false,
    });
    const result = await service.getSlug('slug');
    expect(result.error).toBe('This link has expired');
  });

  it('should return error if not found', async () => {
    redis.get = jest.fn().mockResolvedValue(null);
    mongo.findUrlBySlug = jest.fn().mockResolvedValue(null);
    const result = await service.getSlug('slug');
    expect(result.error).toBe('Slug not found');
  });
});
