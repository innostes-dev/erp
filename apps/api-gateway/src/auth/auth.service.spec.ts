import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.mock('@innostes/core/database', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  },
  users: { id: 'users.id', email: 'users.email', tenantId: 'users.tenant_id', password: 'users.password', roleId: 'users.role_id' },
  tenants: { id: 'tenants.id' },
  branches: { id: 'branches.id', tenantId: 'branches.tenant_id' },
  roles: { id: 'roles.id', isSystem: 'roles.is_system', tenantId: 'roles.tenant_id', name: 'roles.name', permissions: 'roles.permissions' },
  sessions: {
    id: 'sessions.id',
    userId: 'sessions.user_id',
    tenantId: 'sessions.tenant_id',
    tokenHash: 'sessions.token_hash',
    expiresAt: 'sessions.expires_at',
    revokedAt: 'sessions.revoked_at',
    family: 'sessions.family',
    lastUsedAt: 'sessions.last_used_at'
  },
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mockToken'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mockSecret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
