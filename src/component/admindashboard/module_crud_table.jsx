import { createElement } from 'react'

export function module_crud_table({ columns = [], rows = [], on_edit = () => {}, on_delete = () => {} }) {
  return createElement('div', { className: 'admin-crud-table-wrap' },
    createElement('table', { className: 'admin-crud-table' },
      createElement('thead', null, createElement('tr', null, columns.map((column) => createElement('th', { key: column.key }, column.label)), createElement('th', null, 'Actions'))),
      createElement('tbody', null, rows.map((row) => createElement('tr', { key: row.id }, columns.map((column) => createElement('td', { key: column.key }, String(row[column.key] ?? ''))), createElement('td', null,
        createElement('button', { type: 'button', onClick: () => on_edit(row) }, 'Edit'),
        createElement('button', { type: 'button', onClick: () => on_delete(row) }, 'Delete')
      ))))
    )
  )
}
