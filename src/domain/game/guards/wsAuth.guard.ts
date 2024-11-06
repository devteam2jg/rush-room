import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtWsAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const cookies = client.handshake.headers.cookie;

    let token: string | undefined;
    if (cookies) {
      console.log(cookies);
      token = cookies['accessToken'];
      console.log(token);
    }
    if (!token) {
      return false;
    }
    context.switchToWs().getData().token = token;

    return super.canActivate(context) as Promise<boolean>;
  }
  getRequest(context: ExecutionContext) {
    return context.switchToWs().getData();
  }
}
