import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Redirect API (e2e)', () => {
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
      .send({ username: 'rediruser', password: 'redirpass' });
    const res = await request(app.getHttpServer())
      .post('/api/login')
      .send({ username: 'rediruser', password: 'redirpass' });
    token = res.body.token;
    await request(app.getHttpServer())
      .post('/api/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'http://redirect.com', slug: 'redirslug123' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/:slug (GET) should redirect to destination', async () => {
    const res = await request(app.getHttpServer()).get('/redirslug123');
    expect([301, 302]).toContain(res.status);
    expect(res.headers.location).toBe('http://redirect.com');
  });
});
