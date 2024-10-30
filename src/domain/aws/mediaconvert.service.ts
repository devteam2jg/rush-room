import { Injectable, Inject } from '@nestjs/common';
import { MediaConvertClient } from '@aws-sdk/client-mediaconvert';

@Injectable()
export class MediaConvertService {
  constructor(
    @Inject('MediaConvertClient')
    private readonly mediaConvertClient: MediaConvertClient,
  ) {}
}
