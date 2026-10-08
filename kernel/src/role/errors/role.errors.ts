import { NotFoundException, ConflictException } from '../../shared/index.js';

export class RoleNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Role matching '${identifier}' was not found.`, { identifier });
  }
}

export class RoleAlreadyExistsException extends ConflictException {
  constructor(name: string) {
    super(`Role with name '${name}' already exists.`, { name });
  }
}
