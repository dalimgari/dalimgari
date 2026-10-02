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
