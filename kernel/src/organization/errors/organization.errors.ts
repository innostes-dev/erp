import { NotFoundException, ConflictException } from '../../shared/index.js';

export class OrganizationNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Organization '${identifier}' was not found.`, { identifier });
  }
}

export class OrganizationAlreadyExistsException extends ConflictException {
  constructor(slug: string) {
    super(`Organization with slug '${slug}' already exists.`, { slug });
  }
}
