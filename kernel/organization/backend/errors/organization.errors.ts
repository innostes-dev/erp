import { NotFoundException, ConflictException } from '@innostes/core';

export class OrganizationNotFoundError extends NotFoundException {
  constructor(identifier: string) {
    super(`Organization '${identifier}' was not found.`);
  }
}

export class OrganizationSlugConflictError extends ConflictException {
  constructor(slug: string) {
    super(`Organization slug '${slug}' is already in use.`);
  }
}
