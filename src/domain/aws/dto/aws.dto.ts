import { IsNotEmpty, IsString } from 'class-validator';

export class AwsUserConfigDto {
  @IsNotEmpty()
  @IsString()
  accountId: string;
  @IsNotEmpty()
  @IsString()
  region: string;
  @IsNotEmpty()
  @IsString()
  accessKeyId: string;
  @IsNotEmpty()
  @IsString()
  secretAccessKey: string;
}

export class AwsFileConfigDto {
  @IsNotEmpty()
  @IsString()
  bucket: string;
}
export class AwsMediaConvertConfigDto {
  @IsNotEmpty()
  @IsString()
  bucket: string;
  @IsNotEmpty()
  @IsString()
  endpoint: string;
  @IsNotEmpty()
  @IsString()
  destination: string;
  @IsNotEmpty()
  @IsString()
  sourcePrefix: string;
}

export class AwsConfigDto {
  @IsNotEmpty()
  user: AwsUserConfigDto;
  @IsNotEmpty()
  file: AwsFileConfigDto;
  @IsNotEmpty()
  mediaConvert: AwsMediaConvertConfigDto;
}
