import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MongoService } from '../services/mongo.service';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getUsersCollection = jest.fn();
  findUserByUsername = jest.fn();
  insertUser = jest.fn();
}
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let mongo: MockMongoService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: MongoService, useClass: MockMongoService },
        ConfigService,
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    mongo = module.get<MockMongoService>(MongoService as any);
    config = module.get<ConfigService>(ConfigService);
    config.get = jest.fn().mockReturnValue('testsecret');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    mongo.findUserByUsername = jest.fn().mockResolvedValue(null);
    mongo.insertUser = jest.fn().mockResolvedValue({});
    const result = await service.register({ username: 'u', password: 'p' });
    expect(result.message).toBe('User registered');
  });

  it('should not register duplicate user', async () => {
    mongo.findUserByUsername = jest.fn().mockResolvedValue({ username: 'u' });
    await expect(
      service.register({ username: 'u', password: 'p' }),
    ).rejects.toThrow('Username already exists');
  });

  it('should login successfully', async () => {
    mongo.findUserByUsername = jest.fn().mockResolvedValue({
      username: 'u',
      password: await require('bcryptjs').hash('p', 10),
      _id: 'id',
    });
    const result = await service.login({ username: 'u', password: 'p' });
    expect(result.token).toBeDefined();
    expect(result.expiresAt).toBeDefined();
  });

  it('should fail login with wrong password', async () => {
    mongo.findUserByUsername = jest.fn().mockResolvedValue({
      username: 'u',
      password: await require('bcryptjs').hash('p', 10),
      _id: 'id',
    });
    const result = await service.login({ username: 'u', password: 'wrong' });
    expect(result.error).toBe('Invalid credentials');
  });

  it('should fail login with missing user', async () => {
    mongo.findUserByUsername = jest.fn().mockResolvedValue(null);
    const result = await service.login({ username: 'nouser', password: 'p' });
    expect(result.error).toBe('Invalid credentials');
  });
});
