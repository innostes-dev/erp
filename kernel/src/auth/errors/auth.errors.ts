import { UnauthorizedException, NotFoundException, ConflictException } from '../../shared/index.js';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message = 'Invalid email or password credentials.') {
    super(message, { code: 'INVALID_CREDENTIALS' });
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`User '${identifier}' was not found.`, { identifier });
  }
}

export class UserAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`User account with email '${email}' already exists.`, { email });
  }
}
