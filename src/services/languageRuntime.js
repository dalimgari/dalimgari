const BUILTIN_PAIRS = {
  'হোম':'Home','তথ্য':'Information','গ্রামের তথ্য':'Village Information','পোস্ট':'Posts','অ্যালবাম':'Albums','খুঁজুন':'Search','লগইন':'Login','নতুন একাউন্ট':'Create Account','প্রোফাইল':'Profile','ড্যাশবোর্ড':'Dashboard','হোমপেজ ব্যবস্থাপনা':'Homepage Management','সাইডবার ব্যবস্থাপনা':'Sidebar Management','পেজ ব্যবস্থাপনা':'Page Management','পোস্ট ব্যবস্থাপনা':'Post Management','অ্যালবাম ব্যবস্থাপনা':'Album Management','মিডিয়া ব্যবস্থাপনা':'Media Management','ব্যবহারকারী ব্যবস্থাপনা':'User Management','অ্যাক্সেস ব্যবস্থাপনা':'Access Management','অডিট লগ':'Audit Log','অ্যানালিটিক্স':'Analytics','ওয়েবসাইট তথ্য':'Website Information','অ্যাডমিন তথ্য':'Admin Information','গ্রামীণ ভিজ্যুয়াল ব্যবস্থাপনা':'Rural Visual Management','বন্ধ':'Close','উঠান':'Menu','খোঁজ':'Search','বাড়ি':'Home','লগআউট':'Logout','বাংলা':'Bengali','ইংরেজি':'English','English':'English','বাংলা':'Bengali','রাতের আবহ':'Night','দিনের আলো':'Day','সেভ':'Save','সংরক্ষণ':'Save','এডিট':'Edit','সম্পাদনা':'Edit','ডিলেট':'Delete','মুছুন':'Delete','যোগ করুন':'Add','অপসারণ':'Remove','শেয়ার':'Share','ডাউনলোড':'Download','আপলোড':'Upload','রিফ্রেশ':'Refresh','লোড হচ্ছে':'Loading','বিস্তারিত পড়ুন':'Read more','বিস্তারিত':'Details','পরিচিতি':'Introduction','আরও জানা যাক':'Learn More','ছবি ও ভিডিও':'Photos & Videos','বিষয়সমূহ':'Topics','প্রকৃতি':'Nature','গ্রামবাসী':'Villagers','মানুষ':'People','সমাজ':'Society','ইতিহাস':'History','ঐতিহ্য':'Heritage','সংস্কৃতি':'Culture','নোটিশ':'Notice','ইভেন্ট':'Events','সদস্য':'Members','যোগাযোগ':'Contact','সেটিংস':'Settings','বিজ্ঞপ্তি':'Notifications','বার্তা':'Messages','মন্তব্য':'Comments','ছবি':'Photos','ভিডিও':'Videos','ডকুমেন্ট':'Documents','সাহায্য':'Help','সম্পর্কে':'About','ভাষা':'Language','দিন':'Day','রাত':'Night','ব্যবহারকারী':'User','অ্যাডমিন':'Admin','মূল জায়গায় যান':'Skip to main content','সব':'All','হ্যাঁ':'Yes','না':'No','বাতিল':'Cancel','নিশ্চিত করুন':'Confirm','পিছনে':'Back','পরবর্তী':'Next','আগের':'Previous','খুঁজুন...':'Search...','সফল':'Success','ত্রুটি':'Error','সতর্কতা':'Warning','তথ্য পাওয়া যায়নি':'No information found'
}

const reversePairs = Object.fromEntries(Object.entries(BUILTIN_PAIRS).map(([bn,en]) => [en,bn]))

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function buildMaps(labels = {}) {
  const bnToEn = { ...BUILTIN_PAIRS }
  const enToBn = { ...reversePairs }
  Object.entries(labels || {}).forEach(([key, value]) => {
    const en = normalize(value?.eng)
    const bn = normalize(value?.bng)
    if (en && bn) {
      bnToEn[bn] = en
      enToBn[en] = bn
    }
  })
  return { bnToEn, enToBn }
}

function translateExact(value, map) {
  const text = normalize(value)
  return text && map[text] ? map[text] : null
}

function translateNode(node, map) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement
    if (!parent || ['SCRIPT','STYLE','NOSCRIPT','PRE','CODE','TEXTAREA'].includes(parent.tagName) || parent.isContentEditable || parent.closest('[data-no-translate],.user-content')) return
    const translated = translateExact(node.nodeValue, map)
    if (translated && translated !== normalize(node.nodeValue)) node.nodeValue = translated
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return
  if (['SCRIPT','STYLE','NOSCRIPT','PRE','CODE','TEXTAREA'].includes(node.tagName) || node.isContentEditable || node.matches('[data-no-translate],.user-content')) return

  for (const attribute of ['aria-label','title','placeholder','alt']) {
    const value = node.getAttribute(attribute)
    const translated = translateExact(value, map)
    if (translated) node.setAttribute(attribute, translated)
  }
  node.childNodes.forEach((child) => translateNode(child, map))
}

export function applyLanguageToDocument(language, labels = {}) {
  if (typeof document === 'undefined') return
  const maps = buildMaps(labels)
  const map = language === 'eng' ? maps.bnToEn : maps.enToBn
  document.documentElement.lang = language === 'eng' ? 'en' : 'bn'
  translateNode(document.body, map)
}

export function observeLanguageDocument(language, labels = {}) {
  if (typeof document === 'undefined') return () => {}
  let scheduled = false
  const run = () => {
    scheduled = false
    applyLanguageToDocument(language, labels)
  }
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(run)
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label','title','placeholder','alt'] })
  run()
  return () => observer.disconnect()
}
