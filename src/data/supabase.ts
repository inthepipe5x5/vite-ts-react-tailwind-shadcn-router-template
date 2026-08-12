import { createClient } from '@supabase/supabase-js';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import { supabaseEnv } from "@/config";
const { url, key } = supabaseEnv;
const supabaseConfig = {
    url,
    key,
    options: {
        db: {
            schema: "pets",
            timeout: 10000, // 10 seconds
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            debug: (import.meta.env.NODE_ENV === 'development'),
        },
        storage: {
            bucket: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET, //TODO: double check this is the correct bucket name and env variable
        }
    } as SupabaseClientOptions<"pets">,
};
const supabase = createClient(supabaseConfig.url, supabaseConfig.key, supabaseConfig.options);
export default supabase;
