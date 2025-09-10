import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { MongoService } from '../services/mongo.service';
import { ConfigService } from '@nestjs/config';

class MockMongoService {
  connect = jest.fn();
  getCollection = jest.fn();
  getUsersCollection = jest.fn();
}

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: MongoService, useClass: MockMongoService },
        ConfigService,
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register and return result', async () => {
    const dto: RegisterDto = { username: 'user', password: 'pass' };
    jest
      .spyOn(service, 'register')
      .mockResolvedValue({ message: 'User registered' });
    expect(await controller.register(dto)).toEqual({
      message: 'User registered',
    });
  });

  it('should call login and return result', async () => {
    const dto: LoginDto = { username: 'user', password: 'pass' };
    jest
      .spyOn(service, 'login')
      .mockResolvedValue({ token: 'abc', expiresAt: 123 });
    expect(await controller.login(dto)).toEqual({
      token: 'abc',
      expiresAt: 123,
    });
  });
});
