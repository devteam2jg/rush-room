import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtWsAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const token =
      client.handshake.query.token || client.handshake.headers['authorization'];
    if (!token) {
      return false;
    }

    context.switchToWs().getData().token = token;

    return super.canActivate(context) as Promise<boolean>;
  }
}
