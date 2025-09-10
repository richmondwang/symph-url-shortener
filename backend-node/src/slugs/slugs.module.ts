import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SlugsController } from './slugs.controller';
import { SlugsService } from './slugs.service';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';

@Module({
  imports: [ConfigModule],
  controllers: [SlugsController],
  providers: [SlugsService, MongoService, RedisService],
})
export class SlugsModule {}
