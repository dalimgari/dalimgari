import { createElement, useEffect, useState } from 'react'
import { create_database_backup, list_database_backups, restore_database_backup } from '../../controller/admin/backup_controller'

export function backup_recovery_panel() {
  const [backups, set_backups] = useState([])
  const [message, set_message] = useState('')

  async function load_backups() {
    set_backups(await list_database_backups())
  }

  useEffect(() => { load_backups() }, [])

  async function create_backup() {
    await create_database_backup()
    set_message('Backup created')
    await load_backups()
  }

  async function restore_backup(backup_id) {
    await restore_database_backup(backup_id)
    set_message('Backup restored')
  }

  return createElement('section', { className: 'backup-recovery-panel' },
    createElement('h3', null, 'Database Backup & Recovery'),
    createElement('button', { type: 'button', onClick: create_backup }, 'Create Backup'),
    createElement('span', null, message),
    backups.map((backup) => createElement('article', { key: backup.backup_record_id },
      createElement('strong', null, backup.backup_key),
      createElement('time', null, new Date(backup.created_at).toLocaleString()),
      createElement('button', { type: 'button', onClick: () => restore_backup(backup.backup_record_id) }, 'Restore')
    ))
  )
}
