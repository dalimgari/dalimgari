import { supabase } from '../../service/supabase/supabase_client'

export async function record_visit() {
  try {
    const visitor_key = sessionStorage.getItem('visitor_key') || crypto.randomUUID()
    sessionStorage.setItem('visitor_key', visitor_key)

    await supabase.from('analytics_visits').insert({
      visitor_key,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser_name: navigator.userAgent,
      operating_system: navigator.platform,
      language_code: navigator.language,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      user_agent: navigator.userAgent
    })
  } catch {
    return false
  }
  return true
}
