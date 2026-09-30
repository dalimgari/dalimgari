import { query_table } from '../data/query_service'
export async function global_search(table, term, columns = [], limit = 20) { if (!term || !term.trim()) return []; const rows = await query_table(table, { limit }); const query = term.toLowerCase(); return rows.filter(row => columns.some(column => String(row[column] || '').toLowerCase().includes(query))) }
