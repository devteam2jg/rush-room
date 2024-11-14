import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { AwsModule } from '~/src/domain/aws/aws.module';
import { awsProviders } from '~/src/domain/aws/aws.provider';
import { FileController } from '~/src/domain/file/file.controller';

@Module({
  imports: [AwsModule],
  providers: [FileService, ...awsProviders],
  controllers: [FileController],
  exports: [FileService, ...awsProviders, AwsModule],
})
export class FileModule {}
