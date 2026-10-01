const EXACT_RULES = {
  title: 'text',
  name: 'text',
  display_name: 'text',
  role_name: 'text',
  permission_name: 'text',
  caption: 'textarea',
  description: 'textarea',
  bio: 'textarea',
  html_content: 'rich_text',
  email: 'email',
  phone: 'phone',
  url: 'url',
  canonical_url: 'url',
  media_url: 'media',
  icon_url: 'image',
  profile_image_url: 'image',
  page_slug: 'slug',
  seo_slug: 'slug',
  display_order: 'number',
  file_size: 'number',
  screen_width: 'number',
  screen_height: 'number',
  is_active: 'switch',
  is_visible: 'switch',
  is_system_role: 'switch',
  is_super_admin: 'switch',
  status: 'select',
  account_type: 'select',
  media_method: 'select',
  source_language: 'select',
  robots_directive: 'select',
  backup_type: 'select',
  supported_languages: 'multi_select',
  social_links: 'json',
  other_links: 'json',
  seo_data: 'json',
  setting_value: 'json',
  action_data: 'json',
  backup_metadata: 'json'
}

const SYSTEM_EXACT = new Set([
  'created_at',
  'updated_at',
  'assigned_at',
  'published_at',
  'visited_at',
  'retention_expires_at'
])

const SYSTEM_PATTERNS = [
  /^(created|updated|assigned|actor|created_by|updated_by|assigned_by|retention)_/i,
  /_id$/i
]

const IMAGE_PATTERNS = [
  /(^|_)(image|avatar|logo|icon|thumbnail|cover)(_|$)/i
]

const FILE_PATTERNS = [
  /(^|_)(file|document|attachment)(_|$)/i,
  /storage_path$/i
]

const URL_PATTERNS = [
  /(^|_)(url|website|link)(_|$)/i
]

const DATE_PATTERNS = [
  /(^|_)(date|time|at)$/i
]

const NUMBER_PATTERNS = [
  /(^|_)(order|count|size|width|height|limit|offset|priority|position)$/i
]

const BOOLEAN_PATTERNS = [
  /^is_/i,
  /^has_/i,
  /^can_/i,
  /^should_/i
]

const KEY_PATTERNS = [
  /(^|_)key$/i
]

const TEXTAREA_PATTERNS = [
  /(^|_)(description|details|summary|notes|message|content|bio)$/i
]

function normalize_name(name) {
  return String(name ?? '').trim().replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

function normalize_type(type) {
  return String(type ?? '').toLowerCase().replace(/^pg_/i, '')
}

function enum_method(field_name, enum_values) {
  if (!Array.isArray(enum_values) || enum_values.length === 0) return null
  const name = normalize_name(field_name)
  if (name === 'supported_languages') return 'multi_select'
  return 'select'
}

function is_system_field(name) {
  return SYSTEM_EXACT.has(name) || SYSTEM_PATTERNS.some((pattern) => pattern.test(name))
}

function pattern_method(name) {
  if (SYSTEM_EXACT.has(name)) return 'system'
  if (is_system_field(name)) return 'system'
  if (IMAGE_PATTERNS.some((pattern) => pattern.test(name))) return 'image'
  if (FILE_PATTERNS.some((pattern) => pattern.test(name))) return 'file'
  if (URL_PATTERNS.some((pattern) => pattern.test(name))) return 'url'
  if (BOOLEAN_PATTERNS.some((pattern) => pattern.test(name))) return 'switch'
  if (KEY_PATTERNS.some((pattern) => pattern.test(name))) return 'text'
  if (DATE_PATTERNS.some((pattern) => pattern.test(name))) return 'datetime'
  if (NUMBER_PATTERNS.some((pattern) => pattern.test(name))) return 'number'
  if (TEXTAREA_PATTERNS.some((pattern) => pattern.test(name))) return 'textarea'
  return null
}

function db_type_method(db_type) {
  const type = normalize_type(db_type)
  if (['boolean', 'bool'].includes(type)) return 'switch'
  if (['smallint', 'integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision'].includes(type)) return 'number'
  if (['date'].includes(type)) return 'date'
  if (['timestamp', 'timestamptz', 'timestamp with time zone', 'timestamp without time zone', 'time'].includes(type)) return 'datetime'
  if (['json', 'jsonb'].includes(type)) return 'json'
  if (['uuid'].includes(type)) return 'text'
  return 'text'
}

export function resolve_global_input_method({
  field_name,
  db_type,
  enum_values = [],
  relation = false,
  override,
  input_method,
  system = false
} = {}) {
  const name = normalize_name(field_name)

  if (override || input_method) {
    return {
      method: override ?? input_method,
      source: 'explicit'
    }
  }

  if (system || is_system_field(name)) {
    return {
      method: 'system',
      source: 'system'
    }
  }

  const enum_resolved = enum_method(name, enum_values)
  if (enum_resolved) {
    return {
      method: enum_resolved,
      source: 'enum'
    }
  }

  if (relation) {
    return {
      method: 'relation',
      source: 'relation'
    }
  }

  if (EXACT_RULES[name]) {
    return {
      method: EXACT_RULES[name],
      source: 'exact'
    }
  }

  const pattern_resolved = pattern_method(name)
  if (pattern_resolved) {
    return {
      method: pattern_resolved,
      source: 'pattern'
    }
  }

  return {
    method: db_type_method(db_type),
    source: 'db_type'
  }
}

export function global_input_selector(field = {}) {
  return resolve_global_input_method(field).method
}

export const GLOBAL_INPUT_METHODS = Object.freeze([
  'text',
  'textarea',
  'rich_text',
  'email',
  'phone',
  'url',
  'slug',
  'image',
  'file',
  'number',
  'date',
  'datetime',
  'switch',
  'select',
  'multi_select',
  'relation',
  'json',
  'system'
])
