import { createElement } from 'react'

const block = (class_name) => createElement('div', { className: `website-skeleton-block ${class_name}` })

const style = `
.website-skeleton{min-height:100vh;padding:16px;box-sizing:border-box;background:#f8fafc;color:#64748b;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.website-skeleton-header{max-width:1180px;margin:0 auto 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px;border-radius:16px;background:#fff;border:1px solid #e2e8f0}
.website-skeleton-logo{width:150px;height:28px;border-radius:8px}.website-skeleton-nav{display:flex;gap:10px}.website-skeleton-nav-item{width:70px;height:18px;border-radius:6px}
.website-skeleton-hero{max-width:1180px;margin:0 auto 18px;min-height:210px;padding:32px;box-sizing:border-box;border-radius:20px;background:#fff;border:1px solid #e2e8f0;display:flex;flex-direction:column;justify-content:center;gap:14px}
.website-skeleton-title{width:min(55%,420px);height:42px;border-radius:10px}.website-skeleton-line{width:min(80%,620px);height:16px;border-radius:6px}.website-skeleton-line.short{width:min(55%,400px)}
.website-skeleton-section{max-width:1180px;margin:0 auto 18px;padding:22px;border-radius:16px;background:#fff;border:1px solid #e2e8f0}.website-skeleton-heading{width:190px;height:24px;border-radius:7px;margin-bottom:18px}.website-skeleton-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.website-skeleton-card{height:130px;border-radius:12px}.website-skeleton-wide{height:18px;border-radius:7px;margin:12px 0}.website-skeleton-footer{max-width:1180px;margin:0 auto;padding:22px;border-radius:16px;background:#fff;border:1px solid #e2e8f0}.website-skeleton-footer-line{width:220px;height:16px;border-radius:6px}.website-skeleton-block{background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:website-skeleton-shimmer 1.2s ease-in-out infinite}.website-skeleton-status{max-width:1180px;margin:12px auto 0;text-align:center;font-size:13px}
@keyframes website-skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@media(max-width:700px){.website-skeleton{padding:10px}.website-skeleton-header{padding:12px}.website-skeleton-nav{display:none}.website-skeleton-hero{min-height:180px;padding:22px}.website-skeleton-grid{grid-template-columns:1fr}.website-skeleton-card{height:100px}.website-skeleton-section{padding:16px}}
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
    createElement('div', { className: 'website-skeleton-status' }, 'Loading website…')
  )
}
