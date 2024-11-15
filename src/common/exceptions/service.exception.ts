import {
  ENTITY_NOT_FOUND,
  ErrorCode,
  FORBIDDEN_BEHAVIOR,
  TOO_EARLY_EVENT_TIME,
  MISSING_CONFIGURATIONS,
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

export const ForbiddenBehaviorException = (
  message?: string,
): ServiceException => {
  return new ServiceException(FORBIDDEN_BEHAVIOR, message);
};

export const TooEarlyEventTimeException = (
  message?: string,
): ServiceException => {
  return new ServiceException(TOO_EARLY_EVENT_TIME, message);
};
export const MissingConfigurationsException = (
  message?: string,
): ServiceException => {
  return new ServiceException(MISSING_CONFIGURATIONS, message);
};
