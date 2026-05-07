# Adding a New API Endpoint

This is the step-by-step playbook for adding a new endpoint following the backend-first workflow.

Example task: **Add `GET /api/users/:id` — fetch a user by ID (admin only)**

---

## Step 1 — Define the DTO

Create `apps/api-gateway/src/modules/users/dto/user.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'usr_01' })
  id!: string;

  @ApiProperty({ example: 'admin@mono.dev' })
  email!: string;

  @ApiProperty({ example: 'Admin User' })
  name!: string;

  @ApiProperty({ example: ['admin', 'user'], type: [String] })
  roles!: string[];

  @ApiProperty({ example: ['read', 'write', 'admin'], type: [String] })
  permissions!: string[];
}
```

Write the DTO class first. This is the **contract** — everything else is built to honour it.

---

## Step 2 — Stub the controller with Swagger

Create `apps/api-gateway/src/modules/users/users.controller.ts`:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiNotFoundResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Fetches a user profile by their unique ID. Requires the `admin` role.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
}
```

At this point you can start the server — the route will appear in Swagger at `/api/docs` even before the service exists (it will throw 500 if called, but the contract is visible to reviewers).

---

## Step 3 — Add a role guard (if needed)

For admin-only routes, create a `@Roles('admin')` decorator:

```typescript
// apps/api-gateway/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

Then add a `RolesGuard` that reads the user from `request.user` and checks `user.roles`:

```typescript
// apps/api-gateway/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required) return true;
    const { user } = ctx.switchToHttp().getRequest<{ user: User }>();
    return required.some(role => user.roles.includes(role));
  }
}
```

Register it globally in `app.module.ts`:
```typescript
{ provide: APP_GUARD, useClass: RolesGuard }
```

Apply to the route:
```typescript
@Roles('admin')
@Get(':id')
```

---

## Step 4 — Implement the service

Create `apps/api-gateway/src/modules/users/users.service.ts`:

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from './repositories/user.repository.interface';
import type { UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async findById(id: string): Promise<UserResponseDto> {
    const record = await this.userRepo.findById(id);
    if (!record) throw new NotFoundException(`User ${id} not found`);
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      roles: record.roles as string[],
      permissions: record.permissions as string[],
    };
  }
}
```

The service never imports Drizzle. It talks to `IUserRepository` — the same interface already implemented by `DrizzleUserRepository` in the auth module.

---

## Step 5 — Wire the module

Create `apps/api-gateway/src/modules/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from './repositories/user.repository.interface';
import { DrizzleUserRepository } from '../auth/repositories/drizzle-user.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
  ],
})
export class UsersModule {}
```

Import it in `app.module.ts`:
```typescript
imports: [DatabaseModule, AuthModule, UsersModule, HealthModule],
```

---

## Step 6 — Update the API reference doc

Add a new section to `docs/08-api-reference.md`:

```markdown
#### `GET /api/users/:id`
**Protected, Admin only** — Requires `admin` role.

Returns a user by their unique ID.
...
```

---

## Step 7 — Add to the frontend

Export the type from `@mono/shared/types` if the frontend needs it:

```typescript
// libs/shared/types/src/index.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}
```

Then call from the frontend:

```typescript
import type { UserProfile } from '@mono/shared/types';

const res = await fetch(`/api/users/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { data } = await res.json() as ApiResponse<UserProfile>;
```

---

## Checklist

- [ ] DTO class with `@ApiProperty` on every field
- [ ] Controller stubbed with `@ApiOperation`, `@ApiOkResponse`, `@ApiUnauthorizedResponse`
- [ ] Route reviewed in Swagger UI before service is implemented
- [ ] Service injects `IUserRepository` (never Drizzle directly)
- [ ] Error cases throw NestJS `HttpException` subclasses (`NotFoundException`, `ForbiddenException`, etc.)
- [ ] `docs/08-api-reference.md` updated
- [ ] Shared types exported from `@mono/shared/types` if frontend needs them
- [ ] Integration tested against real API (no mocked HTTP)
