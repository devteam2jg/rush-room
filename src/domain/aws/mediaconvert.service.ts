import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  MediaConvertClient,
  CreateJobCommand,
  CreateJobCommandInput,
  CreateJobCommandOutput,
} from '@aws-sdk/client-mediaconvert';
import { AwsConfigDto } from '~/src/domain/aws/dto/aws.dto';

@Injectable()
export class MediaConvertService {
  private readonly destinationUrl: string;
  constructor(
    @Inject('MediaConvertClient')
    private readonly mediaConvertClient: MediaConvertClient,
    @Inject('AWS_CONFIG')
    private readonly awsConfig: AwsConfigDto,
  ) {
    this.destinationUrl = this.awsConfig.mediaConvert.destination;
  }
  async makeHlsFileByS3Key(s3Key: string): Promise<CreateJobCommandOutput> {
    const sourceUrl = `s3://${this.awsConfig.file.bucket}/${s3Key}`;
    return await this.makeHlsFile(sourceUrl);
  }
  async makeHlsFile(sourceUrl: string): Promise<CreateJobCommandOutput> {
    //TODO: 유효한 URL인지 확인하는 로직 추가
    const params = this.makeJob(sourceUrl);
    try {
      const command = new CreateJobCommand(params);
      const response = await this.mediaConvertClient.send(command);
      return response;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `Failed to create MediaConvert job: ${error.message}`,
      );
    }
  }
  private makeJob(sourceUrl: string) {
    const params: CreateJobCommandInput = {
      JobTemplate:
        'arn:aws:mediaconvert:ap-northeast-2:637423448308:jobTemplates/rushroom stream',
      Queue: 'arn:aws:mediaconvert:ap-northeast-2:637423448308:queues/Default',
      UserMetadata: {},
      Role: 'arn:aws:iam::637423448308:role/service-role/MediaConvert_mp4_to_hls_Role',
      Settings: {
        TimecodeConfig: {
          Source: 'ZEROBASED',
        },
        OutputGroups: [
          {
            CustomName: 'rushroom',
            Name: 'Apple HLS',
            Outputs: [
              {
                ContainerSettings: {
                  Container: 'M3U8',
                  M3u8Settings: {},
                },
                VideoDescription: {
                  Width: 720,
                  Height: 480,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      MaxBitrate: 1500000,
                      RateControlMode: 'QVBR',
                      SceneChangeDetect: 'TRANSITION_DETECTION',
                    },
                  },
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 48000,
                      },
                    },
                  },
                ],
                OutputSettings: {
                  HlsSettings: {},
                },
                NameModifier: 'hd',
              },
              {
                ContainerSettings: {
                  Container: 'M3U8',
                  M3u8Settings: {},
                },
                VideoDescription: {
                  Width: 1280,
                  Height: 720,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      MaxBitrate: 4000000,
                      RateControlMode: 'QVBR',
                      SceneChangeDetect: 'TRANSITION_DETECTION',
                    },
                  },
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 48000,
                      },
                    },
                  },
                ],
                OutputSettings: {
                  HlsSettings: {},
                },
                NameModifier: 'sd',
              },
              {
                ContainerSettings: {
                  Container: 'M3U8',
                  M3u8Settings: {},
                },
                VideoDescription: {
                  Width: 1920,
                  Height: 1080,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      MaxBitrate: 8000000,
                      RateControlMode: 'QVBR',
                      SceneChangeDetect: 'TRANSITION_DETECTION',
                    },
                  },
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 96000,
                        CodingMode: 'CODING_MODE_2_0',
                        SampleRate: 48000,
                      },
                    },
                  },
                ],
                OutputSettings: {
                  HlsSettings: {},
                },
                NameModifier: 'fhd',
              },
            ],
            OutputGroupSettings: {
              Type: 'HLS_GROUP_SETTINGS',
              HlsGroupSettings: {
                SegmentLength: 10,
                Destination: this.destinationUrl,
                DestinationSettings: {
                  S3Settings: {
                    StorageClass: 'STANDARD',
                  },
                },
                MinSegmentLength: 0,
              },
            },
          },
        ],
        FollowSource: 1,
        Inputs: [
          {
            AudioSelectors: {
              'Audio Selector 1': {
                DefaultSelection: 'DEFAULT',
              },
            },
            VideoSelector: {},
            TimecodeSource: 'ZEROBASED',
            FileInput: sourceUrl,
          },
        ],
      },
      BillingTagsSource: 'JOB',
      AccelerationSettings: {
        Mode: 'DISABLED',
      },
      StatusUpdateInterval: 'SECONDS_60',
      Priority: 0,
      HopDestinations: [],
    };
    return params;
  }
}
