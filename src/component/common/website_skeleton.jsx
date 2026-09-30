import { createElement } from 'react'

const block = (class_name) => createElement('div', { className: `website-skeleton-block ${class_name}`, 'aria-hidden': 'true' })

const style = `
.website-skeleton{min-height:100vh;padding:12px;box-sizing:border-box;background:#f8fafc;color:#64748b;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.website-skeleton-header{max-width:1180px;margin:0 auto 14px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border-radius:14px;background:#fff;border:1px solid #e2e8f0}
.website-skeleton-logo{width:140px;height:26px;border-radius:7px}.website-skeleton-nav{display:flex;gap:8px}.website-skeleton-nav-item{width:64px;height:16px;border-radius:6px}
.website-skeleton-hero{max-width:1180px;margin:0 auto 16px;min-height:190px;padding:28px;box-sizing:border-box;border-radius:18px;background:#fff;border:1px solid #e2e8f0;display:flex;flex-direction:column;justify-content:center;gap:12px}
.website-skeleton-title{width:min(52%,400px);height:36px;border-radius:9px}.website-skeleton-line{width:min(76%,600px);height:14px;border-radius:6px}.website-skeleton-line.short{width:min(48%,360px)}
.website-skeleton-section{max-width:1180px;margin:0 auto 16px;padding:20px;border-radius:14px;background:#fff;border:1px solid #e2e8f0}.website-skeleton-heading{width:170px;height:22px;border-radius:7px;margin-bottom:16px}.website-skeleton-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.website-skeleton-card{height:116px;border-radius:11px}.website-skeleton-wide{height:16px;border-radius:7px;margin:10px 0}.website-skeleton-footer{max-width:1180px;margin:0 auto;padding:20px;border-radius:14px;background:#fff;border:1px solid #e2e8f0}.website-skeleton-footer-line{width:200px;height:14px;border-radius:6px}.website-skeleton-block{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:website-skeleton-shimmer 1.2s ease-in-out infinite}.website-skeleton-status{max-width:1180px;margin:10px auto 0;text-align:center;font-size:13px}
@keyframes website-skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@media(max-width:700px){.website-skeleton{padding:8px}.website-skeleton-header{padding:11px 12px;border-radius:12px}.website-skeleton-nav{display:none}.website-skeleton-hero{min-height:160px;padding:20px;border-radius:15px}.website-skeleton-title{width:72%;height:30px}.website-skeleton-line,.website-skeleton-line.short{width:90%}.website-skeleton-grid{grid-template-columns:1fr}.website-skeleton-card{height:88px}.website-skeleton-section{padding:15px;border-radius:12px}}
@media(prefers-reduced-motion:reduce){.website-skeleton-block{animation:none}}
`

export function website_skeleton() {
  return createElement(
    'main',
    { className: 'website-skeleton', 'aria-label': 'Loading website' },
    createElement('style', null, style),
    createElement('div', { className: 'website-skeleton-header' },
      block('website-skeleton-logo'),
      createElement('div', { className: 'website-skeleton-nav' },
        block('website-skeleton-nav-item'),
        block('website-skeleton-nav-item'),
        block('website-skeleton-nav-item')
      )
    ),
    createElement('section', { className: 'website-skeleton-hero' },
      block('website-skeleton-title'),
      block('website-skeleton-line'),
      block('website-skeleton-line short')
    ),
    createElement('section', { className: 'website-skeleton-section' },
      block('website-skeleton-heading'),
      createElement('div', { className: 'website-skeleton-grid' },
        block('website-skeleton-card'),
        block('website-skeleton-card'),
        block('website-skeleton-card')
      )
    ),
    createElement('section', { className: 'website-skeleton-section' },
      block('website-skeleton-heading'),
      block('website-skeleton-wide'),
      block('website-skeleton-wide'),
      block('website-skeleton-wide')
    ),
    createElement('footer', { className: 'website-skeleton-footer' }, block('website-skeleton-footer-line')),
    createElement('div', { className: 'website-skeleton-status', role: 'status', 'aria-live': 'polite' }, 'লোড হচ্ছে…')
  )
}
