export function home_page(state, language) {
  const information = get_information_map(state.information)
  const village_name = get_information_value(information, 'village_name', language)
  const village_description = get_information_value(information, 'village_description', language)
  const address_parts = ['union', 'upazila', 'district', 'post_office', 'postal_code'].map((key) => get_information_value(information, key, language)).filter(Boolean)
  const contact_phone = get_information_value(information, 'contact_phone', language)
  const contact_whatsapp = get_information_value(information, 'contact_whatsapp', language)
  const contact_email = get_information_value(information, 'contact_email', language)

  return createElement('main', { id: 'public-home', className: 'website-body' },
    village_description && createElement('section', { id: 'public-village_description', className: 'home-welcome website-section' },
      createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'পরিচিতি' : 'Introduction'),
      createElement('h2', null, language === 'bn' ? 'আমাদের গ্রাম' : 'Our village'),
      createElement('p', { className: 'website-lead-text' }, village_description)
    ),
    state.pages.some((page) => page.page_slug) && createElement('section', { id: 'public-pages', className: 'home-navigation website-section' },
      createElement('div', { className: 'website-section-heading' },
        createElement('div', null,
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'জানুন' : 'Explore'),
          createElement('h2', null, language === 'bn' ? 'গ্রাম সম্পর্কে আরও জানুন' : 'Explore more')
        )
      ),
      createElement(page_navigation, { pages: state.pages.filter((page) => page.page_slug), language })
    ),
    state.posts.length > 0 && createElement('section', { id: 'public-posts', className: 'home-posts website-section' },
      createElement('div', { className: 'website-section-heading' },
        createElement('div', null,
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'সর্বশেষ' : 'Latest'),
          createElement('h2', null, language === 'bn' ? 'সর্বশেষ খবর ও পোস্ট' : 'Latest news and posts')
        )
      ),
      createElement(post_list, { posts: state.posts, language })
    ),
    address_parts.length > 0 && createElement('section', { id: 'public-contact', className: 'home-contact website-section' },
      createElement('div', { className: 'website-section-heading' },
        createElement('div', null,
          createElement('div', { className: 'website-eyebrow' }, language === 'bn' ? 'যোগাযোগ' : 'Contact'),
          createElement('h2', null, language === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact information')
        )
      ),
      createElement('p', { className: 'contact-address' }, [village_name, ...address_parts].filter(Boolean).join(' • ')),
      createElement('div', { className: 'contact-actions' },
        contact_phone && createElement('a', { className: 'website-contact-action primary', href: `tel:${contact_phone}`, 'aria-label': 'Call', title: 'Call' }, get_information_contact_icon('phone', createElement)),
        contact_whatsapp && createElement('a', { className: 'website-contact-action whatsapp', href: `https://wa.me/${String(contact_whatsapp).replace(/[^0-9+]/g, '').replace(/^\+/, '')}`, target: '_blank', rel: 'noreferrer', 'aria-label': 'WhatsApp', title: 'WhatsApp' }, get_information_contact_icon('whatsapp', createElement)),
        contact_email && createElement('a', { className: 'website-contact-action email', href: `mailto:${contact_email}`, 'aria-label': 'Email', title: 'Email' }, get_information_contact_icon('email', createElement))
      )
    )
  )
}

