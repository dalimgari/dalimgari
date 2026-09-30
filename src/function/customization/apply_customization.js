export function apply_customization(settings = []) {
  const values = Object.fromEntries(settings.map((item) => [item.setting_key, item.setting_value]))
  const root = document.documentElement

  if (values.primary_color) root.style.setProperty('--color-primary', values.primary_color)
  if (values.secondary_color) root.style.setProperty('--color-secondary', values.secondary_color)
  if (values.background_color) root.style.setProperty('--color-background', values.background_color)
  if (values.surface_color) root.style.setProperty('--color-surface', values.surface_color)
  if (values.text_color) root.style.setProperty('--color-text', values.text_color)
  if (values.border_color) root.style.setProperty('--color-border', values.border_color)
  if (values.font_family) root.style.setProperty('--font-family', values.font_family)
}
