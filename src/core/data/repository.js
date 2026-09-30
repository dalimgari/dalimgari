import { supabase } from '../../service/supabase/supabase_client'
export function repository(table) { return { select: (columns = '*') => supabase.from(table).select(columns), insert: row => supabase.from(table).insert(row), update: (patch, field, value) => supabase.from(table).update(patch).eq(field, value), remove: (field, value) => supabase.from(table).delete().eq(field, value) } }
