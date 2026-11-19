import { Provider } from '@nestjs/common';
import { createR2Client } from '../../db/r2.js';

export const R2_CLIENT = 'R2_CLIENT';

export const R2Provider: Provider = {
  provide: R2_CLIENT,
  useFactory: async () => {
    return await createR2Client();
  },
};
