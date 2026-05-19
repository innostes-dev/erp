import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '@innostes/core/database';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');
jest.mock('../utils/crypto.util', () => ({
  encryptEmail: jest.fn((e) => `encrypted_${e}`),
  hashEmail: jest.fn((e) => `hashed_${e}`),
  decryptEmail: jest.fn((e) => e.replace('encrypted_', '')),
}));

describe('AuthService', () => {
  let service: AuthService;
  let dbService: any;
  let jwtService: any;

  beforeEach(async () => {
    dbService = {
      db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnValue([{ id: 'test-user-id', tenantId: 'tenant-1' }]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({ sub: 'test-user-id', purpose: 'RESET_PASSWORD' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: dbService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw INVALID_CREDENTIALS if user not found', async () => {
      dbService.db.limit.mockReturnValueOnce([]);
      
      await expect(
        service.login({ email: 'test@test.com', password: 'password', tenantId: 't1' }, 't1', { deviceName: 'Mac', deviceType: 'desktop' }, '127.0.0.1')
      ).rejects.toThrow(UnauthorizedException);
      
      expect(dbService.db.insert).toHaveBeenCalled(); // logs failure
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        id: 'user1',
        password: 'hashed-password',
        failedLoginCount: 4,
        lockedUntil: null,
      };
      dbService.db.limit.mockReturnValueOnce([mockUser]);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong-password', tenantId: 't1' }, 't1', { deviceName: 'Mac', deviceType: 'desktop' }, '127.0.0.1')
      ).rejects.toThrow(UnauthorizedException);

      expect(dbService.db.update).toHaveBeenCalled();
      const updateSet = dbService.db.set.mock.calls[0][0];
      expect(updateSet.failedLoginCount).toBe(5);
      expect(updateSet.lockedUntil).toBeDefined();
    });
  });

  describe('forgotPassword', () => {
    it('should generate OTP and save to DB', async () => {
      dbService.db.limit.mockReturnValueOnce([{ id: 'user1', tenantId: 't1' }]);
      await service.forgotPassword({ email: 'test@test.com', tenantId: 't1' }, '127.0.0.1');
      expect(dbService.db.insert).toHaveBeenCalled();
      const insertValues = dbService.db.values.mock.calls[0][0];
      expect(insertValues.purpose).toBe('FORGOT_PASSWORD');
    });
  });
});
