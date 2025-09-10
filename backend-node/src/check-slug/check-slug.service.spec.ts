import { Test, TestingModule } from '@nestjs/testing';
import { CheckSlugService } from './check-slug.service';
import { MongoService } from '../services/mongo.service';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getLinksCollection = jest.fn();
  findUrlBySlug = jest.fn();
}
import { ConfigService } from '@nestjs/config';

describe('CheckSlugService', () => {
  let service: CheckSlugService;
  let mongo: MockMongoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckSlugService,
        { provide: MongoService, useClass: MockMongoService },
        ConfigService,
      ],
    }).compile();
    service = module.get<CheckSlugService>(CheckSlugService);
    mongo = module.get<MockMongoService>(MongoService as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return invalid for bad slug', async () => {
    const result = await service.check('!!bad!!');
    expect(result.available).toBe(false);
    expect(result.message).toBe('Invalid format');
  });

  it('should return unavailable if slug exists', async () => {
    mongo.findUrlBySlug = jest.fn().mockResolvedValue({ slug: 'duplicate' });
    const result = await service.check('duplicate');
    expect(result.available).toBe(false);
    expect(result.message).toBe('Slug already exists');
  });

  it('should return available if slug does not exist', async () => {
    mongo.findUrlBySlug = jest.fn().mockResolvedValue(null);
    const result = await service.check('available');
    expect(result.available).toBe(true);
    expect(result.message).toBe('');
  });
});
