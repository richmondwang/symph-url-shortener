import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/register (POST) should register user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeDefined();
  });

  it('/api/login (POST) should login user', async () => {
    await request(app.getHttpServer())
      .post('/api/register')
      .send({ username: 'testuser2', password: 'testpass2' });
    const res = await request(app.getHttpServer())
      .post('/api/login')
      .send({ username: 'testuser2', password: 'testpass2' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });
});
