import { Module } from '@nestjs/common';

import { awsProviders } from '~/src/domain/aws/aws.provider';
import { MediaConvertService } from '~/src/domain/aws/mediaconvert.service';

@Module({
  providers: [MediaConvertService, ...awsProviders],
  exports: [MediaConvertService],
})
export class AwsModule {}
