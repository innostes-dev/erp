import { UnauthorizedException, BadRequestException } from '@innostes/core';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsException';
  }
}

export class UserInactiveException extends UnauthorizedException {
  constructor(message = 'User account is inactive or disabled') {
    super(message);
    this.name = 'UserInactiveException';
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor(message = 'Invalid or expired token') {
    super(message);
    this.name = 'InvalidTokenException';
  }
}
