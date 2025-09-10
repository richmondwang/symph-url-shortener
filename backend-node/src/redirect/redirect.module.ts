import { Module } from '@nestjs/common';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';
import { SlugsService } from '../slugs/slugs.service';
import { MongoService } from '../services/mongo.service';
import { RedisService } from '../services/redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [RedirectController],
  providers: [
    RedirectService,
    SlugsService,
    MongoService,
    RedisService,
    ConfigService,
  ],
})
export class RedirectModule {}
