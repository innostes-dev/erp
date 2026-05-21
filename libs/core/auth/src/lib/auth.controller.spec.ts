import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let mockRes: any;
  let mockReq: any;

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue({ user: { id: '1' }, accessToken: 'at', refreshToken: 'rt' }),
      login: jest.fn().mockResolvedValue({ user: { id: '1' }, accessToken: 'at', refreshToken: 'rt' }),
      forgotPassword: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue({ resetToken: 'reset-token' }),
      resetPassword: jest.fn().mockResolvedValue(undefined),
    };

    mockRes = {
      setCookie: jest.fn(),
    };

    mockReq = {
      headers: { 'user-agent': 'jest-test' },
      ip: '127.0.0.1',
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should call authService and return success', async () => {
      const result = await controller.forgotPassword({ email: 'test@test.com', tenantId: 't1' }, mockReq as any);
      expect(authService.forgotPassword).toHaveBeenCalledWith({ email: 'test@test.com', tenantId: 't1' }, '127.0.0.1');
      expect(result.success).toBe(true);
    });
  });

  describe('login', () => {
    it('should set secure cookies and return user', async () => {
      mockReq.headers['x-tenant-id'] = 't1';
      const result = await controller.login(
        { email: 'test@test.com', password: 'password' },
        't1',
        mockReq as any,
        mockRes as any
      );
      expect(authService.login).toHaveBeenCalled();
      expect(mockRes.setCookie).toHaveBeenCalledWith('__Host-at', 'at', expect.any(Object));
      expect(mockRes.setCookie).toHaveBeenCalledWith('__Secure-rt', 'rt', expect.any(Object));
      expect(result.success).toBe(true);
    });
  });
});
