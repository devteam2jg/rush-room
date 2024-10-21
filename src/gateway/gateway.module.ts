import { Module } from '@nestjs/common';
import { AuctionGateway } from '~/src/gateway/gateway';

@Module({
  providers: [AuctionGateway],
})
export class GatewayModule {}
