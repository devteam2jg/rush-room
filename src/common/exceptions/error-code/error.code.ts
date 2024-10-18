class ErrorCodeVo {
  readonly statusCode: number;
  readonly message: string;

  constructor(statusCode: number, message: string) {
    this.statusCode = statusCode;
    this.message = message;
  }
}

export type ErrorCode = ErrorCodeVo;

/* Error Instances */
export const ENTITY_NOT_FOUND = new ErrorCodeVo(404, 'Entity Not Found');
