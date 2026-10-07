const KEY="dalimgari:language";
const translations={
en:{
"nav.community":"Community","nav.signin":"Sign in","nav.create":"Create account","nav.signout":"Sign out","nav.profile":"Profile",
"home.eyebrow":"Dalimgari community","home.title":"Welcome to Dalimgari","home.lead":"A simple place for community news, events, updates, and shared media.","home.action":"Explore community",
"home.today":"Today","home.language":"Language","home.location":"Community location","home.albums":"Community albums","home.albumsTitle":"Memories from our community","home.quick.title":"What do you need?",
"home.community.title":"Community","home.community.body":"See local posts and updates from the community.","home.community.action":"View community",
"home.info.title":"Important information","home.info.body":"Find announcements, upcoming events, and shared community media.","home.info.action":"Discover more",
"home.quick.community":"Community","home.quick.events":"Events","home.quick.profile":"My profile",
"community.title":"Community","community.subtitle":"Share updates, discover members, join events, and explore community media.",
"community.feed":"Feed","community.members":"Members","community.events":"Events","community.gallery":"Gallery","community.preferences":"Preferences",
"community.share":"Share with the community","community.publish":"Publish","community.noMedia":"No media selected",
"community.appearance":"Appearance","community.language":"Interface language","community.theme":"Theme preset","community.mode":"Mode",
"community.communityFeed":"Community feed","community.refresh":"Refresh","community.announcements":"Announcements","community.upcoming":"Upcoming events",
"community.adminSettings":"Community settings","community.communityName":"Community name","community.country":"Country","community.region":"Region",
"community.timezone":"Timezone","community.latitude":"Latitude","community.longitude":"Longitude","community.saveSettings":"Save community settings",
"community.saved":"Community settings saved.","community.settingsHelp":"These settings control the public location and local time used across the site.","community.addMedia":"Add photo/video","community.visible":"Visible to community members","community.newEvent":"New event","community.createAlbum":"Create album","community.uploadMedia":"Upload media","community.album":"Album","community.noAlbum":"No album","community.photosVideos":"Photos and videos","community.day":"Day","community.night":"Night"
},
bn:{
"nav.community":"কমিউনিটি","nav.signin":"সাইন ইন","nav.create":"অ্যাকাউন্ট তৈরি","nav.signout":"সাইন আউট","nav.profile":"প্রোফাইল",
"home.eyebrow":"ডালিমগাড়ি কমিউনিটি","home.title":"ডালিমগাড়িতে স্বাগতম","home.lead":"কমিউনিটির খবর, অনুষ্ঠান, আপডেট ও ছবি-ভিডিও এক জায়গায়।","home.action":"কমিউনিটি দেখুন",
"home.today":"আজ","home.language":"ভাষা","home.location":"কমিউনিটির অবস্থান","home.albums":"কমিউনিটির অ্যালবাম","home.albumsTitle":"আমাদের কমিউনিটির স্মৃতি","home.quick.title":"আপনি কী করতে চান?",
"home.community.title":"কমিউনিটি","home.community.body":"কমিউনিটির পোস্ট ও নতুন খবর দেখুন।","home.community.action":"কমিউনিটি দেখুন",
"home.info.title":"গুরুত্বপূর্ণ তথ্য","home.info.body":"ঘোষণা, আসন্ন অনুষ্ঠান এবং কমিউনিটির ছবি-ভিডিও দেখুন।","home.info.action":"আরও দেখুন",
"home.quick.community":"কমিউনিটি","home.quick.events":"অনুষ্ঠান","home.quick.profile":"আমার প্রোফাইল",
"community.title":"কমিউনিটি","community.subtitle":"নতুন খবর শেয়ার করুন, সদস্যদের দেখুন এবং অনুষ্ঠান ও ছবি-ভিডিও দেখুন।",
"community.feed":"পোস্ট","community.members":"সদস্য","community.events":"অনুষ্ঠান","community.gallery":"গ্যালারি","community.preferences":"পছন্দ",
"community.share":"কমিউনিটির সঙ্গে শেয়ার করুন","community.publish":"প্রকাশ করুন","community.noMedia":"কোনো ছবি বা ভিডিও বাছাই করা হয়নি",
"community.appearance":"দেখানোর ধরন","community.language":"ইন্টারফেসের ভাষা","community.theme":"থিম প্রিসেট","community.mode":"মোড",
"community.communityFeed":"কমিউনিটি ফিড","community.refresh":"রিফ্রেশ","community.announcements":"ঘোষণা","community.upcoming":"আসন্ন অনুষ্ঠান",
"community.adminSettings":"কমিউনিটি সেটিংস","community.communityName":"কমিউনিটির নাম","community.country":"দেশ","community.region":"অঞ্চল",
"community.timezone":"টাইমজোন","community.latitude":"অক্ষাংশ","community.longitude":"দ্রাঘিমাংশ","community.saveSettings":"কমিউনিটি সেটিংস সংরক্ষণ",
"community.saved":"কমিউনিটি সেটিংস সংরক্ষণ হয়েছে।","community.settingsHelp":"এই সেটিংস পুরো সাইটের কমিউনিটির অবস্থান ও স্থানীয় সময় নিয়ন্ত্রণ করে।","community.addMedia":"ছবি/ভিডিও যোগ করুন","community.visible":"কমিউনিটি সদস্যরা দেখতে পারবেন","community.newEvent":"নতুন অনুষ্ঠান","community.createAlbum":"অ্যালবাম তৈরি","community.uploadMedia":"মিডিয়া আপলোড","community.album":"অ্যালবাম","community.noAlbum":"কোনো অ্যালবাম নেই","community.photosVideos":"ছবি ও ভিডিও","community.day":"দিন","community.night":"রাত"
}};
function language(){const value=localStorage.getItem(KEY);return value==="bn"||value==="en"?value:"en"}
function translate(key){return translations[language()]?.[key]||translations.en[key]||key}
function apply(root=document){const lang=language();root.querySelectorAll("[data-i18n]").forEach(el=>{const value=translations[lang]?.[el.dataset.i18n]||translations.en?.[el.dataset.i18n];if(value)el.textContent=value});root.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{const value=translations[lang]?.[el.dataset.i18nPlaceholder]||translations.en?.[el.dataset.i18nPlaceholder];if(value)el.placeholder=value});root.querySelectorAll("[data-language-switch]").forEach(el=>{const active=el.dataset.languageSwitch===lang;el.classList.toggle("is-active",active);el.setAttribute("aria-pressed",String(active))});root.querySelectorAll("[data-i18n-aria-label]").forEach(el=>el.setAttribute("aria-label",translations[lang]?.[el.dataset.i18nAriaLabel]||el.getAttribute("aria-label")||""));document.documentElement.lang=lang==="bn"?"bn":"en"}
async function syncUserPreference(selected){const db=window.dalimgariSupabase;if(!db)return;try{const {data:{session}}=await db.auth.getSession();if(!session)return;const {data}=await db.from("user_preferences").select("language").eq("user_id",session.user.id).maybeSingle();if(!localStorage.getItem(KEY)&&data?.language){localStorage.setItem(KEY,data.language);apply(document);document.dispatchEvent(new CustomEvent("dalimgari:language-changed",{detail:{language:data.language}}));return}await db.from("user_preferences").upsert({user_id:session.user.id,language:selected,theme_mode:"system",theme_preset:"classic"})}catch(error){console.warn("Language preference sync failed",error)}}
export function initLanguage(root=document){const options=root.querySelectorAll("[data-language-switch]");if(!options.length)return;apply(root);const initial=language();syncUserPreference(initial);options.forEach(option=>option.addEventListener("click",async()=>{const next=option.dataset.languageSwitch;if(next!==language()){localStorage.setItem(KEY,next);apply(document);document.dispatchEvent(new CustomEvent("dalimgari:language-changed",{detail:{language:next}}));await syncUserPreference(next)}}))}
export{apply as applyLanguage,translate as t};