import { NotFoundException, ConflictException } from '../../shared/index.js';

export class FeatureModuleNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Feature module '${identifier}' was not found.`, { identifier });
  }
}

export class FeatureModuleAlreadyExistsException extends ConflictException {
  constructor(id: string) {
    super(`Feature module with ID '${id}' already exists.`, { id });
  }
}
