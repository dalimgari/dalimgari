-- Centralized global UI key-label registry seed.
-- Additive and idempotent. Existing customized Bangla labels are preserved.

insert into public.global_ui_labels (key, eng, bng) values
('menu','Menu','উঠান'),('close','Close','বন্ধ'),('search','Search','খোঁজ'),('search_placeholder','Search Here','এখানে খুঁজুন'),
('search_loading','Searching…','খোঁজা হচ্ছে…'),('search_error','Search failed.','খোঁজার সময় সমস্যা হয়েছে।'),('search_no_results','No matches found.','কোনো মিল পাওয়া যায়নি।'),
('home','Home','হোম'),('information','Information','তথ্য'),('posts','Posts','পোস্ট'),('post','Post','পোস্ট'),('albums','Albums','অ্যালবাম'),('album','Album','অ্যালবাম'),
('gallery','Gallery','গ্যালারি'),('login','Login','লগইন'),('signup','Create Account','নতুন একাউন্ট'),('profile','Profile','প্রোফাইল'),('dashboard','Dashboard','ড্যাশবোর্ড'),
('logout','Logout','লগআউট'),('day','Day','দিনের আলো'),('night','Night','রাতের আবহ'),('save','Save','সংরক্ষণ'),('edit','Edit','সম্পাদনা'),('delete','Delete','মুছুন'),
('add','Add','যোগ করুন'),('remove','Remove','অপসারণ'),('share','Share','শেয়ার'),('download','Download','ডাউনলোড'),('upload','Upload','আপলোড'),('refresh','Refresh','রিফ্রেশ'),
('loading','Loading','লোড হচ্ছে'),('cancel','Cancel','বাতিল'),('confirm','Confirm','নিশ্চিত করুন'),('back','Back','পিছনে'),('next','Next','পরবর্তী'),('previous','Previous','আগের'),
('skip_to_main','Skip to main content','মূল জায়গায় যান'),('village_menu','Village menu','গ্রামের উঠান'),('village_navigation','Village navigation','গ্রামের নেভিগেশন'),
('close_village_menu','Close village menu','উঠান বন্ধ করুন'),('page','Page','পেজ'),('key_label_management','Key Label Management','লেবেল ব্যবস্থাপনা'),
('key_label_rename','Key Label Rename','লেবেল বদল'),('key_name','Key Name','Key নাম'),('english_label','English Label','ইংরেজি নাম'),('bangla_label','Bangla Label','বাংলা নাম'),
('homepage_management','Homepage Management','হোমপেজ ম্যানেজমেন্ট'),('sidebar_management','Sidebar Management','সাইডবার ম্যানেজমেন্ট'),('website_information','Website Information','ওয়েবসাইট তথ্য'),
('icon_management','Icon Management','আইকন ব্যবস্থাপনা'),('pages','Pages','পেজসমূহ'),('media','Media','মিডিয়া'),('database_storage','Database & Storage','ডাটাবেজ ও স্টোরেজ'),
('users','Users','ইউজার'),('access','Access','অ্যাক্সেস'),('audit','Audit Logs','অডিট'),('analytics','Analytics','পরিসংখ্যান'),('management_modules','Management modules','ম্যানেজমেন্ট মডিউল')
on conflict (key) do update set eng=excluded.eng,bng=coalesce(public.global_ui_labels.bng,excluded.bng),updated_at=now();
