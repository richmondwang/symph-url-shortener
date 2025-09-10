import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongoService } from '../services/mongo.service';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, MongoService],
})
export class AuthModule {}
