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
});
