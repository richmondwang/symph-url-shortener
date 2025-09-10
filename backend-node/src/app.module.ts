import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { ShortenerModule } from './shortener/shortener.module';
import { AuthModule } from './auth/auth.module';
import { SlugsModule } from './slugs/slugs.module';
import { CheckSlugModule } from './check-slug/check-slug.module';
import { RedirectModule } from './redirect/redirect.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        BASE_URL: Joi.string().uri().default('http://localhost:3000'),
        MONGO_URI: Joi.string().default('mongodb://localhost:27017'),
        MONGO_DB: Joi.string().default('urlshortener'),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        JWT_SECRET_KEY: Joi.string().required(),
      }),
    }),
    // ShortenerModule,
    AuthModule,
    SlugsModule,
    CheckSlugModule,
    RedirectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
