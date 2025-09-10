import { Test, TestingModule } from '@nestjs/testing';
import { CheckSlugController } from './check-slug.controller';
import { CheckSlugService } from './check-slug.service';
import { MongoService } from '../services/mongo.service';
import { ConfigService } from '@nestjs/config';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getLinksCollection = jest.fn();
}

describe('CheckSlugController', () => {
  let controller: CheckSlugController;
  let service: CheckSlugService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckSlugController],
      providers: [
        CheckSlugService,
        { provide: MongoService, useClass: MockMongoService },
        ConfigService,
      ],
    }).compile();
    controller = module.get<CheckSlugController>(CheckSlugController);
    service = module.get<CheckSlugService>(CheckSlugService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call check and return result', async () => {
    jest
      .spyOn(service, 'check')
      .mockResolvedValue({ available: true, message: '' });
    expect(await controller.check('slug12345')).toEqual({
      available: true,
      message: '',
    });
  });
});
