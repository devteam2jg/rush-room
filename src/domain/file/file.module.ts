import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { AwsModule } from '~/src/domain/aws/aws.module';
import { awsProviders } from '~/src/domain/aws/aws.provider';

@Module({
  imports: [AwsModule],
  providers: [FileService, ...awsProviders],
  exports: [FileService, ...awsProviders],
})
export class FileModule {}
