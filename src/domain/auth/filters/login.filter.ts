import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  InternalServerErrorException,
} from '@nestjs/common';

@Catch()
export class LoginFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // 예외 처리 로직
    if (exception instanceof InternalServerErrorException) {
      response.status(500).json({
        statusCode: 500,
        message: '서버 내부 오류',
        error: exception.message,
      });
    } else {
      response.status(400).json({
        statusCode: 400,
        message: '잘못된 요청',
        error: exception.message,
      });
    }
  }
}
