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
  const caption=document.createElement("input");caption.placeholder="Caption *";caption.maxLength=5000;
  const description=document.createElement("textarea");description.placeholder="Description (optional)";
  const photo=document.createElement("input");photo.type="file";photo.accept="image/*";
  const video=document.createElement("input");video.type="file";video.accept="video/*";
  const visibility=document.createElement("select");[["public","Public"],["members","Members"],["private","Private"]].forEach(([v,l])=>visibility.appendChild(new Option(l,v)));
  const album=document.createElement("select");const publish=document.createElement("button");publish.type="button";publish.dataset.size="large";publish.textContent="Post";const postStatus=document.createElement("output");
  async function loadAlbums(){const r=await window.Dalimgari.media?.listAlbums?.();if(r?.data){album.replaceChildren(new Option("No album",""));r.data.forEach(x=>album.appendChild(new Option(x.title,x.id)));}}
  publish.onclick=async()=>{publish.disabled=true;const r=await window.Dalimgari.media.createPost({caption:caption.value,description:description.value,photo:photo.files?.[0],video:video.files?.[0],albumId:album.value||null,visibility:visibility.value});publish.disabled=false;if(r.error)postStatus.textContent=r.error.message;else{caption.value=description.value=photo.value=video.value="";album.value="";postStatus.textContent="Post published.";loadPosts();}};
  post.append(caption,description,photo,video,album,visibility,publish,postStatus);root.append(post);
  async function loadPosts(){const r=await window.Dalimgari.media.listPosts("all");list.replaceChildren();if(r.error){list.textContent=r.error.message;return;}for(const x of r.data||[]){const a=document.createElement("article");a.className="profile-post";const author=document.createElement("strong");author.textContent=x.profiles?.display_name||x.profiles?.email||"User";const text=document.createElement("p");text.textContent=x.content;a.append(author,text);if(x.description){const desc=document.createElement("p");desc.textContent=x.description;a.append(desc);}list.appendChild(a);}}  async function draw(){const r=await window.Dalimgari.access.profile();if(r.error){name.textContent=r.error.message;return;}name.textContent=r.data.display_name||"User";email.textContent=r.data.email||"";role.textContent=r.data.is_admin?"Admin":"Member";joined.textContent=r.data.created_at?"Joined "+new Date(r.data.created_at).toLocaleDateString():"";img.src=r.data.avatar_url||"";img.hidden=!r.data.avatar_url;loadPosts();}
  loadAlbums();draw();return root;
}
function renderElement(d){const c=window.Dalimgari.components||{};if(d.type==="profile")return renderProfileElement();if(d.type==="input"&&c.input)return c.input(d);if(d.type==="button"&&c.button)return c.button(d);if(d.type==="output"&&c.output)return c.output(d);if(d.type==="heading"){const level=Math.min(6,Math.max(1,Number(d.level)||1));const e=document.createElement(`h${level}`);e.textContent=d.text||"";return e;}if(d.type==="actions"){const w=document.createElement("div");w.dataset.element="actions";for(const i of d.items||[]){const e=renderElement(i);if(e)w.appendChild(e);}return w;}return null;}
function adminDashboard(){const root=document.createElement("div");root.className="admin-dashboard";const a=window.Dalimgari.access;if(!a)return root;const section=t=>{const s=document.createElement("section");s.className="admin-panel";const h=document.createElement("h2");h.textContent=t;s.appendChild(h);return s;};const btn=(label,fn,refresh)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.dataset.size="small";b.onclick=async()=>{b.disabled=true;try{const r=await fn();if(r?.error){const n=document.createElement("output");n.textContent=r.error.message||"Action failed.";root.prepend(n);}else if(refresh)await draw();}finally{b.disabled=false;}};return b;};const select=(name,placeholder,options)=>{const s=document.createElement("select");s.name=name;const empty=document.createElement("option");empty.value="";empty.textContent=placeholder;s.appendChild(empty);for(const o of options){const option=document.createElement("option");option.value=o.id;option.textContent=o.label;s.appendChild(option);}return s;};async function draw(){clearElement(root);root.setAttribute("aria-busy","true");root.innerHTML='<div class="skeleton-page" aria-hidden="true"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div></div>';const result=await a.adminData();clearElement(root);root.removeAttribute("aria-busy");if(result.error){const message=document.createElement("output");message.textContent="Dashboard could not be loaded: "+(result.error.message||"Unknown error.");root.appendChild(message);return;}const d=result.data;
const members=section("Members");for(const m of d.members){const row=document.createElement("div");row.className="admin-row";row.textContent=(m.email||m.id)+" — "+(m.is_admin?"Admin":m.is_active?"Active":"Disabled");if(!m.is_admin)row.appendChild(btn(m.is_active?"Disable":"Enable",()=>a.adminSetMemberActive(m.id,!m.is_active),true));members.appendChild(row);}root.appendChild(members);
const roles=section("Roles");const rf=document.createElement("div");rf.className="admin-form";rf.innerHTML='<input placeholder="Role name" data-role><input placeholder="Description" data-role-desc>';rf.appendChild(btn("Create Role",()=>a.adminCreateRole(rf.querySelector("[data-role]").value,rf.querySelector("[data-role-desc]").value),true));roles.appendChild(rf);for(const r of d.roles){const row=document.createElement("div");row.className="admin-row";row.textContent=r.name+" — "+(r.description||"");if(r.name!=="Member"&&r.name!=="Admin")row.appendChild(btn("Delete",()=>a.adminDeleteRole(r.id),true));roles.appendChild(row);}root.appendChild(roles);
const perms=section("Permissions");const pf=document.createElement("div");pf.className="admin-form";pf.innerHTML='<input placeholder="permission.key" data-perm><input placeholder="Description" data-perm-desc>';pf.appendChild(btn("Create Permission",()=>a.adminCreatePermission(pf.querySelector("[data-perm]").value,pf.querySelector("[data-perm-desc]").value),true));perms.appendChild(pf);for(const p of d.permissions){const row=document.createElement("div");row.className="admin-row";row.textContent=p.key+" — "+(p.description||"");row.appendChild(btn("Delete",()=>a.adminDeletePermission(p.id),true));perms.appendChild(row);}root.appendChild(perms);
const access=section("Member Access");const af=document.createElement("div");af.className="admin-form";const userSelect=select("user_id","Select member",d.members.filter(m=>!m.is_admin).map(m=>({id:m.id,label:m.email||m.display_name||m.id})));const roleSelect=select("role_id","Select role",d.roles.map(r=>({id:r.id,label:r.name})));const permSelect=select("permission_id","Select permission",d.permissions.map(p=>({id:p.id,label:p.key})));af.append(userSelect,roleSelect,permSelect);af.appendChild(btn("Assign Role",()=>a.adminSetRole(userSelect.value,roleSelect.value,true),true));af.appendChild(btn("Revoke Role",()=>a.adminSetRole(userSelect.value,roleSelect.value,false),true));af.appendChild(btn("Grant Permission",()=>a.adminSetPermission(userSelect.value,permSelect.value,true),true));af.appendChild(btn("Deny Permission",()=>a.adminSetPermission(userSelect.value,permSelect.value,false),true));af.appendChild(btn("Remove Permission Override",()=>a.adminRemovePermission(userSelect.value,permSelect.value),true));access.appendChild(af);root.appendChild(access);
const roleAccess=section("Role Permissions");const rpForm=document.createElement("div");rpForm.className="admin-form";const rpRole=select("role_id","Select role",d.roles.map(r=>({id:r.id,label:r.name})));const rpPerm=select("permission_id","Select permission",d.permissions.map(p=>({id:p.id,label:p.key})));rpForm.append(rpRole,rpPerm);rpForm.appendChild(btn("Grant to Role",()=>a.adminSetRolePermission(rpRole.value,rpPerm.value,true),true));rpForm.appendChild(btn("Remove from Role",()=>a.adminSetRolePermission(rpRole.value,rpPerm.value,false),true));roleAccess.appendChild(rpForm);root.appendChild(roleAccess);
const contentManager=section("Content");
const contentTabs=document.createElement("div");contentTabs.className="content-tabs";const contentBody=document.createElement("div");contentBody.className="content-body";const views={};
const makeView=(key,label)=>{const v=document.createElement("div");v.className="content-view";v.hidden=true;views[key]=v;const b=document.createElement("button");b.type="button";b.className="admin-tab";b.textContent=label;b.onclick=()=>{Object.entries(views).forEach(([k,x])=>x.hidden=k!==key);contentTabs.querySelectorAll("button").forEach(x=>x.classList.remove("is-active"));b.classList.add("is-active");v.refresh?.();};contentTabs.appendChild(b);contentBody.appendChild(v);return v;};
const createView=makeView("create","Create Post");const cf=document.createElement("div");cf.className="admin-form";const caption=document.createElement("input");caption.placeholder="Caption *";caption.maxLength=5000;const desc=document.createElement("textarea");desc.placeholder="Description (optional)";const photo=document.createElement("input");photo.type="file";photo.accept="image/*";const video=document.createElement("input");video.type="file";video.accept="video/*";const album=document.createElement("select");const vis=document.createElement("select");[["public","Public"],["members","Members"],["private","Private"]].forEach(([v,l])=>vis.appendChild(new Option(l,v)));const status=document.createElement("output");const loadAlbums=async()=>{const r=await window.Dalimgari.media.listAlbums();if(r.error){status.textContent=r.error.message;return;}album.replaceChildren(new Option("No album",""));(r.data||[]).forEach(x=>album.appendChild(new Option(x.title,x.id)));};cf.append(caption,desc,photo,video,album,vis,btn("Create Post",async()=>{const r=await window.Dalimgari.media.createPost({caption:caption.value,description:desc.value,photo:photo.files?.[0],video:video.files?.[0],albumId:album.value||null,visibility:vis.value});if(r.error){status.textContent=r.error.message;return r;}caption.value=desc.value=photo.value=video.value="";album.value="";status.textContent="Post created.";return r;},true),status);createView.appendChild(cf);createView.refresh=loadAlbums;
const renderList=async(filter,target)=>{const r=await window.Dalimgari.media.listPosts(filter);target.replaceChildren();if(r.error){target.textContent=r.error.message;return;}for(const p of r.data||[]){const row=document.createElement("div");row.className="admin-row";const text=document.createElement("div");text.textContent=p.content;const meta=document.createElement("small");meta.textContent=(p.visibility||"public")+" — "+new Date(p.created_at).toLocaleString();row.append(text,meta,btn("Delete",()=>window.Dalimgari.media.deletePost(p.id),true));target.appendChild(row);}if(!target.children.length)target.textContent="No posts found.";};
for(const[key,label]of[["all","All"],["photos","Photos"],["videos","Videos"]]){const v=makeView(key,label);const list=document.createElement("div");list.className="admin-list";v.appendChild(list);v.refresh=()=>renderList(key,list);}
const albumsView=makeView("albums","Albums");const af=document.createElement("div");af.className="admin-form";const at=document.createElement("input");at.placeholder="Album title *";const ad=document.createElement("textarea");ad.placeholder="Description (optional)";const as=document.createElement("output");af.append(at,ad,btn("Create Album",async()=>{const r=await window.Dalimgari.media.createAlbum(at.value,ad.value);if(r.error)as.textContent=r.error.message;else{at.value=ad.value="";as.textContent="Album created.";albumsView.refresh();}return r;},true),as);albumsView.appendChild(af);const al=document.createElement("div");al.className="admin-list";albumsView.appendChild(al);albumsView.refresh=async()=>{const r=await window.Dalimgari.media.listAlbums();al.replaceChildren();if(r.error){al.textContent=r.error.message;return;}for(const x of r.data||[]){const row=document.createElement("div");row.className="admin-row";row.textContent=x.title+" — "+(x.description||"");row.appendChild(btn("Delete",()=>window.Dalimgari.media.deleteAlbum(x.id),true));al.appendChild(row);}if(!al.children.length)al.textContent="No albums found.";};
contentManager.append(contentTabs,contentBody);root.appendChild(contentManager);views.create.hidden=false;contentTabs.querySelector("button")?.classList.add("is-active");loadAlbums();
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

const content=section("Public Sections");const cf=document.createElement("div");cf.className="admin-form";cf.innerHTML='<input placeholder="slug" data-slug><input placeholder="Title" data-title><textarea placeholder="Content" data-content></textarea><input placeholder="Sort order" type="number" data-sort>';cf.appendChild(btn("Save Section",()=>a.adminSaveSection({slug:cf.querySelector("[data-slug]").value,title:cf.querySelector("[data-title]").value,content:cf.querySelector("[data-content]").value,sort_order:Number(cf.querySelector("[data-sort]").value)||0,is_published:true}),true));content.appendChild(cf);for(const x of d.sections){const row=document.createElement("div");row.className="admin-row";row.textContent=x.title+" — "+x.slug;row.appendChild(btn("Delete",()=>a.adminDeleteSection(x.id),true));content.appendChild(row);}root.appendChild(content);
const panelOrderKey="dashboard.tabs";
const defaultGroupOrder=["Overview","Users & Access","Content","Website","Appearance","Dashboard Settings"];
const savedGroupOrder=d.settings.find(x=>x.key===panelOrderKey)?.value;
const configuredGroupOrder=Array.isArray(savedGroupOrder)?savedGroupOrder.filter(x=>defaultGroupOrder.includes(x)):[];
const groupOrder=[...configuredGroupOrder,...defaultGroupOrder.filter(x=>!configuredGroupOrder.includes(x))];

const overview=section("Overview");
const stats=document.createElement("div");stats.className="admin-stat-grid";
[
  ["Members",(d.members||[]).length],
  ["Active Members",(d.members||[]).filter(x=>x.is_active).length],
  ["Roles",(d.roles||[]).length],
  ["Permissions",(d.permissions||[]).length],
  ["Posts",(d.posts||[]).length],
  ["Public Sections",(d.sections||[]).length]
].forEach(([label,value])=>{const card=document.createElement("div");card.className="admin-stat-card";const valueEl=document.createElement("strong");valueEl.textContent=String(value);const labelEl=document.createElement("span");labelEl.textContent=label;card.append(valueEl,labelEl);stats.appendChild(card);});
overview.appendChild(stats);root.appendChild(overview);

const allPanels=[...root.querySelectorAll(".admin-panel")];
const groups=new Map(defaultGroupOrder.map(name=>[name,[]]));
const groupMap={
  "Content":"Content","Members":"Users & Access","Roles":"Users & Access","Permissions":"Users & Access","Member Access":"Users & Access","Role Permissions":"Users & Access",
  "Posts":"Content","Public Sections":"Content",
  "Basic Information":"Website","Sidebar Components":"Website",
  "Theme":"Appearance","Customization":"Appearance",
  "Overview":"Overview"
};
allPanels.forEach(panel=>{const name=panel.querySelector("h2")?.textContent||"";const group=groupMap[name];if(group)groups.get(group).push(panel);});

const dashboardSettings=section("Dashboard Settings");
const orderSection=document.createElement("div");orderSection.className="admin-form";
const orderTitle=document.createElement("h3");orderTitle.textContent="Dashboard Groups";
const orderHint=document.createElement("p");orderHint.textContent="Arrange the groups in the order you want them to appear.";
const orderList=document.createElement("div");orderList.dataset.dashboardGroupOrder="";
const orderItems=[...groupOrder];
const drawGroupOrder=()=>{
  orderList.replaceChildren();
  orderItems.forEach((label,index)=>{
    const row=document.createElement("div");row.className="admin-row";
    const textEl=document.createElement("span");textEl.textContent=label;row.appendChild(textEl);
    if(index>0)row.appendChild(btn("Up",()=>{const t=orderItems[index-1];orderItems[index-1]=orderItems[index];orderItems[index]=t;drawGroupOrder();},false));
    if(index<orderItems.length-1)row.appendChild(btn("Down",()=>{const t=orderItems[index+1];orderItems[index+1]=orderItems[index];orderItems[index]=t;drawGroupOrder();},false));
    orderList.appendChild(row);
  });
};
drawGroupOrder();
orderSection.append(orderTitle,orderHint,orderList,btn("Save Dashboard Groups",()=>a.adminSaveSetting(panelOrderKey,orderItems,false),true));
dashboardSettings.appendChild(orderSection);groups.get("Dashboard Settings").push(dashboardSettings);

const groupPanels=[];
for(const groupName of groupOrder){
  const group=document.createElement("section");
  group.className="admin-group";
  group.dataset.adminGroup=groupName;
  const heading=document.createElement("h2");heading.textContent=groupName;
  group.appendChild(heading);
  const description=document.createElement("p");description.className="admin-group-description";
  const descriptions={
    "Overview":"Quick view of your website management status.",
    "Users & Access":"Manage members, roles, permissions, and access.",
    "Content":"Manage posts and public website sections.",
    "Website":"Manage website identity and navigation.",
    "Appearance":"Control the visual design and website customization.",
    "Dashboard Settings":"Control how the admin dashboard is organized."
  };
  description.textContent=descriptions[groupName]||"";group.appendChild(description);
  for(const panel of groups.get(groupName)||[]){panel.hidden=false;group.appendChild(panel);}
  groupPanels.push(group);root.appendChild(group);
}

const tabBar=document.createElement("div");
tabBar.className="admin-tabs";
tabBar.setAttribute("role","tablist");
tabBar.setAttribute("aria-label","Dashboard management groups");
groupPanels.forEach((group,index)=>{
  const tabId="dashboard-group-tab-"+index;
  const panelId="dashboard-group-panel-"+index;
  group.id=panelId;
  group.hidden=index!==0;
  const tab=document.createElement("button");
  tab.type="button";tab.className="admin-tab";tab.id=tabId;
  tab.textContent=group.dataset.adminGroup;
  tab.setAttribute("role","tab");tab.setAttribute("aria-controls",panelId);
  tab.setAttribute("aria-selected",index===0?"true":"false");tab.tabIndex=index===0?0:-1;
  tab.onclick=()=>{
    groupPanels.forEach((item,i)=>{
      const active=i===index;item.hidden=!active;
      const currentTab=tabBar.querySelectorAll(".admin-tab")[i];
      currentTab.classList.toggle("is-active",active);
      currentTab.setAttribute("aria-selected",active?"true":"false");
      currentTab.tabIndex=active?0:-1;
    });
  };
  if(index===0)tab.classList.add("is-active");
  tabBar.appendChild(tab);
});
root.prepend(tabBar);

async function renderDefinition(id){const content=document.querySelector('[data-context="content"]');if(!content)return;content.setAttribute("aria-busy","true");content.innerHTML='<div class="skeleton-page" aria-hidden="true"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-button"></div></div>';try{const definition=await window.Dalimgari.webAdapter.loadDefinition(id);clearElement(content);if(definition.type!=="content")return;const form=document.createElement("form");form.dataset.definition=definition.id;form.addEventListener("submit",e=>e.preventDefault());for(const item of definition.elements||[]){const element=item.type==="admin-dashboard"?adminDashboard():renderElement(item);if(element)form.appendChild(element);}content.appendChild(form);if(id==="home"){const r=await window.Dalimgari.access.getPublicContent();const out=content.querySelector('output[name="public-content"]');if(out){out.hidden=Boolean(r.error);out.textContent=r.error?"":r.data?.map(x=>String(x.content||"").replace(/\\n/g,"\n")).join("\n\n")||"";}}if(id==="member"){const p=await window.Dalimgari.access.profile();const e=content.querySelector('output[name="email"]');const role=content.querySelector('output[name="role"]');const message=content.querySelector('output[name="message"]');if(p.error){if(message)message.textContent=p.error.message;return;}if(e)e.textContent=p.data.email||"";if(role)role.textContent=p.data.is_admin?"Admin":"Member";}if(id==="profile"){const p=await window.Dalimgari.access.profile();const e=content.querySelector('output[name="email"]');const role=content.querySelector('output[name="role"]');const message=content.querySelector('output[name="message"]');if(p.error){if(message)message.textContent=p.error.message;return;}if(e)e.textContent=p.data.email||"";if(role)role.textContent=p.data.is_admin?"Admin":"Member";}}catch(error){console.error("Dalimgari render error:",error);content.textContent=error.message||"Unable to load content."}finally{content.removeAttribute("aria-busy");}}
window.Dalimgari=window.Dalimgari||{};window.Dalimgari.webRenderer={renderDefinition};