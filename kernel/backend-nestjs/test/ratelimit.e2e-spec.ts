import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createApp, resetE2eDatabase } from './e2e-helpers';

describe('rate limiting (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    process.env.RATE_LIMIT_LOGIN_PER_MINUTE = '3';
    process.env.RATE_LIMIT_FORGOT_PASSWORD_PER_MINUTE = '2';
    await resetE2eDatabase();
    app = await createApp();
  });
  afterAll(async () => {
    await app?.close();
    delete process.env.RATE_LIMIT_LOGIN_PER_MINUTE;
    delete process.env.RATE_LIMIT_FORGOT_PASSWORD_PER_MINUTE;
  });

  it('throttles login per client with 429, Retry-After and the standard error body', async () => {
    const send = () => request(app.getHttpServer()).post('/auth/login').send({ email: 'a@b.co', password: 'x' });
    for (let i = 0; i < 3; i++) expect((await send()).status).not.toBe(429);
    const r = await send();
    expect(r.status).toBe(429);
    expect(r.body).toEqual({ detail: 'Too many requests. Try again later.', code: 'rate_limited' });
    expect(Number(r.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('applies independent limits per route', async () => {
    const send = () => request(app.getHttpServer()).post('/auth/forgot-password').send({ email: 'a@b.co' });
    await send();
    await send();
    expect((await send()).status).toBe(429);
    expect((await request(app.getHttpServer()).get('/health')).status).toBe(200); // health is never throttled
  });
});
