import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ServiceException } from '~/src/common/exceptions/service.exception';
import { Request, Response } from 'express';

/* Exception filter for ServiceException */
@Catch(ServiceException)
export class ServiceExceptionToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: ServiceException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.errorCode.statusCode;

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
