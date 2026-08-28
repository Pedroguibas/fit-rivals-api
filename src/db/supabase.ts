import { createClient, SupabaseClient } from '@supabase/supabase-js';
import checkEnvVaribale from '../helpers/check-env-variables.js';

export const createSupabaseClient = (): SupabaseClient => {
  const url = checkEnvVaribale('PUBLIC_SUPABASE_URL');
  const key = checkEnvVaribale('PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  return createClient(url, key);
};
