import { validateSync, ValidationError } from 'class-validator';

import { plainToClass } from 'class-transformer';
import { MissingConfigurationsException } from '~/src/common/exceptions/service.exception';

export function validateEnv<T extends object>(
  config: T,
  classType: new () => T,
  errorMessages: string,
): void {
  const object = plainToClass(classType, config);
  const errors: ValidationError[] = validateSync(object);
  if (errors.length > 0) {
    throw MissingConfigurationsException(errorMessages);
  }
}
