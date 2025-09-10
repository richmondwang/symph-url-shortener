import { Test, TestingModule } from '@nestjs/testing';
import { SlugsController } from './slugs.controller';
import { SlugsService } from './slugs.service';
import { ShortenDto } from '../dto/shorten.dto';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';
import { ConfigService } from '@nestjs/config';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getLinksCollection = jest.fn();
  getUsersCollection = jest.fn();
  incrementClicks = jest.fn();
}

class MockRedisService {
  get = jest.fn();
  set = jest.fn();
  setSlugCache = jest.fn();
  del = jest.fn();
}

describe('SlugsController', () => {
  let controller: SlugsController;
  let service: SlugsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlugsController],
      providers: [
        SlugsService,
        { provide: MongoService, useClass: MockMongoService },
        { provide: RedisService, useClass: MockRedisService },
        ConfigService,
      ],
    }).compile();
    controller = module.get<SlugsController>(SlugsController);
    service = module.get<SlugsService>(SlugsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call shorten and return result', async () => {
    const dto: ShortenDto = { url: 'http://test.com', slug: 'slug12345' };
    jest.spyOn(service, 'shorten').mockResolvedValue({
      slug: 'slug12345',
      shortLink: 'http://test.com/slug12345',
      destination: 'http://test.com',
      expiration: '',
      trackClicks: false,
    });
    expect(
      await controller.shorten(dto, { user: { username: 'user' } }),
    ).toEqual({
      slug: 'slug12345',
      shortLink: 'http://test.com/slug12345',
      destination: 'http://test.com',
      expiration: '',
      trackClicks: false,
    });
  });

  it('should call getUserSlugs and return result', async () => {
    jest.spyOn(service, 'listUserSlugs').mockResolvedValue({ slugs: [] });
    expect(
      await controller.getUserSlugs(
        { user: { username: 'user' } },
        1,
        100,
        false,
      ),
    ).toEqual({ slugs: [] });
  });
});
