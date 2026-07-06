import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ialmdeggizzddhkcqsfl.supabase.co'
const supabaseAnonKey = 'sb_publishable_qWVUFWRCPF4g7NeusbKyyg_bQlJLQr9'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
