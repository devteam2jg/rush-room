import {
  ENTITY_NOT_FOUND,
  ErrorCode,
} from '~/src/common/exceptions/error-code';

export class ServiceException extends Error {
  readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message?: string) {
    if (!message) message = errorCode.message;
    super(message);
    this.errorCode = errorCode;
  }
}

export const EntityNotFoundException = (message?: string): ServiceException => {
  return new ServiceException(ENTITY_NOT_FOUND, message);
};