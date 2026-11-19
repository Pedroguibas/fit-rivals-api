import { Inject, Injectable } from '@nestjs/common';
import { R2_CLIENT } from '../r2/r2.provider.js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetSignedUrlResponse } from './dto/response/getSignedUrlResponse.dto.js';
import { randomUUID } from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(R2_CLIENT) private readonly r2: S3Client,
    private readonly config: ConfigService,
  ) {}

  async getSignedRoute(contentType: string): Promise<GetSignedUrlResponse> {
    const key = `images/${randomUUID()}`;
    const url = await getSignedUrl(
      this.r2,
      new PutObjectCommand({
        Bucket: this.config.get('CLOUDFLARE_R2_BUCKET'),
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 },
    );
    return { key, url };
  }
}
