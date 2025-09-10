import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CheckSlugController } from './check-slug.controller';
import { CheckSlugService } from './check-slug.service';
import { MongoService } from '../services/mongo.service';

@Module({
  imports: [ConfigModule],
  controllers: [CheckSlugController],
  providers: [CheckSlugService, MongoService],
})
export class CheckSlugModule {}
