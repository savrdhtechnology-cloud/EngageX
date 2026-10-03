import { createClient } from '@supabase/supabase-js';
import config from './supabase-config.json';

// EngageX uses its dedicated Supabase project as the canonical runtime target.
// Keeping the runtime target in this checked configuration prevents stale
// deployment environment variables from reconnecting the app to the old shared DB.
const supabaseUrl = config.url?.trim();
const supabasePublishableKey = config.publishableKey?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('EngageX Supabase configuration is missing.');
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storageKey: 'engagex-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export const workspaceSlug = config.workspaceSlug;
