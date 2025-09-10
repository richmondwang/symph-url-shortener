import { Test, TestingModule } from '@nestjs/testing';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';
import { ConfigService } from '@nestjs/config';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getLinksCollection = jest.fn();
  incrementClicks = jest.fn();
}

class MockRedisService {
  get = jest.fn();
  set = jest.fn();
  setSlugCache = jest.fn();
  del = jest.fn();
}

describe('RedirectController', () => {
  let controller: RedirectController;
  let service: RedirectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedirectController],
      providers: [
        RedirectService,
        { provide: MongoService, useClass: MockMongoService },
        { provide: RedisService, useClass: MockRedisService },
        ConfigService,
      ],
    }).compile();
    controller = module.get<RedirectController>(RedirectController);
    service = module.get<RedirectService>(RedirectService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call redirectSlug and return result', async () => {
    jest.spyOn(service, 'getSlug').mockResolvedValue({
      url: 'http://test.com',
      expireAt: '',
      trackClicks: false,
    });
    const req = { res: { redirect: jest.fn(), setHeader: jest.fn() } };
    await controller.redirectSlug('slug12345', req);
    expect(req.res.redirect).toHaveBeenCalledWith(301, 'http://test.com');
  });
});
