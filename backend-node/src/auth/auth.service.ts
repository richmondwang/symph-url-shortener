import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { MongoService } from '../services/mongo.service';
import { User } from '../models/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private readonly mongo: MongoService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.mongo.findUserByUsername(dto.username);
    if (existing) throw new BadRequestException('Username already exists');
    const hash = await bcrypt.hash(dto.password, 10);
    const user: Omit<User, '_id'> = { username: dto.username, password: hash };
    await this.mongo.insertUser(user);
    return { message: 'User registered' };
  }

  async login(dto: LoginDto) {
    const user = await this.mongo.findUserByUsername(dto.username);
    if (!user) return { error: 'Invalid credentials' };
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) return { error: 'Invalid credentials' };
    const secret = this.configService.get<string>('JWT_SECRET_KEY')!;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const token = jwt.sign(
      { id: user._id, username: user.username, exp: expiresAt },
      secret,
    );
    return { token, expiresAt };
  }
}
