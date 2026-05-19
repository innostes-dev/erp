import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthModule } from '../src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({ JWT_SECRET: 'test-secret-at-least-64-characters-long-so-the-app-doesn-t-exit-at-startup' })]
        }),
        AuthModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/health (GET)', () => {
    return app
      .inject({
        method: 'GET',
        url: '/auth/health',
      })
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toHaveProperty('status', 'ok');
      });
  });
  it('/auth/forgot-password (POST) - should fail with 400 on empty body', () => {
    return app
      .inject({
        method: 'POST',
        url: '/auth/forgot-password',
        payload: {}
      })
      .then((response) => {
        expect(response.statusCode).toBe(400);
      });
  });

  it('/auth/forgot-password (POST) - should fail with 400 on invalid email', () => {
    return app
      .inject({
        method: 'POST',
        url: '/auth/forgot-password',
        payload: { email: 'not-an-email', tenantId: 't1' }
      })
      .then((response) => {
        expect(response.statusCode).toBe(400);
      });
  });

  it('/auth/verify-otp (POST) - should fail with 400 on missing otp', () => {
    return app
      .inject({
        method: 'POST',
        url: '/auth/verify-otp',
        payload: { email: 'test@test.com', tenantId: 't1' }
      })
      .then((response) => {
        expect(response.statusCode).toBe(400);
      });
  });
});
