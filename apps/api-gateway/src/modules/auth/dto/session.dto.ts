import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
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

export class SessionDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;

  @ApiProperty({ example: 'tok_abc123xyz', description: 'Bearer token — include in Authorization header for all subsequent requests' })
  token!: string;
}

export class LogoutDto {
  @ApiProperty({ example: true })
  ok!: true;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  data!: T;

  @ApiProperty({ example: 'OK' })
  message!: string;
}

export class HealthDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 1234.56, description: 'Process uptime in seconds' })
  uptime!: number;

  @ApiProperty({ example: '2026-05-06T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '0.0.0' })
  version!: string;
}
