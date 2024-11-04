import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetJwtPayload = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req =
      ctx.getType() === 'http'
        ? ctx.switchToHttp().getRequest()
        : ctx.switchToWs().getClient().handshake;
    return req.user;
  },
);
