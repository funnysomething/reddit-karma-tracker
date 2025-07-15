import { createClient } from '@supabase/supabase-js'
import { env, validateEnvVars } from './env'

// Validate environment variables on import
validateEnvVars()

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)