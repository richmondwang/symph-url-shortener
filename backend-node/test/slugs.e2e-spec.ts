import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Slugs API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    await request(app.getHttpServer())
      .post('/api/register')
      .send({ username: 'sluguser', password: 'slugpass' });
    const res = await request(app.getHttpServer())
      .post('/api/login')
      .send({ username: 'sluguser', password: 'slugpass' });
    token = res.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/shorten (POST) should create a short url', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'http://test.com', slug: 'slugtest123' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('slugtest123');
    expect(res.body.shortLink).toContain('slugtest123');
  });

  it('/api/slugs (GET) should list user slugs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/slugs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.slugs)).toBe(true);
  });
});
