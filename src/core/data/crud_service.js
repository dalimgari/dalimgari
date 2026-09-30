import { supabase } from '../../service/supabase/supabase_client'
export async function create_record(table, data) { const { data: row, error } = await supabase.from(table).insert(data).select().single(); if (error) throw error; return row }
export async function read_records(table, query = '*') { const { data, error } = await supabase.from(table).select(query); if (error) throw error; return data || [] }
export async function update_record(table, id_field, id, data) { const { data: row, error } = await supabase.from(table).update(data).eq(id_field, id).select().single(); if (error) throw error; return row }
export async function delete_record(table, id_field, id) { const { error } = await supabase.from(table).delete().eq(id_field, id); if (error) throw error; return true }
