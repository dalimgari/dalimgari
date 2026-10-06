function clearElement(element){while(element.firstChild)element.removeChild(element.firstChild);}
function renderProfileElement(){
  const root=document.createElement("div");root.className="profile-page";
  const card=document.createElement("section");card.className="profile-card";
  const img=document.createElement("img");img.className="profile-photo";img.alt="Profile photo";
  const info=document.createElement("div");info.className="profile-info";
  const name=document.createElement("h2");const email=document.createElement("p");const role=document.createElement("p");const joined=document.createElement("p");
  info.append(name,email,role,joined);card.append(img,info);root.append(card);
  const photo=document.createElement("section");photo.className="profile-panel";photo.innerHTML="<h2>Profile Photo</h2>";
  const file=document.createElement("input");file.type="file";file.accept="image/*";
  const upload=document.createElement("button");upload.type="button";upload.dataset.size="small";upload.textContent="Upload Photo";
  const status=document.createElement("output");
  upload.onclick=()=>{const f=file.files?.[0];if(!f)return;if(f.size>1000000){status.textContent="Image must be 1 MB or smaller.";return;}const reader=new FileReader();reader.onload=async()=>{upload.disabled=true;const r=await window.Dalimgari.access.saveAvatar(reader.result);upload.disabled=false;if(r.error)status.textContent=r.error.message;else draw();};reader.readAsDataURL(f);};
  photo.append(file,upload,status);root.append(photo);
  const post=document.createElement("section");post.className="profile-panel";post.innerHTML="<h2>Create Post</h2>";
  const textarea=document.createElement("textarea");textarea.maxLength=5000;textarea.placeholder="Write a post...";
  const publish=document.createElement("button");publish.type="button";publish.dataset.size="large";publish.textContent="Post";const postStatus=document.createElement("output");
  publish.onclick=async()=>{publish.disabled=true;const r=await window.Dalimgari.access.createPost(textarea.value);publish.disabled=false;if(r.error)postStatus.textContent=r.error.message;else{textarea.value="";postStatus.textContent="Post published.";loadPosts();}};
  post.append(textarea,publish,postStatus);root.append(post);
  const posts=document.createElement("section");posts.className="profile-panel";posts.innerHTML="<h2>Posts</h2>";const list=document.createElement("div");list.className="profile-posts";posts.appendChild(list);root.append(posts);
  async function loadPosts(){const r=await window.Dalimgari.access.getPosts();list.replaceChildren();if(r.error){list.textContent=r.error.message;return;}for(const x of r.data||[]){const a=document.createElement("article");a.className="profile-post";const author=document.createElement("strong");author.textContent=x.profiles?.display_name||x.profiles?.email||"User";const text=document.createElement("p");text.textContent=x.content;a.append(author,text);list.appendChild(a);}}
  async function draw(){const r=await window.Dalimgari.access.profile();if(r.error){name.textContent=r.error.message;return;}name.textContent=r.data.display_name||"User";email.textContent=r.data.email||"";role.textContent=r.data.is_admin?"Admin":"Member";joined.textContent=r.data.created_at?"Joined "+new Date(r.data.created_at).toLocaleDateString():"";img.src=r.data.avatar_url||"";img.hidden=!r.data.avatar_url;loadPosts();}
  draw();return root;
}
function renderElement(d){const c=window.Dalimgari.components||{};if(d.type==="profile")return renderProfileElement();if(d.type==="input"&&c.input)return c.input(d);if(d.type==="button"&&c.button)return c.button(d);if(d.type==="output"&&c.output)return c.output(d);if(d.type==="heading"){const level=Math.min(6,Math.max(1,Number(d.level)||1));const e=document.createElement(`h${level}`);e.textContent=d.text||"";return e;}if(d.type==="actions"){const w=document.createElement("div");w.dataset.element="actions";for(const i of d.items||[]){const e=renderElement(i);if(e)w.appendChild(e);}return w;}return null;}
function adminDashboard(){const root=document.createElement("div");root.className="admin-dashboard";const a=window.Dalimgari.access;if(!a)return root;const section=t=>{const s=document.createElement("section");s.className="admin-panel";const h=document.createElement("h2");h.textContent=t;s.appendChild(h);return s;};const btn=(label,fn,refresh)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.dataset.size="small";b.onclick=async()=>{b.disabled=true;try{const r=await fn();if(r?.error){const n=document.createElement("output");n.textContent=r.error.message||"Action failed.";root.prepend(n);}else if(refresh)await draw();}finally{b.disabled=false;}};return b;};const select=(name,placeholder,options)=>{const s=document.createElement("select");s.name=name;const empty=document.createElement("option");empty.value="";empty.textContent=placeholder;s.appendChild(empty);for(const o of options){const option=document.createElement("option");option.value=o.id;option.textContent=o.label;s.appendChild(option);}return s;};async function draw(){clearElement(root);root.setAttribute("aria-busy","true");root.innerHTML='<div class="skeleton-page" aria-hidden="true"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div></div>';const result=await a.adminData();clearElement(root);root.removeAttribute("aria-busy");if(result.error){const message=document.createElement("output");message.textContent="Dashboard could not be loaded: "+(result.error.message||"Unknown error.");root.appendChild(message);return;}const d=result.data;
const members=section("Members");for(const m of d.members){const row=document.createElement("div");row.className="admin-row";row.textContent=(m.email||m.id)+" — "+(m.is_admin?"Admin":m.is_active?"Active":"Disabled");if(!m.is_admin)row.appendChild(btn(m.is_active?"Disable":"Enable",()=>a.adminSetMemberActive(m.id,!m.is_active),true));members.appendChild(row);}root.appendChild(members);
const roles=section("Roles");const rf=document.createElement("div");rf.className="admin-form";rf.innerHTML='<input placeholder="Role name" data-role><input placeholder="Description" data-role-desc>';rf.appendChild(btn("Create Role",()=>a.adminCreateRole(rf.querySelector("[data-role]").value,rf.querySelector("[data-role-desc]").value),true));roles.appendChild(rf);for(const r of d.roles){const row=document.createElement("div");row.className="admin-row";row.textContent=r.name+" — "+(r.description||"");if(r.name!=="Member"&&r.name!=="Admin")row.appendChild(btn("Delete",()=>a.adminDeleteRole(r.id),true));roles.appendChild(row);}root.appendChild(roles);
const perms=section("Permissions");const pf=document.createElement("div");pf.className="admin-form";pf.innerHTML='<input placeholder="permission.key" data-perm><input placeholder="Description" data-perm-desc>';pf.appendChild(btn("Create Permission",()=>a.adminCreatePermission(pf.querySelector("[data-perm]").value,pf.querySelector("[data-perm-desc]").value),true));perms.appendChild(pf);for(const p of d.permissions){const row=document.createElement("div");row.className="admin-row";row.textContent=p.key+" — "+(p.description||"");row.appendChild(btn("Delete",()=>a.adminDeletePermission(p.id),true));perms.appendChild(row);}root.appendChild(perms);
const access=section("Member Access");const af=document.createElement("div");af.className="admin-form";const userSelect=select("user_id","Select member",d.members.filter(m=>!m.is_admin).map(m=>({id:m.id,label:m.email||m.display_name||m.id})));const roleSelect=select("role_id","Select role",d.roles.map(r=>({id:r.id,label:r.name})));const permSelect=select("permission_id","Select permission",d.permissions.map(p=>({id:p.id,label:p.key})));af.append(userSelect,roleSelect,permSelect);af.appendChild(btn("Assign Role",()=>a.adminSetRole(userSelect.value,roleSelect.value,true),true));af.appendChild(btn("Revoke Role",()=>a.adminSetRole(userSelect.value,roleSelect.value,false),true));af.appendChild(btn("Grant Permission",()=>a.adminSetPermission(userSelect.value,permSelect.value,true),true));af.appendChild(btn("Deny Permission",()=>a.adminSetPermission(userSelect.value,permSelect.value,false),true));af.appendChild(btn("Remove Permission Override",()=>a.adminRemovePermission(userSelect.value,permSelect.value),true));access.appendChild(af);root.appendChild(access);
const roleAccess=section("Role Permissions");const rpForm=document.createElement("div");rpForm.className="admin-form";const rpRole=select("role_id","Select role",d.roles.map(r=>({id:r.id,label:r.name})));const rpPerm=select("permission_id","Select permission",d.permissions.map(p=>({id:p.id,label:p.key})));rpForm.append(rpRole,rpPerm);rpForm.appendChild(btn("Grant to Role",()=>a.adminSetRolePermission(rpRole.value,rpPerm.value,true),true));rpForm.appendChild(btn("Remove from Role",()=>a.adminSetRolePermission(rpRole.value,rpPerm.value,false),true));roleAccess.appendChild(rpForm);root.appendChild(roleAccess);
const posts=section("Posts");
const postSearch=document.createElement("input");postSearch.placeholder="Search posts";postSearch.type="search";
const postList=document.createElement("div");postList.className="admin-list";
function drawPosts(){
  postList.replaceChildren();
  const query=postSearch.value.trim().toLowerCase();
  const filtered=(d.posts||[]).filter(p=>!query||String(p.content||"").toLowerCase().includes(query)||String(p.profiles?.display_name||p.profiles?.email||"").toLowerCase().includes(query));
  for(const p of filtered){
    const row=document.createElement("div");row.className="admin-row";
    const meta=document.createElement("small");meta.textContent=(p.profiles?.display_name||p.profiles?.email||p.user_id)+" — "+new Date(p.created_at).toLocaleString();
    const editor=document.createElement("textarea");editor.value=p.content||"";editor.maxLength=5000;editor.placeholder="Post content";
    const save=btn("Save",()=>a.adminUpdatePost(p.id,editor.value,p.image_url),true);
    const del=btn("Delete",()=>a.adminDeletePost(p.id),true);
    row.appendChild(meta);row.appendChild(editor);row.append(save,del);postList.appendChild(row);
  }
  if(!filtered.length)postList.textContent="No posts found.";
}
postSearch.addEventListener("input",drawPosts);posts.append(postSearch,postList);drawPosts();root.appendChild(posts);

const customization=section("Customization");
const customizationForm=document.createElement("div");customizationForm.className="admin-form";
const customizationValue=document.createElement("textarea");customizationValue.placeholder='JSON customization, e.g. {"siteName":"Dalimgari","contentMaxWidth":"1200px"}';customizationValue.value=JSON.stringify(d.settings.find(x=>x.key==="customization")?.value||{},null,2);
const customizationSave=btn("Save Customization",async()=>{let value;try{value=JSON.parse(customizationValue.value);}catch{return {error:{message:"Customization must be valid JSON."}};}return a.adminSaveCustomization(value);},true);
customizationForm.append(customizationValue,customizationSave);customization.appendChild(customizationForm);root.appendChild(customization);

const theme=section("Theme");
const themeForm=document.createElement("div");themeForm.className="admin-form";
const themeValue=document.createElement("textarea");themeValue.placeholder='JSON theme variables, e.g. {"surface":"#000000","surfaceAlt":"#111111","text":"#ffffff","border":"#333333","radiusMd":"10px"}';themeValue.value=JSON.stringify(d.settings.find(x=>x.key==="theme")?.value||{},null,2);
const themeSave=btn("Save Theme",async()=>{let value;try{value=JSON.parse(themeValue.value);}catch{return {error:{message:"Theme must be valid JSON."}};}return a.adminSaveTheme(value);},true);
themeForm.append(themeValue,themeSave);theme.appendChild(themeForm);root.appendChild(theme);

const sidebarConfig=section("Sidebar Components");const sidebarSetting=d.settings.find(x=>x.key==="sidebar.components");const selectedIds=Array.isArray(sidebarSetting?.value)?sidebarSetting.value:(Array.isArray(sidebarSetting?.value?.components)?sidebarSetting.value.components:[]);const catalog=window.Dalimgari.layoutCatalog?.get?.()||[];const selected=catalog.filter(x=>selectedIds.includes(x.id));const available=catalog.filter(x=>!selectedIds.includes(x.id));const sf2=document.createElement("div");sf2.className="admin-form";const availableBox=document.createElement("div");for(const item of available){const label=document.createElement("label");const cb=document.createElement("input");cb.type="checkbox";cb.value=item.id;label.append(cb,document.createTextNode(" "+item.label));availableBox.appendChild(label);}const selectedBox=document.createElement("div");selectedBox.dataset.sidebarSelected="";function drawSelected(){selectedBox.replaceChildren();selected.forEach((item,index)=>{const row=document.createElement("div");row.className="admin-row";row.textContent=item.label+" ";if(index>0)row.appendChild(btn("Up",()=>{const tmp=selected[index-1];selected[index-1]=selected[index];selected[index]=tmp;drawSelected();},false));if(index<selected.length-1)row.appendChild(btn("Down",()=>{const tmp=selected[index+1];selected[index+1]=selected[index];selected[index]=tmp;drawSelected();},false));const remove=document.createElement("button");remove.type="button";remove.dataset.size="small";remove.textContent="Remove";remove.onclick=()=>{selected.splice(index,1);drawSelected();};row.appendChild(remove);selectedBox.appendChild(row);});}for(const item of available){const cb=availableBox.querySelector('input[value="'+item.id+'"]');cb.addEventListener("change",()=>{if(cb.checked){selected.push(item);cb.checked=false;drawSelected();}});}drawSelected();sf2.append(availableBox,selectedBox);sf2.appendChild(btn("Save Sidebar",async()=>{const result=await a.adminSaveSetting("sidebar.components",selected.map((item,index)=>({id:item.id,priority:(index+1)*10})),true);if(!result?.error)await window.Dalimgari.layout.loadConfiguration();return result;},true));sidebarConfig.appendChild(sf2);root.appendChild(sidebarConfig);

const basicInfo=section("Basic Information");
const basicForm=document.createElement("div");basicForm.className="admin-form";
const titleInput=document.createElement("input");titleInput.placeholder="Website name";titleInput.value=typeof d.settings.find(x=>x.key==="site.title")?.value==="string"?d.settings.find(x=>x.key==="site.title").value:"Dalimgai - ডালিমগাড়ী";
const descriptionInput=document.createElement("textarea");descriptionInput.placeholder="Website description";descriptionInput.value=typeof d.settings.find(x=>x.key==="site.description")?.value==="string"?d.settings.find(x=>x.key==="site.description").value:"";
const logoFile=document.createElement("input");logoFile.type="file";logoFile.accept="image/png,image/jpeg,image/webp,image/svg+xml";
const logoPreview=document.createElement("img");logoPreview.className="admin-logo-preview";logoPreview.alt="Current site logo";
const currentLogo=d.settings.find(x=>x.key==="site.logo")?.value;
if(typeof currentLogo==="string"&&currentLogo.startsWith("data:image/"))logoPreview.src=currentLogo;else logoPreview.hidden=true;
const basicStatus=document.createElement("output");
const saveInfo=btn("Save Basic Information",async()=>{
  const title=titleInput.value.trim();const description=descriptionInput.value.trim();
  if(!title)return {error:{message:"Website name is required."}};
  const titleResult=await a.adminSaveSetting("site.title",title,true);if(titleResult?.error)return titleResult;
  const descResult=await a.adminSaveSetting("site.description",description,true);if(descResult?.error)return descResult;
  const file=logoFile.files?.[0];
  if(file){
    if(file.size>500000)return {error:{message:"Logo image must be 500 KB or smaller."}};
    const reader=new FileReader();
    await new Promise(resolve=>{reader.onload=async()=>{const result=await a.adminSaveLogo(reader.result);if(result?.error)basicStatus.textContent=result.error.message;else{logoPreview.src=reader.result;logoPreview.hidden=false;basicStatus.textContent="Basic information updated.";await a.applyPublicBranding();}resolve();};reader.readAsDataURL(file);});
    return basicStatus.textContent==="Basic information updated."?{data:true}:{error:{message:basicStatus.textContent||"Unable to save logo."}};
  }
  await a.applyPublicBranding();basicStatus.textContent="Basic information updated.";return {data:true};
},false);
basicForm.append(titleInput,descriptionInput,logoFile,logoPreview,saveInfo,basicStatus);basicInfo.appendChild(basicForm);root.appendChild(basicInfo);

const content=section("Public Sections");const content=section("Public Sections");const cf=document.createElement("div");cf.className="admin-form";cf.innerHTML='<input placeholder="slug" data-slug><input placeholder="Title" data-title><textarea placeholder="Content" data-content></textarea><input placeholder="Sort order" type="number" data-sort>';cf.appendChild(btn("Save Section",()=>a.adminSaveSection({slug:cf.querySelector("[data-slug]").value,title:cf.querySelector("[data-title]").value,content:cf.querySelector("[data-content]").value,sort_order:Number(cf.querySelector("[data-sort]").value)||0,is_published:true}),true));content.appendChild(cf);for(const x of d.sections){const row=document.createElement("div");row.className="admin-row";row.textContent=x.title+" — "+x.slug;row.appendChild(btn("Delete",()=>a.adminDeleteSection(x.id),true));content.appendChild(row);}root.appendChild(content);
const panelOrderKey="dashboard.tabs";
const defaultTabOrder=["Members","Roles","Permissions","Member Access","Role Permissions","Posts","Customization","Theme","Sidebar Components","Basic Information","Public Sections"];
const savedTabOrder=d.settings.find(x=>x.key===panelOrderKey)?.value;
const configuredTabOrder=Array.isArray(savedTabOrder)?savedTabOrder.filter(x=>defaultTabOrder.includes(x)):[];
const tabOrder=[...configuredTabOrder,...defaultTabOrder.filter(x=>!configuredTabOrder.includes(x))];
const panels=[...root.querySelectorAll(".admin-panel")];
panels.sort((x,y)=>tabOrder.indexOf(x.querySelector("h2")?.textContent)-tabOrder.indexOf(y.querySelector("h2")?.textContent));
panels.forEach(panel=>root.appendChild(panel));
const tabBar=document.createElement("div");
tabBar.className="admin-tabs";
tabBar.setAttribute("role","tablist");
tabBar.setAttribute("aria-label","Dashboard management");
panels.forEach((panel,index)=>{
  const tabId="dashboard-tab-"+index;
  const panelId="dashboard-panel-"+index;
  panel.id=panelId;
  panel.dataset.adminPanel=String(index);
  panel.hidden=index!==0;
  const tab=document.createElement("button");
  tab.type="button";
  tab.className="admin-tab";
  tab.id=tabId;
  tab.textContent=panel.querySelector("h2")?.textContent||"Management";
  tab.setAttribute("role","tab");
  tab.setAttribute("aria-controls",panelId);
  tab.setAttribute("aria-selected",index===0?"true":"false");
  tab.tabIndex=index===0?0:-1;
  tab.onclick=()=>{
    panels.forEach((item,i)=>{
      const active=i===index;
      item.hidden=!active;
      tabBar.querySelectorAll(".admin-tab")[i].classList.toggle("is-active",active);
      tabBar.querySelectorAll(".admin-tab")[i].setAttribute("aria-selected",active?"true":"false");
      tabBar.querySelectorAll(".admin-tab")[i].tabIndex=active?0:-1;
    });
  };
  if(index===0)tab.classList.add("is-active");
  tabBar.appendChild(tab);
});
root.prepend(tabBar);
const customizationPanel=panels.find(panel=>panel.querySelector("h2")?.textContent==="Customization");
if(customizationPanel){
  const orderSection=document.createElement("div");
  orderSection.className="admin-form";
  const orderTitle=document.createElement("h3");
  orderTitle.textContent="Dashboard Tabs";
  const orderList=document.createElement("div");
  orderList.dataset.dashboardTabOrder="";
  const orderItems=[...tabOrder];
  const drawTabOrder=()=>{
    orderList.replaceChildren();
    orderItems.forEach((label,index)=>{
      const row=document.createElement("div");row.className="admin-row";row.textContent=label+" ";
      if(index>0)row.appendChild(btn("Up",()=>{const t=orderItems[index-1];orderItems[index-1]=orderItems[index];orderItems[index]=t;drawTabOrder();},false));
      if(index<orderItems.length-1)row.appendChild(btn("Down",()=>{const t=orderItems[index+1];orderItems[index+1]=orderItems[index];orderItems[index]=t;drawTabOrder();},false));
      orderList.appendChild(row);
    });
  };
  drawTabOrder();
  const saveOrder=btn("Save Dashboard Tabs",()=>a.adminSaveSetting(panelOrderKey,orderItems,false),true);
  orderSection.append(orderTitle,orderList,saveOrder);
  customization.appendChild(orderSection);
}
}draw();return root;}
async function renderDefinition(id){const content=document.querySelector('[data-context="content"]');if(!content)return;content.setAttribute("aria-busy","true");content.innerHTML='<div class="skeleton-page" aria-hidden="true"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-button"></div></div>';try{const definition=await window.Dalimgari.webAdapter.loadDefinition(id);clearElement(content);if(definition.type!=="content")return;const form=document.createElement("form");form.dataset.definition=definition.id;form.addEventListener("submit",e=>e.preventDefault());for(const item of definition.elements||[]){const element=item.type==="admin-dashboard"?adminDashboard():renderElement(item);if(element)form.appendChild(element);}content.appendChild(form);if(id==="home"){const r=await window.Dalimgari.access.getPublicContent();const out=content.querySelector('output[name="public-content"]');if(out){out.hidden=Boolean(r.error);out.textContent=r.error?"":r.data?.map(x=>x.content).join("\n\n")||"";}}if(id==="member"){const p=await window.Dalimgari.access.profile();const e=content.querySelector('output[name="email"]');const role=content.querySelector('output[name="role"]');const message=content.querySelector('output[name="message"]');if(p.error){if(message)message.textContent=p.error.message;return;}if(e)e.textContent=p.data.email||"";if(role)role.textContent=p.data.is_admin?"Admin":"Member";}if(id==="profile"){const p=await window.Dalimgari.access.profile();const e=content.querySelector('output[name="email"]');const role=content.querySelector('output[name="role"]');const message=content.querySelector('output[name="message"]');if(p.error){if(message)message.textContent=p.error.message;return;}if(e)e.textContent=p.data.email||"";if(role)role.textContent=p.data.is_admin?"Admin":"Member";}}catch(error){console.error("Dalimgari render error:",error);content.textContent=error.message||"Unable to load content."}finally{content.removeAttribute("aria-busy");}}
window.Dalimgari=window.Dalimgari||{};window.Dalimgari.webRenderer={renderDefinition};