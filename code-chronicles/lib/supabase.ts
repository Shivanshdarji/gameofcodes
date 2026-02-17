
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper to provide a valid client or a dummy one to prevent crashes if env is missing
const createSupabaseClient = () => {
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined') {
        console.warn("Supabase credentials missing! Check .env.local");
        // Return a dummy object or a valid client with empty strings (which throws on request, not init)
        // Better to return real client but warn.
    }
    return createClient(supabaseUrl || '', supabaseAnonKey || '')
}

export const supabase = createSupabaseClient()
