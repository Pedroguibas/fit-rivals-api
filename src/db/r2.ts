import { S3Client } from '@aws-sdk/client-s3';
import checkEnvVaribale from '../helpers/check-env-variables.js';

export const createR2Client = async () => {
  return new S3Client({
    region: 'auto',
    endpoint: checkEnvVaribale('CLOUDFLARE_R2_URL'),
    credentials: {
      accessKeyId: checkEnvVaribale('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: checkEnvVaribale('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
    },
  });
};
