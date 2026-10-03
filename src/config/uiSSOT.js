// Centralized UI Single Source of Truth (SSOT).
// All reusable UI terminology and labels should originate here.
// Database-backed global_ui_labels may override the globalLabels leaf values at runtime.

export const UI_SSOT = {
  globalLabels: {
    header: {
      menu: { bng: 'উঠান', eng: 'Menu' },
      close: { bng: 'বন্ধ', eng: 'Close' },
      search: { bng: 'খোঁজ', eng: 'Search' },
      searchPlaceholder: { bng: 'এখানে খুঁজুন', eng: 'Search Here' },
      login: { bng: 'লগইন', eng: 'Login' },
      dashboard: { bng: 'ড্যাশবোর্ড', eng: 'Dashboard' },
      logout: { bng: 'লগআউট', eng: 'Logout' },
      home: { bng: 'হোম', eng: 'Home' },
      page: { bng: 'পেজ', eng: 'Page' },
      post: { bng: 'পোস্ট', eng: 'Post' },
    },
    sidebar: {
      villageMenu: { bng: 'গ্রামের উঠান', eng: 'Village menu' },
      villageNavigation: { bng: 'গ্রামের নেভিগেশন', eng: 'Village navigation' },
      closeVillageMenu: { bng: 'উঠান বন্ধ করুন', eng: 'Close village menu' },
    },
    footer: {},
    buttons: {
      save: { bng: 'সংরক্ষণ', eng: 'Save' },
      edit: { bng: 'সম্পাদনা', eng: 'Edit' },
      delete: { bng: 'মুছুন', eng: 'Delete' },
      add: { bng: 'যোগ করুন', eng: 'Add' },
      remove: { bng: 'অপসারণ', eng: 'Remove' },
      share: { bng: 'শেয়ার', eng: 'Share' },
      download: { bng: 'ডাউনলোড', eng: 'Download' },
      upload: { bng: 'আপলোড', eng: 'Upload' },
      refresh: { bng: 'রিফ্রেশ', eng: 'Refresh' },
      cancel: { bng: 'বাতিল', eng: 'Cancel' },
      confirm: { bng: 'নিশ্চিত করুন', eng: 'Confirm' },
      back: { bng: 'পিছনে', eng: 'Back' },
      next: { bng: 'পরবর্তী', eng: 'Next' },
      previous: { bng: 'আগের', eng: 'Previous' },
      signup: { bng: 'নতুন একাউন্ট', eng: 'Create Account' },
    },
    commonActions: {
      loading: { bng: 'লোড হচ্ছে', eng: 'Loading' },
      day: { bng: 'দিনের আলো', eng: 'Day' },
      night: { bng: 'রাতের আবহ', eng: 'Night' },
      language: { bng: 'ভাষা', eng: 'Language' },
      bengali: { bng: 'বাংলা', eng: 'Bengali' },
      english: { bng: 'ইংরেজি', eng: 'English' },
      skipToMain: { bng: 'মূল জায়গায় যান', eng: 'Skip to main content' },
      theme: { bng: 'থিম', eng: 'Theme' },
    },
  },

  adminLabels: {
    dashboard: { bng: 'ড্যাশবোর্ড', eng: 'Dashboard' },
    homepage_management: { bng: 'হোমপেজ ম্যানেজমেন্ট', eng: 'Homepage Management' },
    sidebar_management: { bng: 'সাইডবার ম্যানেজমেন্ট', eng: 'Sidebar Management' },
    website_information: { bng: 'ওয়েবসাইট তথ্য', eng: 'Website Information' },
    key_label_rename: { bng: 'কী লেবেল', eng: 'Key Labels' },
    translation_overrides: { bng: 'অনুবাদ ব্যবস্থাপনা', eng: 'Translation Overrides' },
    icon_management: { bng: 'আইকন ব্যবস্থাপনা', eng: 'Icon Management' },
    pages: { bng: 'পেজসমূহ', eng: 'Pages' },
    posts: { bng: 'পোস্ট', eng: 'Posts' },
    albums: { bng: 'অ্যালবাম', eng: 'Albums' },
    media: { bng: 'মিডিয়া', eng: 'Media' },
    database_storage: { bng: 'ডাটাবেজ ও স্টোরেজ', eng: 'Database & Storage' },
    users: { bng: 'ইউজার', eng: 'Users' },
    access: { bng: 'অ্যাক্সেস', eng: 'Access' },
    audit: { bng: 'অডিট', eng: 'Audit Logs' },
    analytics: { bng: 'পরিসংখ্যান', eng: 'Analytics' },
    management_modules: { bng: 'ম্যানেজমেন্ট মডিউল', eng: 'Management modules' },
  },

  navigationLabels: {
    home: { bng: 'হোম', eng: 'Home' },
    information: { bng: 'তথ্য', eng: 'Information' },
    posts: { bng: 'পোস্ট', eng: 'Posts' },
    albums: { bng: 'অ্যালবাম', eng: 'Albums' },
    search: { bng: 'খুঁজুন', eng: 'Search' },
    login: { bng: 'লগইন', eng: 'Login' },
    profile: { bng: 'প্রোফাইল', eng: 'Profile' },
    dashboard: { bng: 'ড্যাশবোর্ড', eng: 'Dashboard' },
  },

  pageLabels: {
    gallery: {
      gallery: { bng: 'গ্যালারি', eng: 'Gallery' },
      albums: { bng: 'অ্যালবাম', eng: 'Albums' },
      album: { bng: 'অ্যালবাম', eng: 'Album' },
      photos: { bng: 'ছবি', eng: 'Photos' },
      videos: { bng: 'ভিডিও', eng: 'Videos' },
    },
    members: {
      members: { bng: 'সদস্য', eng: 'Members' },
    },
    notices: {
      notice: { bng: 'নোটিশ', eng: 'Notice' },
    },
    events: {
      events: { bng: 'ইভেন্ট', eng: 'Events' },
    },
  },

  systemMessages: {
    success: { bng: 'সফল', eng: 'Success' },
    error: { bng: 'ত্রুটি', eng: 'Error' },
    warning: { bng: 'সতর্কতা', eng: 'Warning' },
    emptyState: { bng: 'তথ্য পাওয়া যায়নি', eng: 'No information found' },
    confirmation: { bng: 'নিশ্চিত করুন', eng: 'Confirm' },
    searchLoading: { bng: 'খোঁজা হচ্ছে…', eng: 'Searching…' },
    searchError: { bng: 'খোঁজার সময় সমস্যা হয়েছে।', eng: 'Search failed.' },
    searchNoResults: { bng: 'কোনো মিল পাওয়া যায়নি।', eng: 'No matches found.' },
  },

  terminology: {
    canonicalTerms: {
      village: { bng: 'গ্রাম', eng: 'Village' },
      villageInformation: { bng: 'গ্রামের তথ্য', eng: 'Village Information' },
      page: { bng: 'পেজ', eng: 'Page' },
      posts: { bng: 'পোস্ট', eng: 'Posts' },
      albums: { bng: 'অ্যালবাম', eng: 'Albums' },
      media: { bng: 'মিডিয়া', eng: 'Media' },
      members: { bng: 'সদস্য', eng: 'Members' },
      notifications: { bng: 'বিজ্ঞপ্তি', eng: 'Notifications' },
      messages: { bng: 'বার্তা', eng: 'Messages' },
      comments: { bng: 'মন্তব্য', eng: 'Comments' },
      documents: { bng: 'ডকুমেন্ট', eng: 'Documents' },
      settings: { bng: 'সেটিংস', eng: 'Settings' },
      contact: { bng: 'যোগাযোগ', eng: 'Contact' },
      about: { bng: 'সম্পর্কে', eng: 'About' },
      admin: { bng: 'অ্যাডমিন', eng: 'Admin' },
      user: { bng: 'ব্যবহারকারী', eng: 'User' },
      homepageManagement: { bng: 'হোমপেজ ব্যবস্থাপনা', eng: 'Homepage Management' },
      sidebarManagement: { bng: 'সাইডবার ব্যবস্থাপনা', eng: 'Sidebar Management' },
      pageManagement: { bng: 'পেজ ব্যবস্থাপনা', eng: 'Page Management' },
      postManagement: { bng: 'পোস্ট ব্যবস্থাপনা', eng: 'Post Management' },
      albumManagement: { bng: 'অ্যালবাম ব্যবস্থাপনা', eng: 'Album Management' },
      mediaManagement: { bng: 'মিডিয়া ব্যবস্থাপনা', eng: 'Media Management' },
      userManagement: { bng: 'ব্যবহারকারী ব্যবস্থাপনা', eng: 'User Management' },
      accessManagement: { bng: 'অ্যাক্সেস ব্যবস্থাপনা', eng: 'Access Management' },
      auditLog: { bng: 'অডিট লগ', eng: 'Audit Log' },
      analytics: { bng: 'অ্যানালিটিক্স', eng: 'Analytics' },
      websiteInformation: { bng: 'ওয়েবসাইট তথ্য', eng: 'Website Information' },
      adminInformation: { bng: 'অ্যাডমিন তথ্য', eng: 'Admin Information' },
      ruralVisualManagement: { bng: 'গ্রামীণ ভিজ্যুয়াল ব্যবস্থাপনা', eng: 'Rural Visual Management' },
      details: { bng: 'বিস্তারিত', eng: 'Details' },
      readMore: { bng: 'বিস্তারিত পড়ুন', eng: 'Read more' },
      introduction: { bng: 'পরিচিতি', eng: 'Introduction' },
      learnMore: { bng: 'আরও জানা যাক', eng: 'Learn More' },
      photosAndVideos: { bng: 'ছবি ও ভিডিও', eng: 'Photos & Videos' },
      topics: { bng: 'বিষয়সমূহ', eng: 'Topics' },
      nature: { bng: 'প্রকৃতি', eng: 'Nature' },
      villagers: { bng: 'গ্রামবাসী', eng: 'Villagers' },
      people: { bng: 'মানুষ', eng: 'People' },
      society: { bng: 'সমাজ', eng: 'Society' },
      history: { bng: 'ইতিহাস', eng: 'History' },
      heritage: { bng: 'ঐতিহ্য', eng: 'Heritage' },
      culture: { bng: 'সংস্কৃতি', eng: 'Culture' },
      all: { bng: 'সব', eng: 'All' },
      yes: { bng: 'হ্যাঁ', eng: 'Yes' },
      no: { bng: 'না', eng: 'No' },
      searchEllipsis: { bng: 'খুঁজুন...', eng: 'Search...' },

    },
  },
}

export function flattenUiSsot(source = UI_SSOT) {
  const result = {}
  const walk = (node) => {
    Object.entries(node || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && ('bng' in value || 'eng' in value)) {
        result[key] = value
      } else if (value && typeof value === 'object') {
        walk(value)
      }
    })
  }
  walk(source)
  return result
}

export function getUiSsotPairs(source = UI_SSOT) {
  return Object.values(flattenUiSsot(source)).reduce((pairs, value) => {
    if (value?.bng && value?.eng) pairs[value.bng] = value.eng
    return pairs
  }, {})
}
