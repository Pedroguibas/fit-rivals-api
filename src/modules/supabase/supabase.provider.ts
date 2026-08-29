import { Provider } from '@nestjs/common';
import { createSupabaseClient } from '../../db/supabase.js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const SupabaseProvider: Provider = {
  provide: SUPABASE_CLIENT,
  useFactory: () => {
    return createSupabaseClient();
  },
};
