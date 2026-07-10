import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client (service-role key). Never import from island code —
 * the env vars are deliberately not PUBLIC_* so they cannot reach the bundle.
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see specs/002-pain-bank/quickstart.md)');
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
