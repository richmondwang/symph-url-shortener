import { Test, TestingModule } from '@nestjs/testing';
import { SlugsService } from './slugs.service';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getLinksCollection = jest.fn();
  getUsersCollection = jest.fn();
  incrementClicks = jest.fn();
  findUrlBySlug = jest.fn();
  insertShortUrl = jest.fn();
}

class MockRedisService {
  get = jest.fn();
  set = jest.fn();
  setSlugCache = jest.fn();
  del = jest.fn();
}
import { ConfigService } from '@nestjs/config';

describe('SlugsService', () => {
  let service: SlugsService;
  let mongo: MockMongoService;
  let redis: MockRedisService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlugsService,
        { provide: MongoService, useClass: MockMongoService },
        { provide: RedisService, useClass: MockRedisService },
        ConfigService,
      ],
    }).compile();
    service = module.get<SlugsService>(SlugsService);
    mongo = module.get<MockMongoService>(MongoService as any);
    redis = module.get<MockRedisService>(RedisService as any);
    config = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw for invalid custom slug', async () => {
    await expect(
      service.shorten({ url: 'http://a.com', slug: '!!bad!!' } as any, {}),
    ).rejects.toThrow('Invalid custom slug');
  });

  it('should throw for duplicate custom slug', async () => {
    mongo.findUrlBySlug = jest
      .fn()
      .mockResolvedValueOnce({ slug: 'duplicate' });
    await expect(
      service.shorten({ url: 'http://a.com', slug: 'duplicate' } as any, {}),
    ).rejects.toThrow('Slug already exists');
  });

  it('should generate a unique slug', async () => {
    mongo.findUrlBySlug = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(null);
    const result = await service.shorten({ url: 'http://a.com' } as any, {});
    expect(result.slug).toBeDefined();
  });

  it('should fail after 5 tries to generate slug', async () => {
    mongo.findUrlBySlug = jest.fn().mockResolvedValue({});
    await expect(
      service.shorten({ url: 'http://a.com' } as any, {}),
    ).rejects.toThrow('Failed to generate unique slug');
  });

  it('should merge UTM params', async () => {
    mongo.findUrlBySlug = jest.fn().mockResolvedValue(null);
    const dto = {
      url: 'http://a.com',
      utms: { utm_source: 'x', utm_medium: 'y' },
    } as any;
    const result = await service.shorten(dto, {});
    expect(result.destination).toContain('utm_source=x');
    expect(result.destination).toContain('utm_medium=y');
  });

  it('should parse expiration', async () => {
    mongo.findUrlBySlug = jest.fn().mockResolvedValue(null);
    const dto = {
      url: 'http://a.com',
      expiration: new Date(Date.now() + 10000).toISOString(),
    } as any;
    const result = await service.shorten(dto, {});
    expect(result.expiration).toBeDefined();
  });

  it('should create short url successfully', async () => {
    mongo.findUrlBySlug = jest.fn().mockResolvedValue(null);
    mongo.insertShortUrl = jest.fn().mockResolvedValue({});
    redis.setSlugCache = jest.fn().mockResolvedValue('OK');
    const dto = { url: 'http://a.com', slug: 'slug123456' } as any;
    const result = await service.shorten(dto, {});
    expect(result.slug).toBe('slug123456');
    expect(result.shortLink).toContain('slug123456');
  });
});
