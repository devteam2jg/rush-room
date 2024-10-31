import { MediaConvertClient } from '@aws-sdk/client-mediaconvert';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import {
  AwsConfigDto,
  AwsFileConfigDto,
  AwsMediaConvertConfigDto,
  AwsUserConfigDto,
} from '~/src/domain/aws/dto/aws.dto';
import { validateEnv } from '~/src/utils/validate-env';
import { plainToClass } from 'class-transformer';

export const awsConfigProvider = {
  imports: [ConfigModule],
  provide: 'AWS_CONFIG',
  useFactory: async (configService: ConfigService): Promise<AwsConfigDto> => {
    const awsConfig: AwsConfigDto = {
      user: plainToClass(AwsUserConfigDto, {
        accountId: configService.get<string>('AWS_ACCOUNT_ID'),
        region: configService.get<string>('AWS_REGION'),
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      }),
      file: plainToClass(AwsFileConfigDto, {
        bucket: configService.get<string>('AWS_FILE_BUCKET_NAME'),
      }),
      mediaConvert: plainToClass(AwsMediaConvertConfigDto, {
        bucket: configService.get<string>('AWS_MEDIACONVERT_BUCKET_NAME'),
        endpoint: configService.get<string>('AWS_MEDIACONVERT_ENDPOINT'),
        destination: configService.get<string>(
          'AWS_MEDIACONVERT_S3_DESTINATION',
        ),
        sourcePrefix: configService.get<string>(
          'AWS_MEDIACONVERT_S3_SOURCE_PREFIX',
        ),
      }),
    };
    validateEnv(
      awsConfig.user,
      AwsUserConfigDto,
      'AWS User configurations are missing',
    );
    validateEnv(
      awsConfig.file,
      AwsFileConfigDto,
      'AWS File configurations are missing',
    );
    validateEnv(
      awsConfig.mediaConvert,
      AwsMediaConvertConfigDto,
      'AWS MediaConvert configurations are missing',
    );
    validateEnv(
      awsConfig,
      AwsConfigDto,
      '이 에러를 만난다면 백엔드에게 연락하십시오',
    );

    return awsConfig;
  },
  inject: [ConfigService],
};

export const s3ClientProvider = {
  provide: 'S3Client',
  useFactory: (awsConfig: AwsConfigDto): S3Client => {
    return new S3Client({
      region: awsConfig.user.region,
      credentials: {
        accessKeyId: awsConfig.user.accessKeyId,
        secretAccessKey: awsConfig.user.secretAccessKey,
      },
    });
  },
  inject: ['AWS_CONFIG'],
};
export const mediaConvertClientProvider = {
  provide: 'MediaConvertClient',
  useFactory: (awsConfig: AwsConfigDto): MediaConvertClient => {
    const client = new MediaConvertClient({
      region: awsConfig.user.region,
      endpoint: awsConfig.mediaConvert.endpoint,
      credentials: {
        accessKeyId: awsConfig.user.accessKeyId,
        secretAccessKey: awsConfig.user.secretAccessKey,
      },
    });
    return client;
  },
  inject: ['AWS_CONFIG'],
};

export const awsProviders = [
  awsConfigProvider,
  s3ClientProvider,
  mediaConvertClientProvider,
];
