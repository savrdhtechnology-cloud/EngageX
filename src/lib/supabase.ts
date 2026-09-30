import { createClient } from '@supabase/supabase-js';
import config from './supabase-config.json';

// Publishable/anon key only. All authorization is enforced by database RLS.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || config.url,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || config.publishableKey,
  { auth: { storageKey: 'engagex-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
export const workspaceSlug = config.workspaceSlug;
