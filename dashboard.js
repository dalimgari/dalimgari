(() => {
  "use strict";
  const context = window.DalimgariDashboardContext;
  if (!context) throw new Error("Dashboard context is unavailable.");

  const {
    supabaseClient,
    mainContent,
    getUiLanguage,
    localizedRecordValue,
    localizedMediaValue,
    createContentMediaUrl,
    applyDalimgariSiteConfig,
    renderPage,
    removeRecycleStorageFiles,
    setCurrentMenuPage,
    getCurrentUser
  } = context;
  const getRuntimeConfig = context.getRuntimeConfig;

  async function renderDashboard() {
        await applyDalimgariSiteConfig();
        const user = await getCurrentUser();
        const role = String((user && user.app_metadata && user.app_metadata.role) || "").toLowerCase();
        const isAdmin=role==="admin";
        let permissionNames=[];
        if(user&&!isAdmin){const {data,error}=await supabaseClient.rpc("get_my_permissions");if(!error&&Array.isArray(data))permissionNames=data;}
        const permissionSet=new Set(permissionNames);
        const canContent=["content.view","content.create","content.edit","content.delete"].some(name=>permissionSet.has(name));
        if(!user||(!isAdmin&&permissionNames.length===0)){renderPage("Profile");history.replaceState(null,"","#profile");setCurrentMenuPage("Profile");return;}
        const allSections = [
          { id: "overview", label: "Overview", description: "Dashboard overview." },
          { id: "hero", label: "Hero", description: "Create and manage homepage hero content." },
          { id: "post", label: "Post", description: "Create and manage posts." },
          { id: "page", label: "Page", description: "Create and manage custom pages." },
          { id: "album", label: "Album", description: "Group related content and media." },
          { id: "media-library", label: "Media Library", description: "Manage reusable media files and their metadata." },
          { id: "widget", label: "Widget", description: "Manage homepage widgets and their Show/Hide visibility." },
          { id: "user", label: "User", description: "Manage accounts and administrator access." },
          { id: "role", label: "Role", description: "Manage roles, permissions and user assignments." },
          { id: "customization", label: "Customization", description: "Website customization section." },
          { id: "settings", label: "Settings", description: "Dashboard settings section." },
          { id: "recycle", label: "Recycle Bin", description: "Restore deleted items or permanently remove them after the retention period." }
        ];
        const sections=allSections.filter(section=>{
          if(isAdmin||section.id==="overview")return true;
          if(section.id==="user")return permissionSet.has("users.manage");
          if(section.id==="media-library")return isAdmin||canContent;
          if(["hero","post","page","album"].includes(section.id))return canContent;
          if(section.id==="role")return permissionSet.has("roles.manage");
          if(["customization","settings"].includes(section.id))return permissionSet.has("settings.manage");
          if(section.id==="recycle")return ["content.delete","roles.manage","settings.manage"].some(name=>permissionSet.has(name));
          return false;
        });
  
        const page = document.createElement("section");
        page.className = "dashboard-page";
        page.setAttribute("aria-label", "Admin Dashboard");
        // Bring focused controls into view when forms are long or content overflows.
        page.addEventListener("focusin", (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement) ||
              !target.matches("input, select, textarea, button, [tabindex]")) return;
          requestAnimationFrame(() => {
            if (!target.isConnected) return;
            const rect = target.getBoundingClientRect();
            const viewportHeight = document.documentElement.clientHeight;
            const viewportWidth = document.documentElement.clientWidth;
            if (rect.top < 8 || rect.bottom > viewportHeight - 8 ||
                rect.left < 8 || rect.right > viewportWidth - 8) {
              target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            }
          });
        });
  
        const heading = document.createElement("h1");
        heading.className = "dashboard-heading";
        heading.textContent = "Dashboard";
  
        const navigationArea = document.createElement("div");
        navigationArea.className = "dashboard-navigation-area";
  
        const navigation = document.createElement("div");
        navigation.className = "dashboard-navigation";
        navigation.setAttribute("role", "tablist");
        navigation.setAttribute("aria-label", "Dashboard sections");
  
        const content = document.createElement("section");
        content.className = "dashboard-section-content";
        content.setAttribute("role", "tabpanel");
        content.setAttribute("aria-live", "polite");
  
        const sectionTitle = document.createElement("h2");
        sectionTitle.className = "dashboard-section-title";
  
        const sectionDescription = document.createElement("p");
        sectionDescription.className = "dashboard-section-description";
  
        content.append(sectionTitle, sectionDescription);
  
        let sectionRenderToken = 0;
        function selectSection(section) {
          sectionTitle.textContent = section.label;
          sectionDescription.textContent = section.description;
          if (window.location.hash !== "#dashboard-" + section.id) {
            history.replaceState(null, "", "#dashboard-" + section.id);
          }
          content.setAttribute("aria-labelledby", "dashboard-tab-" + section.id);
          navigation.querySelectorAll(".dashboard-nav-button").forEach((button) => {
            const selected = button.dataset.section === section.id;
            button.setAttribute("aria-selected", String(selected));
            button.tabIndex = selected ? 0 : -1;
          });
          const token = ++sectionRenderToken;
          renderDashboardSection(section, content, token, () => token === sectionRenderToken);
        }
  
        sections.forEach((section, index) => {
          const button = document.createElement("button");
          button.className = "dashboard-nav-button";
          button.type = "button";
          button.textContent = section.label;
          button.dataset.section = section.id;
          button.id = "dashboard-tab-" + section.id;
          button.setAttribute("role", "tab");
          button.setAttribute("aria-controls", "dashboard-section-panel");
          button.setAttribute("aria-selected", String(index === 0));
          button.tabIndex = index === 0 ? 0 : -1;
          button.addEventListener("click", () => selectSection(section));
          button.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            const currentIndex = sections.findIndex((item) => item.id === section.id);
            const nextIndex = event.key === "ArrowRight"
              ? (currentIndex + 1) % sections.length
              : (currentIndex - 1 + sections.length) % sections.length;
            const nextButton = navigation.querySelector('[data-section="' + sections[nextIndex].id + '"]');
            selectSection(sections[nextIndex]);
            nextButton.focus();
            nextButton.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
          });
          navigation.append(button);
        });
  
        content.id = "dashboard-section-panel";
        content.setAttribute("aria-labelledby", "dashboard-tab-overview");
        navigationArea.append(navigation);
        page.append(heading, navigationArea, content);
  
        const requestedSectionId = window.location.hash.toLowerCase().startsWith("#dashboard-")
          ? window.location.hash.slice("#dashboard-".length)
          : "overview";
        const initialSection = sections.find((section) => section.id === requestedSectionId) || sections[0];
        selectSection(initialSection);
        mainContent.replaceChildren(page);
        setCurrentMenuPage("Dashboard");
      }
  
  
      async function renderMediaLibrarySection(content, user, isCurrent) {
        content.replaceChildren();
        const wrap=document.createElement("div");wrap.className="dashboard-crud";
        const card=document.createElement("section");card.className="dashboard-crud-card";
        const heading=document.createElement("h3");heading.textContent="Central Media Library";
        const hint=document.createElement("p");hint.className="dashboard-crud-hint";hint.textContent="One stored file can be reused across Hero, Post, Page and Album. Titles are required; description, tags and alt text are optional. Files linked to content cannot be permanently deleted.";
        const search=document.createElement("input");search.className="dashboard-crud-input";search.type="search";search.placeholder="Search by title, filename or tag";search.setAttribute("aria-label","Search media");
        const status=document.createElement("p");status.className="dashboard-crud-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
        const list=document.createElement("div");list.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px;margin-top:16px";
        const loadMoreButton=document.createElement("button");loadMoreButton.type="button";loadMoreButton.className="action-button";loadMoreButton.hidden=true;loadMoreButton.style.cssText="display:block;margin:16px auto;min-height:40px;padding:8px 18px";
        const uploadCard=document.createElement("section");uploadCard.className="dashboard-crud-card";
        const uploadHeading=document.createElement("h3");uploadHeading.textContent="Upload to Media Library";
        const uploadHint=document.createElement("p");uploadHint.className="dashboard-crud-hint";uploadHint.textContent="Upload files directly to the library without creating or editing a Post, Page, Hero item or Album. Supported images, video, audio and PDF files up to 50 MB each.";
        const uploadForm=document.createElement("form");uploadForm.className="dashboard-crud-form";uploadForm.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px";
        const fileField=document.createElement("div");fileField.className="dashboard-crud-field full";
        const fileLabel=document.createElement("label");fileLabel.textContent="Choose files";fileLabel.htmlFor="media-library-upload-files";
        const filesInput=document.createElement("input");filesInput.id="media-library-upload-files";filesInput.type="file";filesInput.multiple=true;filesInput.accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,application/pdf";filesInput.setAttribute("aria-label","Choose media files to upload");
        const visibilityField=document.createElement("div");visibilityField.className="dashboard-crud-field";
        const visibilityLabel=document.createElement("label");visibilityLabel.textContent="File visibility";
        const visibilitySelect=document.createElement("select");visibilitySelect.className="dashboard-crud-input";visibilitySelect.setAttribute("aria-label","Uploaded file visibility");
        [["private","Private — admin access only"],["public","Public — can be displayed on the website"]].forEach(function(option){const o=document.createElement("option");o.value=option[0];o.textContent=option[1];visibilitySelect.append(o);});
        const fileRows=document.createElement("div");fileRows.className="dashboard-crud-field full";fileRows.style.cssText="display:grid;gap:12px";
        const uploadStatus=document.createElement("p");uploadStatus.className="dashboard-crud-status";uploadStatus.setAttribute("role","status");uploadStatus.setAttribute("aria-live","polite");
        const uploadActions=document.createElement("div");uploadActions.className="dashboard-crud-actions dashboard-crud-field full";
        const uploadButton=document.createElement("button");uploadButton.type="submit";uploadButton.className="action-button primary";uploadButton.textContent="Upload to Library";
        fileField.append(fileLabel,filesInput);visibilityField.append(visibilityLabel,visibilitySelect);uploadActions.append(uploadButton);
        uploadForm.append(fileField,visibilityField,fileRows,uploadActions,uploadStatus);
        uploadCard.append(uploadHeading,uploadHint,uploadForm);
        card.append(heading,hint,search,status,list,loadMoreButton);wrap.append(uploadCard,card);content.append(wrap);
        const allowedUploadTypes=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif","image/svg+xml","video/mp4","video/webm","video/quicktime","audio/mpeg","audio/mp4","audio/wav","audio/ogg","application/pdf"]);
        let uploadItems=[];
        function setUploadStatus(message,bad){uploadStatus.textContent=message;uploadStatus.style.color=bad?"#a12622":"#176b43";}
        filesInput.addEventListener("change",function(){
          fileRows.replaceChildren();uploadItems=[];
          Array.from(filesInput.files||[]).forEach(function(file,index){
            const row=document.createElement("fieldset");row.style.cssText="min-width:0;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:10px;padding:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px";
            const legend=document.createElement("legend");legend.textContent=file.name+" · "+Math.max(1,Math.round(file.size/1024))+" KB";
            const field=(labelText,placeholder,maxLength,required,value,ariaLabel)=>{const wrap=document.createElement("div");wrap.className="dashboard-crud-field";const label=document.createElement("label");label.textContent=labelText;const input=document.createElement("input");input.className="dashboard-crud-input";input.maxLength=maxLength;input.required=required;if(placeholder)input.placeholder=placeholder;if(value!==undefined)input.value=value;input.setAttribute("aria-label",ariaLabel);wrap.append(label,input);return {wrap,input};};
            const titleEn=field("Title (English, required)","",180,true,file.name.replace(/\.[^.]+$/,"").trim(),"English title for "+file.name);
            const titleBn=field("Title (বাংলা, required)","",180,true,"","Bengali title for "+file.name);
            const descEn=field("Description (English, optional)","",1000,false,"","English description for "+file.name);
            const descBn=field("Description (বাংলা, optional)","",1000,false,"","Bengali description for "+file.name);
            const tagsEn=field("Tags (English, optional)","Comma-separated tags",500,false,"","English tags for "+file.name);
            const tagsBn=field("Tags (বাংলা, optional)","কমা দিয়ে আলাদা করা ট্যাগ",500,false,"","Bengali tags for "+file.name);
            const altEn=field("Alt text (English, optional)","",500,false,"","English alt text for "+file.name);
            const altBn=field("Alt text (বাংলা, optional)","",500,false,"","Bengali alt text for "+file.name);
            row.append(legend,titleEn.wrap,titleBn.wrap,descEn.wrap,descBn.wrap,tagsEn.wrap,tagsBn.wrap,altEn.wrap,altBn.wrap);fileRows.append(row);
            uploadItems.push({file:file,titleEn:titleEn.input,titleBn:titleBn.input,descriptionEn:descEn.input,descriptionBn:descBn.input,tagsEn:tagsEn.input,tagsBn:tagsBn.input,altEn:altEn.input,altBn:altBn.input,row:row});
          });
          setUploadStatus(uploadItems.length?uploadItems.length+" file(s) selected. Add both English and Bengali titles for each file, then upload.":"",false);
        });
        uploadForm.addEventListener("submit",async function(event){
          event.preventDefault();
          if(!uploadItems.length){setUploadStatus("Choose at least one file first.",true);filesInput.focus();return;}
          const user=await getCurrentUser();
          if(!user||String(user.app_metadata&&user.app_metadata.role||"").toLowerCase()!=="admin"){setUploadStatus("An active administrator session is required to upload media.",true);return;}
          for(const item of uploadItems){
            if(!allowedUploadTypes.has(item.file.type)||item.file.size>50*1024*1024){setUploadStatus("Unsupported file or file exceeds 50 MB: "+item.file.name+". Remove it and choose a supported file.",true);return;}
            if(!item.titleEn.value.trim()||!item.titleBn.value.trim()){setUploadStatus("Every file needs both English and Bengali titles: "+item.file.name,true);(!item.titleEn.value.trim()?item.titleEn:item.titleBn).focus();return;}
          }
          uploadButton.disabled=true;filesInput.disabled=true;visibilitySelect.disabled=true;
          let uploaded=0;const failures=[];
          try{
            for(let i=0;i<uploadItems.length;i++){
              const item=uploadItems[i];const file=item.file;let path="";
              setUploadStatus("Uploading "+(i+1)+" of "+uploadItems.length+": "+file.name,false);
              item.row.style.borderColor="#94a3b8";
              try{
                const extension=(file.name.match(/\.([a-zA-Z0-9]{1,10})$/)||[])[1]||"bin";
                const folder=visibilitySelect.value==="public"?"public":"private";
                path=folder+"/"+user.id+"/"+crypto.randomUUID()+"."+extension.toLowerCase();
                const {error:uploadError}=await supabaseClient.storage.from("content-files").upload(path,file,{contentType:file.type,cacheControl:"3600",upsert:false});
                if(uploadError)throw uploadError;
                const englishTags=item.tagsEn.value.split(",").map(function(tag){return tag.trim();}).filter(Boolean);
                const bengaliTags=item.tagsBn.value.split(",").map(function(tag){return tag.trim();}).filter(Boolean);
                const metadata={
                  title:item.titleEn.value.trim(),
                  title_en:item.titleEn.value.trim(),
                  title_bn:item.titleBn.value.trim(),
                  description:item.descriptionEn.value.trim()||null,
                  description_en:item.descriptionEn.value.trim()||null,
                  description_bn:item.descriptionBn.value.trim()||null,
                  tags:englishTags,
                  tags_en:englishTags,
                  tags_bn:bengaliTags,
                  alt_text:item.altEn.value.trim()||null,
                  alt_text_en:item.altEn.value.trim()||null,
                  alt_text_bn:item.altBn.value.trim()||null,
                  original_filename:file.name,
                  storage_bucket:"content-files",
                  storage_path:path,
                  mime_type:file.type,
                  size_bytes:file.size,
                  created_by:user.id
                };
                const {error:assetError}=await supabaseClient.from("media_assets").insert(metadata);
                if(assetError)throw assetError;
                uploaded++;item.failed=false;item.row.style.borderColor="#86b99d";
                const rowStatus=document.createElement("p");rowStatus.className="dashboard-crud-hint";rowStatus.textContent="Uploaded successfully.";item.row.append(rowStatus);
              }catch(error){
                if(path)await supabaseClient.storage.from("content-files").remove([path]).catch(function(){});
                item.failed=true;failures.push(file.name+": "+(error.message||"Upload failed"));
                item.row.style.borderColor="#d88b85";
                const rowStatus=document.createElement("p");rowStatus.className="dashboard-crud-hint";rowStatus.style.color="#a12622";rowStatus.textContent="Failed: "+(error.message||"Upload failed");item.row.append(rowStatus);
              }
            }
            await load();
            setUploadStatus(uploaded+" of "+(uploaded+failures.length)+" file(s) uploaded to Media Library. "+(failures.length?failures.length+" failed — only failed files remain selected for retry.":"No content record was created."),failures.length>0);
            if(!failures.length){uploadForm.reset();fileRows.replaceChildren();uploadItems=[];}
            else{uploadItems=uploadItems.filter(function(item){return item.failed===true;});}
          }finally{
            uploadButton.disabled=false;filesInput.disabled=false;visibilitySelect.disabled=false;
          }
        });
        let assets=[];
        let filteredAssets=[];
        let visibleAssetCount=0;
        const assetPageSize=24;
        const say=(msg,bad=false,target=status)=>{target.textContent=msg;target.style.color=bad?"#a12622":"#176b43";};
        loadMoreButton.addEventListener("click",()=>draw(false));
        async function load(){
          list.replaceChildren();say("Loading media…");
          const {data,error}=await supabaseClient.from("media_assets").select("id,title,title_en,title_bn,description,description_en,description_bn,tags,tags_en,tags_bn,alt_text,alt_text_en,alt_text_bn,original_filename,storage_bucket,storage_path,mime_type,size_bytes,created_at,updated_at").order("created_at",{ascending:false}).limit(500);
          if(!isCurrent())return;
          if(error){say("Could not load media: "+error.message,true);return;}
          assets=data||[];draw();
        }
        function draw(reset=true){
          if(reset){
            list.replaceChildren();
            const q=search.value.trim().toLowerCase();
            filteredAssets=assets.filter(a=>[a.title_en,a.title_bn,a.title,a.original_filename,a.description_en,a.description_bn,a.description,(a.tags_en||""),(a.tags_bn||""),(a.tags||[]).join(" ")].some(v=>String(v||"").toLowerCase().includes(q)));
            visibleAssetCount=0;
          }
          if(!filteredAssets.length){const empty=document.createElement("p");empty.className="dashboard-crud-empty";empty.textContent="No media files match this search.";list.append(empty);loadMoreButton.hidden=true;say(assets.length+" file(s) in library.");return;}
          say(assets.length+" file(s) in library; showing "+filteredAssets.length+".");
          const nextAssets=filteredAssets.slice(visibleAssetCount,visibleAssetCount+assetPageSize);
          for(const asset of nextAssets){
            const tile=document.createElement("article");tile.style.cssText="min-width:0;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:12px;padding:12px;background:var(--dg-surface)";
            const preview=document.createElement("div");preview.style.cssText="display:grid;place-items:center;min-height:110px;max-height:180px;overflow:hidden;background:#f8fafc;border-radius:var(--dg-radius-small);margin-bottom:10px";
            if(String(asset.mime_type||"").startsWith("image/")){
              const img=document.createElement("img");img.alt=localizedRecordValue(asset,"alt_text")||localizedRecordValue(asset,"title");img.loading="lazy";img.decoding="async";img.style.cssText="max-width:100%;max-height:170px;object-fit:contain";
              createContentMediaUrl(asset.storage_path,asset.storage_bucket||"content-files").then(url=>{if(url&&img.isConnected)img.src=url;});
              preview.append(img);
            }else{const icon=document.createElement("span");icon.textContent=String(asset.mime_type||"").startsWith("video/")?"Video":String(asset.mime_type||"").startsWith("audio/")?"Audio":"File";icon.style.cssText="font-weight:700;color:#475569";preview.append(icon);}
            const makeMetaField=(labelText,value,placeholder,maxLength,required=false)=>{const wrap=document.createElement("div");wrap.className="dashboard-crud-field";const label=document.createElement("label");label.textContent=labelText;const input=document.createElement("input");input.className="dashboard-crud-input";input.value=value||"";input.placeholder=placeholder||"";input.maxLength=maxLength;input.required=required;wrap.append(label,input);return {wrap,input};};
            const titleEn=makeMetaField("Title (English, required)",asset.title_en||asset.title,"",180,true);
            const titleBn=makeMetaField("Title (বাংলা, required)",asset.title_bn,"",180,true);
            const descEn=makeMetaField("Description (English, optional)",asset.description_en||asset.description,"",1000);
            const descBn=makeMetaField("Description (বাংলা, optional)",asset.description_bn,"",1000);
            const tagsEn=makeMetaField("Tags (English, optional)",Array.isArray(asset.tags_en)?asset.tags_en.join(", "):(asset.tags_en||(Array.isArray(asset.tags)?asset.tags.join(", "):asset.tags)),"Comma-separated tags",500);
            const tagsBn=makeMetaField("Tags (বাংলা, optional)",Array.isArray(asset.tags_bn)?asset.tags_bn.join(", "):(asset.tags_bn||""),"কমা দিয়ে আলাদা করা ট্যাগ",500);
            const altEn=makeMetaField("Alt text (English, optional)",asset.alt_text_en||asset.alt_text,"",500);
            const altBn=makeMetaField("Alt text (বাংলা, optional)",asset.alt_text_bn,"",500);
            const filename=document.createElement("p");filename.className="dashboard-crud-hint";filename.textContent=(asset.original_filename||"File")+" · "+(asset.size_bytes?Math.round(asset.size_bytes/1024)+" KB":"size unknown");
            const linkInfo=document.createElement("p");linkInfo.className="dashboard-crud-hint";linkInfo.textContent="Media ID: "+asset.id;
            const attachmentArea=document.createElement("div");attachmentArea.style.cssText="display:grid;gap:8px;margin:8px 0";
            const actions=document.createElement("div");actions.className="dashboard-crud-actions";
            const tileStatus=document.createElement("p");tileStatus.className="dashboard-crud-status";tileStatus.setAttribute("role","status");tileStatus.setAttribute("aria-live","polite");
            const save=document.createElement("button");save.type="button";save.className="action-button primary";save.textContent="Save Metadata";
            const del=document.createElement("button");del.type="button";del.className="action-button";del.textContent="Delete File";
            save.addEventListener("click",async()=>{
              const cleanTitleEn=titleEn.input.value.trim();const cleanTitleBn=titleBn.input.value.trim();
              if(!cleanTitleEn||!cleanTitleBn){say("Every media file needs both English and Bengali titles.",true,tileStatus);(!cleanTitleEn?titleEn.input:titleBn.input).focus();return;}
              save.disabled=true;
              try{
                const englishTags=tagsEn.input.value.split(",").map(x=>x.trim()).filter(Boolean);
                const bengaliTags=tagsBn.input.value.split(",").map(x=>x.trim()).filter(Boolean);
                const payload={title:cleanTitleEn,title_en:cleanTitleEn,title_bn:cleanTitleBn,description:descEn.input.value.trim()||null,description_en:descEn.input.value.trim()||null,description_bn:descBn.input.value.trim()||null,tags:englishTags,tags_en:englishTags,tags_bn:bengaliTags,alt_text:altEn.input.value.trim()||null,alt_text_en:altEn.input.value.trim()||null,alt_text_bn:altBn.input.value.trim()||null,updated_at:new Date().toISOString()};
                const {error}=await supabaseClient.from("media_assets").update(payload).eq("id",asset.id);if(error)throw error;
                const {data:links,error:linksError}=await supabaseClient.from("media_links").select("source_table,source_id").eq("media_id",asset.id);
                if(linksError)throw linksError;
                for(const link of links||[]){
                  if(!["albums","post","pages","hero_items"].includes(link.source_table))continue;
                  const {data:source,error:sourceError}=await supabaseClient.from(link.source_table).select("media").eq("id",link.source_id).maybeSingle();
                  if(sourceError)throw sourceError;
                  const media=Array.isArray(source?.media)?source.media:[];
                  const updated=media.map(item=>String(item.path||item.storage_path||"")===String(asset.storage_path)?{...item,media_id:asset.id,title:cleanTitleEn,title_en:cleanTitleEn,title_bn:cleanTitleBn,alt_text:payload.alt_text,alt_text_en:payload.alt_text_en,alt_text_bn:payload.alt_text_bn}:item);
                  const {error:updateSourceError}=await supabaseClient.from(link.source_table).update({media:updated,updated_at:new Date().toISOString()}).eq("id",link.source_id);
                  if(updateSourceError)throw updateSourceError;
                }
                Object.assign(asset,payload);say("Media metadata saved.",false,tileStatus);
              }catch(e){say("Save failed: "+(e.message||"Unknown error"),true,tileStatus);}
              finally{save.disabled=false;}
            });
            del.addEventListener("click",async()=>{
              del.disabled=true;attachmentArea.replaceChildren();tileStatus.textContent="";
              try{
                const {data:links,error:linkError}=await supabaseClient.from("media_links").select("id,source_table,source_id").eq("media_id",asset.id);
                if(linkError)throw linkError;
                if(links?.length){
                  const heading=document.createElement("p");heading.className="dashboard-crud-hint";heading.textContent="This file is attached in the following locations. Detach it here, then click Delete File again.";attachmentArea.append(heading);
                  const labels={hero_items:"Hero",post:"Post",pages:"Page",albums:"Album"};
                  for(const link of links){
                    const row=document.createElement("div");row.style.cssText="border:1px solid #d1d5db;border-radius:var(--dg-radius-small);padding:10px;display:grid;gap:6px";
                    const info=document.createElement("p");info.className="dashboard-crud-hint";
                    if(!Object.prototype.hasOwnProperty.call(labels,link.source_table)){info.textContent="Unknown location ("+link.source_table+"), record ID: "+link.source_id;row.append(info);attachmentArea.append(row);continue;}
                    const {data:source,error:sourceError}=await supabaseClient.from(link.source_table).select("id,title,url").eq("id",link.source_id).maybeSingle();
                    if(sourceError)throw sourceError;
                    const recordTitle=source?.title||source?.url||link.source_id;
                    info.textContent=labels[link.source_table]+": "+recordTitle+(source?.url?" · URL: "+source.url:"");
                    const detach=document.createElement("button");detach.type="button";detach.className="action-button";detach.textContent="Detach from "+labels[link.source_table];
                    detach.addEventListener("click",async()=>{
                      detach.disabled=true;
                      try{
                        const {data:current,error:currentError}=await supabaseClient.from(link.source_table).select("media").eq("id",link.source_id).maybeSingle();
                        if(currentError)throw currentError;
                        const media=Array.isArray(current?.media)?current.media:[];
                        const updated=media.filter(item=>String(item.media_id||"")!==String(asset.id)&&String(item.path||item.storage_path||"")!==String(asset.storage_path));
                        if(updated.length!==media.length){
                          const {error:updateError}=await supabaseClient.from(link.source_table).update({media:updated,updated_at:new Date().toISOString()}).eq("id",link.source_id);
                          if(updateError)throw updateError;
                        }
                        const {error:unlinkError}=await supabaseClient.from("media_links").delete().eq("id",link.id);
                        if(unlinkError)throw unlinkError;
                        row.remove();say("Detached from "+labels[link.source_table]+": "+recordTitle+".",false,tileStatus);
                        if(!attachmentArea.querySelector("button")){
                          attachmentArea.replaceChildren();say("All attachments removed. Click Delete File again to permanently delete this file.",false,tileStatus);
                        }
                      }catch(e){say("Detach failed: "+(e.message||"Unknown error"),true,tileStatus);detach.disabled=false;}
                    });
                    row.append(info,detach);attachmentArea.append(row);
                  }
                  return;
                }
                if(!confirm("Permanently delete this media file? This cannot be undone."))return;
                const {error:storageError}=await supabaseClient.storage.from(asset.storage_bucket||"content-files").remove([asset.storage_path]);if(storageError)throw storageError;
                const {error}=await supabaseClient.from("media_assets").delete().eq("id",asset.id);if(error)throw error;
                assets=assets.filter(x=>x.id!==asset.id);draw();say("Media file permanently deleted.");
              }catch(e){say("Delete failed: "+(e.message||"Unknown error"),true,tileStatus);}
              finally{del.disabled=false;}
            });
            actions.append(save,del);tile.append(preview,titleEn.wrap,titleBn.wrap,descEn.wrap,descBn.wrap,tagsEn.wrap,tagsBn.wrap,altEn.wrap,altBn.wrap,filename,linkInfo,attachmentArea,actions,tileStatus);list.append(tile);
          }
          visibleAssetCount+=nextAssets.length;
          loadMoreButton.hidden=visibleAssetCount>=filteredAssets.length;
          loadMoreButton.textContent="Load more ("+(filteredAssets.length-visibleAssetCount)+")";
        }
        search.addEventListener("input",()=>draw(true));
        await load();
      }
  
      async function renderDashboardSection(section, content, renderToken, isCurrent) {
        const user = await getCurrentUser();
        if (!user || String(user.app_metadata?.role || "").toLowerCase() !== "admin") {
          renderPage("Profile"); history.replaceState(null, "", "#profile"); return;
        }
        if (!isCurrent()) return;
        if (section.id === "media-library") {
          await renderMediaLibrarySection(content, user, isCurrent);
          return;
        }
        if (section.id === "user") {
          content.replaceChildren();
          const wrap = document.createElement("div");
          wrap.className = "dashboard-crud";
          const card = document.createElement("section");
          card.className = "dashboard-crud-card";
          const title = document.createElement("h3");
          title.textContent = "Account Management";
          const hint = document.createElement("p");
          hint.className = "dashboard-crud-hint";
          hint.textContent = "The Super Admin account is permanently protected in website account management. Only the Super Admin can grant or remove administrator access. Project owners may still control the underlying Supabase project.";
          const isSuperAdminCaller = user.id === "c5b6d47e-3e78-4d4e-bc15-6f137a8c1e75";
          const status = document.createElement("p");
          status.className = "dashboard-crud-status";
          status.setAttribute("role", "status");
          status.setAttribute("aria-live", "polite");
          const form = document.createElement("form");
          form.className = "dashboard-crud-form";
          form.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:16px 0";
          const email = document.createElement("input");
          email.type = "email"; email.required = true; email.autocomplete = "email";
          email.placeholder = "Email address"; email.setAttribute("aria-label", "New account email");
          const password = document.createElement("input");
          password.type = "password"; password.required = true; password.minLength = 12;
          password.autocomplete = "new-password"; password.placeholder = "Password (12+ characters)";
          password.setAttribute("aria-label", "New account password");
          const adminLabel = document.createElement("label");
          adminLabel.style.cssText = "display:flex;align-items:center;gap:8px;min-height:42px";
          const adminCheck = document.createElement("input");
          adminCheck.type = "checkbox"; adminCheck.style.cssText = "width:auto;min-height:auto";
          const adminText = document.createElement("span"); adminText.textContent = "Make administrator";
          adminLabel.append(adminCheck, adminText);
          if (!isSuperAdminCaller) { adminCheck.disabled = true; adminText.textContent = "Only Super Admin can create administrators"; }
          const create = document.createElement("button");
          create.type = "submit"; create.className = "action-button primary"; create.textContent = "Create account";
          form.append(email, password, adminLabel, create, status);
          const list = document.createElement("div");
          list.className = "dashboard-crud-list";
          card.append(title, hint, form, list); wrap.append(card); content.append(wrap);
  
          function setUserStatus(message, isError = false) {
            status.textContent = message;
            status.style.color = isError ? "#a12622" : "#176b43";
          }
          async function callUserAdmin(action, values = {}) {
            const { data, error } = await supabaseClient.functions.invoke("admin-user-management", {
              body: { action, ...values }
            });
            if (error) {
              let detail = error.message || "Request failed.";
              try {
                const context = error.context;
                if (context && typeof context.json === "function") {
                  const payload = await context.json();
                  if (payload && payload.error) detail = payload.error;
                }
              } catch (_) {}
              throw new Error(detail);
            }
            if (data && data.error) throw new Error(data.error);
            return data;
          }
          async function loadAuthUsers() {
            list.replaceChildren();
            const loading = document.createElement("p");
            loading.className = "dashboard-crud-empty"; loading.textContent = "Loading accounts…"; list.append(loading);
            try {
              const result = await callUserAdmin("list_users");
              if (!isCurrent()) return;
              list.replaceChildren();
              const users = Array.isArray(result.users) ? result.users : [];
              if (!users.length) {
                const empty = document.createElement("p"); empty.className = "dashboard-crud-empty";
                empty.textContent = "No accounts found."; list.append(empty); return;
              }
              const table = document.createElement("table"); table.className = "dashboard-crud-table";
              const thead = document.createElement("thead"), headRow = document.createElement("tr");
              ["Email", "Role", "Created", "Last sign-in", "Actions"].forEach((label) => {
                const th = document.createElement("th"); th.textContent = label; headRow.append(th);
              });
              thead.append(headRow); table.append(thead);
              const tbody = document.createElement("tbody");
              for (const account of users) {
                const row = document.createElement("tr");
                const emailCell = document.createElement("td"); emailCell.textContent = account.email || "(no email)";
                const roleCell = document.createElement("td"); roleCell.textContent = account.is_super_admin || account.role === "super_admin" ? "SUPER ADMIN · PROTECTED" : account.role === "admin" ? "ADMIN" : "MEMBER";
                const createdCell = document.createElement("td"); createdCell.textContent = account.created_at ? new Date(account.created_at).toLocaleString() : "—";
                const signInCell = document.createElement("td"); signInCell.textContent = account.last_sign_in_at ? new Date(account.last_sign_in_at).toLocaleString() : "Never";
                const actions = document.createElement("td");
                const isSelf = account.id === user.id;
                const isProtectedSuperAdmin = account.is_super_admin === true || account.id === "c5b6d47e-3e78-4d4e-bc15-6f137a8c1e75";
                const roleButton = document.createElement("button");
                roleButton.type = "button"; roleButton.className = "action-button";
                roleButton.textContent = isProtectedSuperAdmin ? "Protected" : account.role === "admin" ? "Remove admin" : "Make admin";
                roleButton.disabled = isProtectedSuperAdmin || !isSuperAdminCaller;
                roleButton.addEventListener("click", async () => {
                  const makeAdmin = account.role !== "admin";
                  if (!confirm((makeAdmin ? "Grant administrator access to " : "Remove administrator access from ") + (account.email || "this account") + "?")) return;
                  roleButton.disabled = true;
                  try {
                    await callUserAdmin("set_admin", { user_id: account.id, admin: makeAdmin });
                    setUserStatus("Account role updated. The affected account may need to sign in again to refresh its session.");
                    await loadAuthUsers();
                  } catch (error) {
                    setUserStatus(error.message || "Could not update account role.", true); roleButton.disabled = false;
                  }
                });
                if (isProtectedSuperAdmin) {
                  actions.append(roleButton);
                } else {
                  const deleteButton = document.createElement("button");
                  deleteButton.type = "button"; deleteButton.className = "action-button";
                  deleteButton.textContent = "Delete"; deleteButton.style.marginLeft = "6px";
                  deleteButton.disabled = isSelf;
                  deleteButton.addEventListener("click", async () => {
                    if (!confirm("Permanently delete the account " + (account.email || "") + "? This cannot be undone.")) return;
                    deleteButton.disabled = true; roleButton.disabled = true;
                    try {
                      await callUserAdmin("delete_user", { user_id: account.id });
                      setUserStatus("Account deleted."); await loadAuthUsers();
                    } catch (error) {
                      setUserStatus(error.message || "Could not delete account.", true);
                      deleteButton.disabled = false; roleButton.disabled = false;
                    }
                  });
                  actions.append(roleButton, deleteButton);
                }
                row.append(emailCell, roleCell, createdCell, signInCell, actions); tbody.append(row);
              }
              table.append(tbody); list.append(table);
            } catch (error) {
              if (!isCurrent()) return;
              list.replaceChildren();
              const message = document.createElement("p"); message.className = "dashboard-crud-empty";
              message.textContent = "Could not load accounts: " + (error.message || "Request failed."); list.append(message);
              setUserStatus(error.message || "Could not load accounts.", true);
            }
          }
          form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (password.value.length < 12) { setUserStatus("Password must be at least 12 characters.", true); password.focus(); return; }
            create.disabled = true;
            try {
              await callUserAdmin("create_user", { email: email.value.trim(), password: password.value, admin: adminCheck.checked });
              form.reset();
              setUserStatus("Account created successfully.");
              await loadAuthUsers();
            } catch (error) {
              setUserStatus(error.message || "Could not create account.", true);
            } finally {
              create.disabled = false;
            }
          });
          await loadAuthUsers();
          return;
        }
  
        if(section.id==="widget"){
          content.replaceChildren();
          const wrap=document.createElement("div");wrap.className="dashboard-crud";wrap.style.cssText="display:grid;gap:18px;width:100%";
          const headingCard=document.createElement("section");headingCard.className="dashboard-crud-card";
          const title=document.createElement("h3");title.textContent="Homepage Widgets";
          const hint=document.createElement("p");hint.className="dashboard-crud-hint";hint.textContent="Manage each widget independently. Choose its visibility and adjust map settings, then save that widget's card.";
          const status=document.createElement("p");status.className="dashboard-crud-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
          const list=document.createElement("div");list.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px;align-items:start;width:100%";
          headingCard.append(title,hint,status);wrap.append(headingCard,list);content.append(wrap);
          async function loadWidgets(){
            list.replaceChildren();
            const loading=document.createElement("p");loading.className="dashboard-crud-empty";loading.textContent="Loading widgets…";list.append(loading);
            const {data,error}=await supabaseClient.from("widgets").select("id,widget_type,title,title_bn,title_en,is_visible,settings").order("created_at",{ascending:true});
            if(!isCurrent())return;
            if(error){list.replaceChildren();const msg=document.createElement("p");msg.className="dashboard-crud-empty";msg.textContent="Could not load widgets: "+error.message;list.append(msg);status.textContent="Load failed.";status.style.color="#a12622";return;}
            list.replaceChildren();
            if(!Array.isArray(data)||!data.length){const empty=document.createElement("p");empty.className="dashboard-crud-empty";empty.textContent="No widgets found.";list.append(empty);return;}
            for(const item of data){
              const settings=item.settings&&typeof item.settings==="object"?item.settings:{};
              const widgetCard=document.createElement("section");widgetCard.className="dashboard-crud-card";widgetCard.style.cssText="display:grid;gap:14px;align-content:start;min-width:0";
              const cardHeader=document.createElement("div");cardHeader.style.cssText="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:var(--dg-border-width) var(--dg-border-style) var(--dg-border)";
              const titleGroup=document.createElement("div");titleGroup.style.cssText="display:grid;gap:4px;min-width:0";
              const name=document.createElement("h3");name.textContent=localizedRecordValue(item,"title")||item.title||"Widget";name.dataset.userContent="true";name.style.cssText="margin:0;font-size:17px;overflow-wrap:anywhere";
              const type=document.createElement("p");type.textContent=item.widget_type==="datetime"?"Date & Time":item.widget_type==="map"?"Map":String(item.widget_type||"Widget");type.style.cssText="margin:0;color:#6b7280;font-size:12px";
              titleGroup.append(name,type);
              const badge=document.createElement("span");badge.textContent=item.is_visible?"Visible":"Hidden";badge.style.cssText="flex:0 0 auto;padding:4px 8px;border:1px solid "+(item.is_visible?"#bbf7d0":"#e5e7eb")+";border-radius:999px;background:"+(item.is_visible?"#f0fdf4":"#f9fafb")+";color:"+(item.is_visible?"#166534":"#4b5563")+";font-size:12px;font-weight:var(--dg-font-weight-semibold)";
              cardHeader.append(titleGroup,badge);widgetCard.append(cardHeader);
              let locationInput=null,zoomInput=null,zoomValue=null;
              const titleBnField=document.createElement("div");titleBnField.className="dashboard-crud-field";
              const titleBnLabel=document.createElement("label");titleBnLabel.textContent="Widget Title (Bengali)";
              const titleBnInput=document.createElement("input");titleBnInput.type="text";titleBnInput.className="dashboard-crud-input";titleBnInput.value=String(item.title_bn||"");titleBnInput.maxLength=120;titleBnLabel.htmlFor="widget-title-bn-"+item.id;titleBnInput.id=titleBnLabel.htmlFor;titleBnField.append(titleBnLabel,titleBnInput);
              const titleEnField=document.createElement("div");titleEnField.className="dashboard-crud-field";
              const titleEnLabel=document.createElement("label");titleEnLabel.textContent="Widget Title (English)";
              const titleEnInput=document.createElement("input");titleEnInput.type="text";titleEnInput.className="dashboard-crud-input";titleEnInput.value=String(item.title_en||"");titleEnInput.maxLength=120;titleEnLabel.htmlFor="widget-title-en-"+item.id;titleEnInput.id=titleEnLabel.htmlFor;titleEnField.append(titleEnLabel,titleEnInput);
              widgetCard.append(titleBnField,titleEnField);
              if(item.widget_type==="map"){
                const locationField=document.createElement("div");locationField.className="dashboard-crud-field";
                const locationLabel=document.createElement("label");locationLabel.textContent="Location";locationLabel.style.cssText="color:#444;font-size:var(--dg-font-size-sm);font-weight:var(--dg-font-weight-semibold)";
                locationInput=document.createElement("input");locationInput.type="text";locationInput.className="dashboard-crud-input";locationInput.value=String(settings.location||"");locationInput.placeholder="Address, place name, or Google Maps link";locationInput.setAttribute("aria-label","Map location for "+(item.title||"Map"));
                locationField.append(locationLabel,locationInput);widgetCard.append(locationField);
                const zoomField=document.createElement("div");zoomField.className="dashboard-crud-field";zoomField.style.cssText="display:grid;gap:8px";
                const zoomHeader=document.createElement("div");zoomHeader.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:8px";
                const zoomLabel=document.createElement("label");zoomLabel.textContent="Default Zoom";zoomLabel.style.cssText="color:#444;font-size:var(--dg-font-size-sm);font-weight:var(--dg-font-weight-semibold)";
                const savedZoom=Number(settings.zoom);const initialZoom=Number.isFinite(savedZoom)?Math.max(1,Math.min(21,Math.round(savedZoom))):13;
                zoomValue=document.createElement("output");zoomValue.value=String(initialZoom);zoomValue.textContent=String(initialZoom);zoomValue.style.cssText="font-size:var(--dg-font-size-sm);font-weight:700;color:#374151";
                zoomHeader.append(zoomLabel,zoomValue);
                zoomInput=document.createElement("input");zoomInput.type="range";zoomInput.min="1";zoomInput.max="21";zoomInput.step="1";zoomInput.value=String(initialZoom);zoomInput.setAttribute("aria-label","Default map zoom for "+(item.title||"Map"));zoomInput.style.cssText="display:block;width:100%;min-height:26px;accent-color:#374151;cursor:pointer";
                zoomInput.addEventListener("input",()=>{zoomValue.value=zoomInput.value;zoomValue.textContent=zoomInput.value;});
                const zoomHelp=document.createElement("p");zoomHelp.textContent="Lower values show a wider area; higher values zoom in.";zoomHelp.style.cssText="margin:0;color:#6b7280;font-size:12px;line-height:1.45";
                zoomField.append(zoomHeader,zoomInput,zoomHelp);widgetCard.append(zoomField);
              }
              const visibilityField=document.createElement("div");visibilityField.className="dashboard-crud-field";
              const visibilityLabel=document.createElement("label");visibilityLabel.textContent="Homepage Visibility";visibilityLabel.style.cssText="color:#444;font-size:var(--dg-font-size-sm);font-weight:var(--dg-font-weight-semibold)";
              const select=document.createElement("select");select.className="dashboard-crud-input";select.style.minWidth="0";
              [["true","Show on homepage"],["false","Hide from homepage"]].forEach(([value,label])=>{const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option);});
              select.value=String(Boolean(item.is_visible));select.setAttribute("aria-label","Visibility for "+(item.title||"Widget"));
              select.addEventListener("change",()=>{badge.textContent=select.value==="true"?"Visible":"Hidden";badge.style.background=select.value==="true"?"#f0fdf4":"#f9fafb";badge.style.borderColor=select.value==="true"?"#bbf7d0":"#e5e7eb";badge.style.color=select.value==="true"?"#166534":"#4b5563";});
              visibilityField.append(visibilityLabel,select);widgetCard.append(visibilityField);
              const cardStatus=document.createElement("p");cardStatus.className="dashboard-crud-status";cardStatus.style.cssText="margin:0;min-height:18px";cardStatus.setAttribute("role","status");cardStatus.setAttribute("aria-live","polite");
              const actions=document.createElement("div");actions.className="dashboard-crud-actions";actions.style.cssText="margin-top:0";
              const saveButton=document.createElement("button");saveButton.type="button";saveButton.className="action-button primary";saveButton.textContent="Save Widget";
              saveButton.addEventListener("click",async()=>{
                saveButton.disabled=true;cardStatus.textContent="Saving widget settings…";cardStatus.style.color="#6b7280";
                try{
                  const current=await getCurrentUser();if(!current)throw new Error("Your admin session has expired. Please sign in again.");
                  const titleBn=titleBnInput.value.trim(),titleEn=titleEnInput.value.trim();
                  if(!titleBn||!titleEn)throw new Error("Enter the widget title in both Bengali and English.");
                  const update={is_visible:select.value==="true",title_bn:titleBn||null,title_en:titleEn||null,title:(getUiLanguage()==="en"?(titleEn||titleBn):(titleBn||titleEn)),updated_by:current.id,updated_at:new Date().toISOString()};
                  if(item.widget_type==="map"){
                    const location=String(locationInput&&locationInput.value||"").trim();
                    if(!location)throw new Error("Enter the address, place name, or Google Maps link.");
                    const previousSettings=item.settings&&typeof item.settings==="object"?item.settings:{};
                    const zoom=zoomInput?Number(zoomInput.value):13;
                    const coordinateInput=/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.test(location);
                    let embedUrl="https://maps.google.com/maps?q="+encodeURIComponent(location)+"&z="+zoom+"&output=embed";
                    let resolvedLocation=location;
                    let mapsLink=false;
                    try{
                      const parsedLocationUrl=new URL(location);const host=parsedLocationUrl.hostname.toLowerCase();
                      mapsLink=parsedLocationUrl.protocol==="https:"&&(host==="maps.app.goo.gl"||host==="goo.gl"||((host==="google.com"||host==="www.google.com"||host==="maps.google.com")&&parsedLocationUrl.pathname.startsWith("/maps")));
                    }catch(_){}
                    if(mapsLink){
                      const {data:resolved,error:resolveError}=await supabaseClient.functions.invoke("resolve-map-link",{body:{url:location}});
                      if(resolveError){let msg="";try{const response=resolveError.context;if(response&&typeof response.json==="function"){const details=await response.json();msg=String(details&&details.error||"");}}catch(_){}throw new Error(msg||resolveError.message||"Could not resolve this Google Maps link. Try sharing the place link again.");}
                      if(!resolved||!resolved.embed_url)throw new Error((resolved&&resolved.error)||"Could not identify a place from this Google Maps link.");
                      if(resolved.exact_coordinates!==true)throw new Error("Exact pin coordinates were not found. Share the exact pin from Google Maps or enter its latitude,longitude coordinates.");
                      embedUrl=resolved.embed_url;resolvedLocation=resolved.location||location;
                    }
                    try{const parsedEmbed=new URL(embedUrl);if(["maps.google.com","www.google.com"].includes(parsedEmbed.hostname))parsedEmbed.searchParams.set("z",String(zoom));embedUrl=parsedEmbed.toString();}catch(_){}
                    update.settings={...previousSettings,location,zoom,embed_url:embedUrl,resolved_location:resolvedLocation};
                  }
                  const {error:updateError}=await supabaseClient.from("widgets").update(update).eq("id",item.id);
                  if(updateError)throw updateError;
                  cardStatus.textContent="Widget settings saved.";cardStatus.style.color="#176b43";
                  await loadWidgets();
                }catch(err){cardStatus.textContent="Save failed: "+(err.message||"Unknown error");cardStatus.style.color="#a12622";saveButton.disabled=false;}
              });
              actions.append(saveButton);widgetCard.append(actions,cardStatus);list.append(widgetCard);
            }
          }
          await loadWidgets();
          return;
        }
  
        const configs = {
          hero:{table:"hero_items",label:"Hero",fields:[
            {name:"title_bn",label:"Title (Bengali)",type:"text",required:true},
            {name:"title_en",label:"Title (English)",type:"text",required:true},
            {name:"description_bn",label:"Description (Bengali)",type:"textarea",full:true},
            {name:"description_en",label:"Description (English)",type:"textarea",full:true},
            {name:"url",label:"URL",type:"text"},
            {name:"media",label:"Content Files (Image, Video, Other)",type:"files",full:true,accept:"image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,application/pdf"},
            {name:"visibility",label:"Visibility",type:"select",required:true,options:[["public","Public"],["private","Private"]]}
          ]},
          post:{table:"post",label:"Posts",fields:[
            {name:"title_bn",label:"Title (Bengali)",type:"text",required:true},
            {name:"title_en",label:"Title (English)",type:"text",required:true},
            {name:"description_bn",label:"Description (Bengali)",type:"textarea",full:true},
            {name:"description_en",label:"Description (English)",type:"textarea",full:true},
            {name:"content_bn",label:"Content (HTML — Bengali)",type:"textarea",rows:10,full:true},
            {name:"content_en",label:"Content (HTML — English)",type:"textarea",rows:10,full:true},
            {name:"url",label:"URL",type:"text",required:true,help:"A unique URL slug. Generated from either title; you can edit it."},
            {name:"media",label:"Content Files (Image, Video, Other)",type:"files",full:true,accept:"image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,application/pdf"},
            {name:"custom_url",label:"Custom Url",type:"url",full:true,help:"Use a file hosted on another server as the content."},
            {name:"album_id",label:"Album",type:"select",options:[["","No album"]]},
            {name:"visibility",label:"Visibility",type:"select",required:true,options:[["public","Public"],["private","Private"]]}
          ]},
          page:{table:"pages",label:"Custom Page",fields:[
            {name:"title_bn",label:"Page Title (Bengali)",type:"text",required:true},
            {name:"title_en",label:"Page Title (English)",type:"text",required:true},
            {name:"description_bn",label:"Description (Bengali)",type:"textarea",full:true},
            {name:"description_en",label:"Description (English)",type:"textarea",full:true},
            {name:"url",label:"URL",type:"text",required:true,help:"A unique URL slug. Use English letters, numbers, and hyphens; you can edit it."},
            {name:"content_bn",label:"HTML Content (Bengali)",type:"textarea",rows:14,full:true,help:"Write Bengali page content using safe HTML. The public page sanitizes unsafe markup."},
            {name:"content_en",label:"HTML Content (English)",type:"textarea",rows:14,full:true,help:"Write English page content using safe HTML. The public page sanitizes unsafe markup."},
            {name:"media",label:"Content Files (Image, Video, Other)",type:"files",full:true,accept:"image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,application/pdf"},
            {name:"visibility",label:"Visibility",type:"select",required:true,options:[["public","Public"],["private","Private"]]}
          ]},
          album:{table:"albums",label:"Albums",fields:[
            {name:"title_bn",label:"Album Title (Bengali)",type:"text",required:true},
            {name:"title_en",label:"Album Title (English)",type:"text",required:true},
            {name:"description_bn",label:"Description (Bengali)",type:"textarea",full:true},
            {name:"description_en",label:"Description (English)",type:"textarea",full:true},
            {name:"url",label:"URL",type:"text",required:true,help:"A unique URL slug. Generated from either title; you can edit it."},
            {name:"media",label:"Content Files (Image, Video, Other)",type:"files",full:true,accept:"image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,application/pdf"},
            {name:"visibility",label:"Visibility",type:"select",required:true,options:[["public","Public"],["private","Private"]]}
          ]},
          role:{table:"roles",label:"Roles",fields:[
            {name:"name",label:"Role name",type:"text",required:true},
            {name:"description",label:"Description",type:"textarea",full:true},
            {name:"permissions",label:"Permissions",type:"multiselect",options:[],full:true}
          ]},
          customization:{table:"site_customizations",label:"Customizations",fields:[]},
          settings:{table:"site_settings",label:"Settings",fields:[
            {name:"key",label:"Setting key",type:"text",required:true},
            {name:"value",label:"Value (JSON)",type:"textarea",required:true,full:true},
            {name:"description",label:"Description",type:"textarea",full:true}
          ]},
          user:{table:"profiles",label:"User profiles",readOnlyCreate:true,noDelete:true,fields:[
            {name:"id",label:"Auth user ID",type:"text",readonly:true,required:true,full:true},
            {name:"full_name",label:"Full name",type:"text"},
            {name:"phone",label:"Phone",type:"tel"},
            {name:"date_of_birth",label:"Date of birth",type:"date"},
            {name:"bio",label:"Bio",type:"textarea",full:true}
          ]}
        };
        if (section.id === "customization" || section.id === "settings") {
          content.replaceChildren();
          const isCustomization = section.id === "customization";
          const title = document.createElement("h2");
          title.className = "dashboard-section-title";
          title.textContent = isCustomization ? "Customization" : "Settings";
          const intro = document.createElement("p");
          intro.className = "dashboard-section-description";
          intro.textContent = isCustomization
            ? "Change appearance, shared layout, typography, and homepage sections. Save applies changes to the public site."
            : "Configure site identity, homepage behavior, publishing defaults, account creation, privacy, and maintenance.";
          const form = document.createElement("form");
          form.className = "dashboard-crud";
          form.style.marginTop = "18px";
          const status = document.createElement("p");
          status.className = "dashboard-crud-status";
          status.setAttribute("role", "status");
          const save = document.createElement("button");
          save.type = "submit";
          save.className = "action-button primary";
          save.textContent = "Save and Apply";
          const reload = document.createElement("button");
          reload.type = "button";
          reload.className = "action-button";
          reload.textContent = "Reload Saved Values";
          const groupDefs = isCustomization ? [
            {id:"identity",title:"Site Identity",key:"ui_customization_identity",fields:[
              {name:"tagline",label:"Tagline",type:"text",value:""}
            ]},
            {id:"theme",title:"Appearance & Theme",key:"ui_customization_theme",fields:[
              {name:"primary_color",label:"Primary color / buttons / links",type:"color",value:"#222222"},
              {name:"secondary_color",label:"Secondary color",type:"color",value:"#5b6472"},
              {name:"background_color",label:"Page background",type:"color",value:"#ffffff"},
              {name:"surface_color",label:"Cards, forms and surfaces",type:"color",value:"#ffffff"},
              {name:"text_color",label:"Main text color",type:"color",value:"#222222"},
              {name:"muted_text_color",label:"Secondary text color",type:"color",value:"#666666"},
              {name:"border_color",label:"Borders and dividers",type:"color",value:"#e5e7eb"},
              {name:"link_color",label:"Link color",type:"color",value:"#222222"},
              {name:"success_color",label:"Success color",type:"color",value:"#16794b"},
              {name:"warning_color",label:"Warning color",type:"color",value:"#a15c00"},
              {name:"error_color",label:"Error color",type:"color",value:"#b42318"},
              {name:"card_radius",label:"Card corner radius (px)",type:"number",value:14,min:0,max:32},
              {name:"control_radius",label:"Button and input corner radius (px)",type:"number",value:9,min:0,max:24},
              {name:"shadow_strength",label:"Shadow strength (%)",type:"number",value:6,min:0,max:30}
            ]},
            {id:"header_footer",title:"Header & Footer",key:"ui_customization_header_footer",fields:[
              {name:"show_header",label:"Show site header",type:"checkbox",value:true},
              {name:"header_sticky",label:"Keep header sticky while scrolling",type:"checkbox",value:true},
              {name:"show_footer",label:"Show site footer",type:"checkbox",value:true},
              {name:"header_height",label:"Header height (px)",type:"number",value:64,min:44,max:120},
              {name:"menu_gap",label:"Menu item gap (px)",type:"number",value:8,min:0,max:32},
              {name:"footer_text",label:"Footer text",type:"text",value:"© 2026 Dalimgari. All rights reserved."}
            ]},
            {id:"layout",title:"Homepage Layout & Section Visibility",key:"ui_customization_layout",fields:[
              {name:"show_hero",label:"Show Hero section",type:"checkbox",value:true},
              {name:"show_widget",label:"Show Widget section",type:"checkbox",value:true},
              {name:"show_album",label:"Show Album section",type:"checkbox",value:true},
              {name:"show_page_card",label:"Show Page Section",type:"checkbox",value:true},
              {name:"section_gap",label:"Homepage section spacing (px)",type:"number",value:24,min:0,max:64},
              {name:"card_gap",label:"Card spacing (px)",type:"number",value:16,min:0,max:48},
              {name:"section_order",label:"Homepage section order",type:"order",full:true,value:'["hero","page_pills","album","widget","page_card"]'}
            ]},
            {id:"typography",title:"Typography",key:"ui_customization_typography",fields:[
              {name:"font_family",label:"Font family",type:"select",value:"system",options:[["system","System default"],["Arial, sans-serif","Arial"],["Georgia, serif","Georgia"],["Verdana, sans-serif","Verdana"],["Tahoma, sans-serif","Tahoma"]]},
              {name:"base_font_size",label:"Base font size (px)",type:"number",value:16,min:12,max:22},
              {name:"line_height",label:"Text line height",type:"number",value:1.5,min:1.2,max:2.2,step:0.1}
            ]},
            {id:"responsive",title:"Responsive Layout",key:"ui_customization_responsive",fields:[
              {name:"content_width",label:"Maximum content width (px)",type:"number",value:1200,min:640,max:1800},
              {name:"mobile_padding",label:"Mobile side padding (px)",type:"number",value:16,min:8,max:32}
            ]},
            {id:"components",title:"Cards, Buttons & Forms",key:"ui_customization_components",fields:[
              {name:"card_padding",label:"Card inner spacing (px)",type:"number",value:16,min:0,max:40},
              {name:"button_height",label:"Button height (px)",type:"number",value:40,min:32,max:64},
              {name:"input_height",label:"Input height (px)",type:"number",value:42,min:32,max:64}
            ]},
            {id:"media",title:"Images & Media",key:"ui_customization_media",fields:[
              {name:"image_radius",label:"Image corner radius (px)",type:"number",value:8,min:0,max:32},
              {name:"gallery_columns",label:"Gallery columns (1–6)",type:"number",value:3,min:1,max:6},
              {name:"image_fit",label:"Image fit",type:"select",value:"cover",options:[["cover","Cover"],["contain","Contain"]]}
            ]},
            {id:"page_style",title:"Page Styling",key:"ui_customization_page_style",fields:[
              {name:"page_content_width",label:"Custom page content width (px)",type:"number",value:1200,min:640,max:1800},
              {name:"page_title_size",label:"Page title size (px)",type:"number",value:32,min:20,max:56},
              {name:"paragraph_spacing",label:"Paragraph spacing (px)",type:"number",value:12,min:0,max:48}
            ]},
            {id:"effects",title:"Effects & Animation",key:"ui_customization_effects",fields:[
              {name:"transition_speed",label:"Transition speed (ms)",type:"number",value:180,min:0,max:600},
              {name:"animations_enabled",label:"Enable UI animations",type:"checkbox",value:true}
            ]},
            {id:"hero",title:"Hero Section",key:"ui_customization_hero",fields:[
              {name:"desktop_height",label:"Desktop height (px, 0 = 16:9 auto)",type:"number",value:0,min:0,max:900},
              {name:"mobile_height",label:"Mobile height (px, 0 = 16:9 auto)",type:"number",value:0,min:0,max:700},
              {name:"border_radius",label:"Hero corner radius (px)",type:"number",value:20,min:0,max:48},
              {name:"heading_width",label:"Heading maximum width (px)",type:"number",value:900,min:320,max:1200},
              {name:"description_width",label:"Description maximum width (px)",type:"number",value:760,min:280,max:1200},
              {name:"text_align",label:"Text alignment",type:"select",value:"center",options:[["left","Left"],["center","Center"],["right","Right"]]},
              {name:"vertical_align",label:"Vertical text position",type:"select",value:"center",options:[["top","Top"],["center","Center"],["bottom","Bottom"]]},
              {name:"image_fit",label:"Hero image fit",type:"select",value:"cover",options:[["cover","Cover"],["contain","Contain"]]},
              {name:"image_position",label:"Hero image position",type:"select",value:"center",options:[["center","Center"],["top","Top"],["bottom","Bottom"],["left","Left"],["right","Right"]]},
              {name:"overlay_color",label:"Image overlay color",type:"color",value:"#0f172a"},
              {name:"overlay_opacity",label:"Overlay opacity (%)",type:"number",value:48,min:0,max:90},
              {name:"overlay_enabled",label:"Enable image overlay",type:"checkbox",value:true},
              {name:"text_color",label:"Hero text color (fallback)",type:"color",value:"#ffffff"},
              {name:"heading_color",label:"Hero heading color",type:"color",value:"#ffffff"},
              {name:"description_color",label:"Hero description color",type:"color",value:"#ffffff"},
              {name:"tagline_color",label:"Hero tagline color",type:"color",value:"#ffffff"},
              {name:"show_tagline",label:"Show site tagline in Hero",type:"checkbox",value:true}
            ]}
          ] : [
            {id:"general",title:"General",key:"ui_settings_general",fields:[
              {name:"site_title",label:"Site title (English)",type:"text",value:"Dalimgari"},
              {name:"site_title_bn",label:"Site title (Bengali)",type:"text",value:"ডালিমগাড়ী"},
              {name:"site_description",label:"Site description",type:"textarea",value:""},
              {name:"favicon_data_url",label:"Favicon data",type:"hidden",value:""},
              {name:"favicon_history",label:"Favicon history",type:"hidden",value:"[]"}
            ]},
            {id:"homepage_defaults",title:"Homepage Defaults",key:"ui_settings_homepage_defaults",fields:[
              {name:"default_home_route",label:"Default route",type:"select",value:"home",options:[["home","Home"],["login","Login"]]},
              {name:"show_empty_sections",label:"Show empty homepage sections",type:"checkbox",value:false}
            ]},
            {id:"content_defaults",title:"Content Defaults",key:"ui_settings_content_defaults",fields:[
              {name:"default_visibility",label:"Default post visibility",type:"select",value:"public",options:[["public","Public"],["private","Private"]]},
              {name:"default_page_visibility",label:"Default page visibility",type:"select",value:"public",options:[["public","Public"],["private","Private"]]}
            ]},
            {id:"users_access",title:"Users & Access",key:"ui_settings_users_access",fields:[
              {name:"allow_account_creation",label:"Allow new account creation",type:"checkbox",value:true}
            ]},
            {id:"privacy_visibility",title:"Privacy & Visibility",key:"ui_settings_privacy_visibility",fields:[
              {name:"hide_private_content",label:"Keep private content hidden from public visitors (enforced)",type:"checkbox",value:true,disabled:true},
              {name:"default_album_visibility",label:"Default album visibility",type:"select",value:"public",options:[["public","Public"],["private","Private"]]}
            ]},
            {id:"maintenance_features",title:"Maintenance & Features",key:"ui_settings_maintenance_features",fields:[
              {name:"maintenance_mode",label:"Enable maintenance mode for public visitors",type:"checkbox",value:false},
              {name:"enable_homepage_media",label:"Enable homepage media sections",type:"checkbox",value:true}
            ]}
          ];
          const inputMap = new Map();
          let availablePresets = {};
          const presetCard = document.createElement("section");
          presetCard.className = "dashboard-crud-card";
          const presetHeading = document.createElement("h3");
          presetHeading.textContent = "Theme Presets";
          const presetDescription = document.createElement("p");
          presetDescription.textContent = "Apply a saved set of appearance, layout, media, effects, and Hero settings.";
          presetDescription.className = "dashboard-section-description";
          const presetControls = document.createElement("div");
          presetControls.className = "dashboard-crud-actions";
          const presetSelect = document.createElement("select");
          presetSelect.className = "dashboard-crud-input";
          presetSelect.setAttribute("aria-label", "Select theme preset");
          presetSelect.disabled = true;
          const loadingOption = document.createElement("option");
          loadingOption.value = "";
          loadingOption.textContent = "Loading saved presets…";
          presetSelect.append(loadingOption);
          const presetApply = document.createElement("button");
          presetApply.type = "button";
          presetApply.className = "action-button primary";
          presetApply.textContent = "Apply Preset";
          const presetStatus = document.createElement("p");
          presetStatus.className = "dashboard-crud-status";
          presetStatus.setAttribute("role", "status");
          presetControls.append(presetSelect, presetApply);
          presetCard.append(presetHeading, presetDescription, presetControls, presetStatus);
          if(isCustomization)form.append(presetCard);
          async function loadPresets(preferredName="") {
            const previousName=preferredName||presetSelect.value;
            presetSelect.disabled = true;
            presetApply.disabled = true;
            presetStatus.textContent = "Loading saved presets…";
            presetStatus.style.color = "";
            try {
              const {data,error}=await supabaseClient.from("site_customizations").select("value").eq("key","ui_customization_presets").maybeSingle();
              if(error)throw error;
              let stored=data?.value||{};
              if(typeof stored==="string"){try{stored=JSON.parse(stored)}catch(_){stored={}}}
              availablePresets=stored&&typeof stored==="object"&&!Array.isArray(stored)?stored:{};
              const names=Object.keys(availablePresets).filter(name=>name.trim()).sort((a,b)=>a.localeCompare(b));
              presetSelect.replaceChildren();
              if(!names.length){
                const option=document.createElement("option");option.value="";option.textContent="No saved presets";presetSelect.append(option);
                presetSelect.disabled = true;
                presetApply.disabled = true;
                presetStatus.textContent = "No saved presets were returned by the database.";
                return;
              }
              names.forEach(name=>{const option=document.createElement("option");option.value=name;option.textContent=name;presetSelect.append(option)});
              presetSelect.value=names.includes(previousName)?previousName:names[0];
              presetSelect.disabled = false;
              presetApply.disabled = false;
              presetStatus.textContent = names.length + " saved presets available.";
            } catch(error) {
              availablePresets = {};
              presetSelect.replaceChildren();
              const option=document.createElement("option");option.value="";option.textContent="Presets could not be loaded";presetSelect.append(option);
              presetSelect.disabled = true;
              presetApply.disabled = true;
              presetStatus.textContent = "Could not load theme presets: " + (error?.message || "Unknown database error") + ". Use Reload Saved Values to retry.";
              presetStatus.style.color = "#a12622";
              throw error;
            }
          }
          presetApply.addEventListener("click",async()=>{
            const name=presetSelect.value;
            const preset=availablePresets[name];
            if(!preset||!preset.settings){presetStatus.textContent="Preset data is missing or invalid.";presetStatus.style.color="#a12622";return}
            presetApply.disabled=true;save.disabled=true;reload.disabled=true;presetStatus.textContent="Applying "+name+"…";presetStatus.style.color="";
            try{
              const user=await getCurrentUser();if(!user)throw new Error("Your admin session has expired. Please sign in again.");
              let savedGroups=0;
              for(const group of groupDefs){
                const value=preset.settings[group.key];
                if(!value||typeof value!=="object"||Array.isArray(value))continue;
                const row={key:group.key,value,description:group.title,updated_by:user.id,updated_at:new Date().toISOString()};
                const {error}=await supabaseClient.from("site_customizations").upsert(row,{onConflict:"key"});
                if(error)throw error;
                savedGroups++;
              }
              if(!savedGroups)throw new Error("This preset contains no settings that can be applied.");
              const expectedTheme=preset.settings.ui_customization_theme||{};
              const {data:verifyRow,error:verifyError}=await supabaseClient.from("site_customizations").select("value").eq("key","ui_customization_theme").maybeSingle();
              if(verifyError)throw verifyError;
              let savedTheme=verifyRow?.value||{};
              if(typeof savedTheme==="string"){try{savedTheme=JSON.parse(savedTheme)}catch(_){savedTheme={}}}
              if(expectedTheme.primary_color&&String(savedTheme.primary_color||"").toLowerCase()!==String(expectedTheme.primary_color).toLowerCase()) {
                throw new Error("Preset save verification failed. The theme was not stored; check database permissions and try again.");
              }
              await applyDalimgariSiteConfig(true);
              await loadConfig();
              presetSelect.value=name;
              const livePrimary=getComputedStyle(document.documentElement).getPropertyValue("--dg-primary").trim().toLowerCase();
              if(expectedTheme.primary_color&&livePrimary!==String(expectedTheme.primary_color).toLowerCase()) {
                throw new Error("Settings were saved, but the page theme did not update. Reload the page and try again.");
              }
              presetStatus.textContent='Applied "'+name+'" preset. '+savedGroups+' settings groups saved and verified.';presetStatus.style.color="#176b43";
            }catch(error){presetStatus.textContent="Could not apply preset: "+(error.message||"Unknown error");presetStatus.style.color="#a12622"}
            finally{presetApply.disabled=false;save.disabled=false;reload.disabled=false}
          });
          function makeField(field, group) {
            const wrap = document.createElement("div");
            wrap.className = "dashboard-crud-field" + (field.type === "textarea" ? " full" : "");
            const label = document.createElement("label");
            label.textContent=field.label;
            if(field.type==="order"){
              const hidden=document.createElement("input");hidden.type="hidden";hidden.name=field.name;hidden.value=field.value||"[]";
              inputMap.set(group.id+"."+field.name,hidden);
              label.htmlFor="cfg-"+group.id+"-"+field.name;label.id=label.htmlFor+"-label";
              const control=document.createElement("div");control.className="section-order-control";control.setAttribute("aria-labelledby",label.id);
              const names={hero:"Hero",page_pills:"Page Pill Button",album:"Album",widget:"Widget",page_card:"Page Section"};
              const valid=["hero","page_pills","album","widget","page_card"];
              const normalizeOrder=raw=>{let order=[];try{order=Array.isArray(raw)?raw:JSON.parse(String(raw||"[]"));}catch(_){}if(!Array.isArray(order))order=[];if(!order.includes("page_pills"))return [...valid];order=order.filter(key=>valid.includes(key));return [...new Set(order),...valid.filter(key=>!order.includes(key))];};
              const draw=()=>{control.replaceChildren();const order=normalizeOrder(hidden.value);hidden.value=JSON.stringify(order);order.forEach((key,index)=>{const row=document.createElement("div");row.className="section-order-row";const number=document.createElement("span");number.className="section-order-index";number.textContent=String(index+1);const name=document.createElement("span");name.className="section-order-name";name.textContent=names[key];const moves=document.createElement("div");moves.className="section-order-moves";const up=document.createElement("button");up.type="button";up.className="action-button";up.textContent="↑";up.setAttribute("aria-label","Move "+names[key]+" up");up.disabled=index===0;const down=document.createElement("button");down.type="button";down.className="action-button";down.textContent="↓";down.setAttribute("aria-label","Move "+names[key]+" down");down.disabled=index===order.length-1;up.addEventListener("click",()=>{[order[index-1],order[index]]=[order[index],order[index-1]];hidden.value=JSON.stringify(order);draw();});down.addEventListener("click",()=>{[order[index+1],order[index]]=[order[index],order[index+1]];hidden.value=JSON.stringify(order);draw();});moves.append(up,down);row.append(number,name,moves);control.append(row);});};
              hidden.addEventListener("change",draw);draw();wrap.append(label,hidden,control);return wrap;
            }
            if (field.type === "hidden") {
              const hidden = document.createElement("input");
              hidden.type = "hidden";
              hidden.name = field.name;
              hidden.value = field.value || "";
              inputMap.set(group.id+"."+field.name, hidden);
              return hidden;
            }
            const input = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
            if (field.type !== "textarea") input.type = field.type === "select" ? "text" : field.type;
            if (field.type === "select") {
              const select = document.createElement("select");
              select.className = "dashboard-crud-input";
              (field.options || []).forEach(([value,text])=>{const option=document.createElement("option");option.value=value;option.textContent=text;select.append(option);});
              inputMap.set(group.id+"."+field.name,select);
              select.name=field.name;label.htmlFor="cfg-"+group.id+"-"+field.name;
              select.id=label.htmlFor;wrap.append(label,select);
              label.textContent=field.label;return wrap;
            }
            input.className = "dashboard-crud-input";
            input.name = field.name;
            input.id = "cfg-"+group.id+"-"+field.name;
            label.htmlFor = input.id;
            label.textContent = field.label;
            if (field.type === "checkbox") { input.checked = Boolean(field.value); input.disabled = Boolean(field.disabled); input.style.width="auto"; input.style.minHeight="auto"; }
            else if (field.type === "color") { input.value = field.value; input.style.minHeight="44px"; input.style.padding="4px"; }
            else { input.value = field.value ?? ""; }
            if (field.min !== undefined) input.min=String(field.min);
            if (field.max !== undefined) input.max=String(field.max);
            if (field.step !== undefined) input.step=String(field.step);
            inputMap.set(group.id+"."+field.name,input);
            wrap.append(label,input);
            return wrap;
          }
          for (const group of groupDefs) {
            const card = document.createElement("section");
            card.className = "dashboard-crud-card";
            const heading = document.createElement("h3");heading.textContent=group.title;card.append(heading);
            const grid = document.createElement("div");grid.className="dashboard-crud-form";
            for (const field of group.fields) grid.append(makeField(field,group));
            card.append(grid);form.append(card);
          }
          if (!isCustomization) {
            const faviconCard = document.createElement("section");
            faviconCard.className = "dashboard-crud-card";
            const faviconHeading = document.createElement("h3");
            faviconHeading.textContent = "Website Favicon";
            const faviconHelp = document.createElement("p");
            faviconHelp.className = "dashboard-section-description";
            faviconHelp.textContent = "Upload a small PNG, GIF, or ICO icon (maximum 128 KB). Select the file, then use Save and Apply to publish it.";
            const faviconInput = document.createElement("input");
            faviconInput.type = "file";
            faviconInput.accept = ".png,.gif,.ico,image/png,image/gif,image/x-icon,image/vnd.microsoft.icon";
            faviconInput.className = "dashboard-crud-input";
            faviconInput.setAttribute("aria-label", "Choose website favicon");
            const currentFaviconLabel = document.createElement("p");
            currentFaviconLabel.className = "dashboard-section-description";
            currentFaviconLabel.textContent = "Currently used favicon";
            const faviconPreview = document.createElement("img");
            faviconPreview.alt = "Currently used favicon preview";
            faviconPreview.width = 48;
            faviconPreview.height = 48;
            faviconPreview.style.cssText = "display:none;object-fit:contain;margin-top:6px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-radius-small);padding:6px";
            const selectedFaviconLabel = document.createElement("p");
            selectedFaviconLabel.className = "dashboard-section-description";
            selectedFaviconLabel.textContent = "New favicon preview";
            selectedFaviconLabel.hidden = true;
            const selectedFaviconPreview = document.createElement("img");
            selectedFaviconPreview.alt = "New favicon preview";
            selectedFaviconPreview.width = 48;
            selectedFaviconPreview.height = 48;
            selectedFaviconPreview.style.cssText = "display:none;object-fit:contain;margin-top:6px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-radius-small);padding:6px";
            const historyLabel = document.createElement("p");
            historyLabel.className = "dashboard-section-description";
            historyLabel.textContent = "Previous favicons (kept when a new one is applied)";
            const faviconHistoryList = document.createElement("div");
            faviconHistoryList.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 14px";
            let savedFaviconDataUrl = "";
            function renderFaviconHistory() {
              faviconHistoryList.replaceChildren();
              let history = [];
              try { history = JSON.parse(inputMap.get("general.favicon_history").value || "[]"); } catch (_) { history = []; }
              if (!Array.isArray(history)) history = [];
              history.filter(item => item && typeof item.data_url === "string" && /^data:image\/(?:png|gif|x-icon|vnd[.]microsoft[.]icon);base64,/i.test(item.data_url)).forEach((item, index) => {
                const entry = document.createElement("div");
                entry.style.cssText = "display:flex;align-items:center;gap:8px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-radius-small);padding:8px";
                const image = document.createElement("img");
                image.src = item.data_url; image.alt = "Previous favicon " + (index + 1); image.width = 32; image.height = 32;
                image.style.cssText = "object-fit:contain";
                const label = document.createElement("span"); label.textContent = item.saved_at ? new Date(item.saved_at).toLocaleDateString() : "Previous favicon";
                entry.append(image, label); faviconHistoryList.append(entry);
              });
              historyLabel.hidden = faviconHistoryList.childElementCount === 0;
            }
            const faviconStatus = document.createElement("p");
            faviconStatus.className = "dashboard-crud-status";
            faviconStatus.setAttribute("role", "status");
            faviconInput.addEventListener("change", () => {
              const file = faviconInput.files?.[0];
              if (!file) return;
              const allowedTypes = new Set(["image/png", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"]);
              const extensionOkay = /\.(png|gif|ico)$/i.test(file.name);
              if ((!allowedTypes.has(file.type) && !extensionOkay) || file.size > 128 * 1024 || file.size === 0) {
                faviconInput.value = "";
                faviconStatus.textContent = "Choose a valid PNG, GIF, or ICO file no larger than 128 KB.";
                faviconStatus.style.color = "#a12622";
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result !== "string" || !/^data:image\/(?:png|gif|x-icon|vnd\.microsoft\.icon);base64,/i.test(reader.result)) {
                  faviconStatus.textContent = "This image format is not supported as a favicon.";
                  faviconStatus.style.color = "#a12622";
                  return;
                }
                const historyInput = inputMap.get("general.favicon_history");
                let history = [];
                try { history = JSON.parse(historyInput.value || "[]"); } catch (_) { history = []; }
                if (!Array.isArray(history)) history = [];
                if (savedFaviconDataUrl && savedFaviconDataUrl !== reader.result && !history.some(item => item && item.data_url === savedFaviconDataUrl)) {
                  history.unshift({data_url:savedFaviconDataUrl,saved_at:new Date().toISOString()});
                }
                historyInput.value = JSON.stringify(history);
                renderFaviconHistory();
                inputMap.get("general.favicon_data_url").value = reader.result;
                selectedFaviconPreview.src = reader.result;
                selectedFaviconPreview.style.display = "block";
                selectedFaviconLabel.hidden = false;
                currentFaviconLabel.textContent = savedFaviconDataUrl ? "Currently used favicon (remains active until Save and Apply)" : "No favicon is active yet";
                faviconStatus.textContent = "New favicon selected. The previous icon will remain in history. Click Save and Apply to activate the new icon.";
                faviconStatus.style.color = "#176b43";
              };
              reader.onerror = () => {
                faviconStatus.textContent = "Could not read this file. Please choose it again.";
                faviconStatus.style.color = "#a12622";
              };
              reader.readAsDataURL(file);
            });
            faviconCard.append(faviconHeading, faviconHelp, currentFaviconLabel, faviconPreview, selectedFaviconLabel, selectedFaviconPreview, historyLabel, faviconHistoryList, faviconInput, faviconStatus);
            form.append(faviconCard);
          }
          const actions = document.createElement("div");actions.className="dashboard-crud-actions";
          actions.append(save,reload);form.append(actions,status);
          content.append(title,intro,form);
          async function loadConfig() {
            status.textContent="Loading saved values…";status.style.color="";
            const table=isCustomization?"site_customizations":"site_settings";
            const {data,error}=await supabaseClient.from(table).select("key,value").like("key",isCustomization?"ui_customization_%":"ui_settings_%");
            if(error)throw error;
            const rows=new Map((data||[]).map(row=>[row.key,typeof row.value==="string"?(()=>{try{return JSON.parse(row.value)}catch(_){return {}}})():(row.value||{})]));
            for(const group of groupDefs){
              const values=rows.get(group.key)||{};
              for(const field of group.fields){
                const input=inputMap.get(group.id+"."+field.name);
                if(!input||!Object.prototype.hasOwnProperty.call(values,field.name))continue;
                const value=values[field.name];
                if(field.type==="checkbox")input.checked=Boolean(value);
                else if(field.name==="section_order"&&Array.isArray(value)){input.value=JSON.stringify(value);input.dispatchEvent(new Event("change"));}
                else if(field.name==="favicon_history")input.value=JSON.stringify(Array.isArray(value)?value:[]);
                else input.value=value==null?"":String(value);
              }
            }
            savedFaviconDataUrl = inputMap.get("general.favicon_data_url")?.value || "";
            selectedFaviconPreview.removeAttribute("src"); selectedFaviconPreview.style.display = "none"; selectedFaviconLabel.hidden = true;
            if (savedFaviconDataUrl && /^data:image\/(?:png|gif|x-icon|vnd[.]microsoft[.]icon);base64,/i.test(savedFaviconDataUrl)) {
              faviconPreview.src = savedFaviconDataUrl;
              faviconPreview.style.display = "block";
              currentFaviconLabel.textContent = "Currently used favicon";
            } else {
              faviconPreview.removeAttribute("src"); faviconPreview.style.display = "none";
              currentFaviconLabel.textContent = "No favicon is currently saved";
            }
            renderFaviconHistory();
            await loadPresets();
            status.textContent="Saved configuration loaded.";status.style.color="#176b43";
          }
          function collectGroup(group) {
            const value={};
            for(const field of group.fields){
              const input=inputMap.get(group.id+"."+field.name);
              if(!input)continue;
              if(field.name==="hide_private_content")value[field.name]=true;
              else if(field.type==="checkbox")value[field.name]=input.checked;
              else if(field.type==="number")value[field.name]=Number(input.value);
              else if(field.name==="favicon_history"){
                let parsed;try{parsed=JSON.parse(input.value||"[]")}catch(_){throw new Error("Favicon history is invalid. Reload saved values and try again.");}
                if(!Array.isArray(parsed)||parsed.some(item=>!item||typeof item.data_url!=="string"||!/^data:image\/(?:png|gif|x-icon|vnd[.]microsoft[.]icon);base64,/i.test(item.data_url)))throw new Error("Favicon history contains an invalid image.");
                value[field.name]=parsed;
              } else if(field.name==="section_order"){
                let parsed;try{parsed=JSON.parse(input.value||"[]")}catch(_){throw new Error("Section order must be valid JSON.");}
                const allowed=["hero","page_pills","album","widget","page_card"];
                if(!Array.isArray(parsed)||parsed.some(item=>!allowed.includes(item))||new Set(parsed).size!==parsed.length)throw new Error("Use the section order controls to set each homepage section once.");
                value[field.name]=[...parsed,...allowed.filter(item=>!parsed.includes(item))];
              } else value[field.name]=input.value.trim();
            }
            for(const field of group.fields){
              if(field.type==="number"&&(value[field.name]<Number(field.min)||value[field.name]>Number(field.max)))throw new Error(field.label+" must be between "+field.min+" and "+field.max+".");
            }
            return value;
          }
          reload.addEventListener("click",async()=>{reload.disabled=true;try{await loadConfig()}catch(error){status.textContent="Could not load saved configuration: "+error.message;status.style.color="#a12622"}finally{reload.disabled=false}});
          form.addEventListener("submit",async event=>{
            event.preventDefault();save.disabled=true;reload.disabled=true;status.textContent="Saving configuration…";status.style.color="";
            try{
              const user=await getCurrentUser();if(!user)throw new Error("Your admin session has expired. Please sign in again.");
              const table=isCustomization?"site_customizations":"site_settings";
              for(const group of groupDefs){
                const value=collectGroup(group);
                const row={key:group.key,value,description:group.title,updated_by:user.id,updated_at:new Date().toISOString()};
                const {error}=await supabaseClient.from(table).upsert(row,{onConflict:"key"});
                if(error)throw error;
                if(!isCustomization){
                  const publicRow={key:group.key,value,description:"Public-safe mirrored configuration: "+group.title,updated_by:user.id,updated_at:new Date().toISOString()};
                  const mirror=await supabaseClient.from("site_customizations").upsert(publicRow,{onConflict:"key"});
                  if(mirror.error)throw mirror.error;
                }
              }
              await applyDalimgariSiteConfig(true);
              if (!isCustomization) {
                savedFaviconDataUrl = inputMap.get("general.favicon_data_url")?.value || "";
                if (savedFaviconDataUrl) { faviconPreview.src = savedFaviconDataUrl; faviconPreview.style.display = "block"; currentFaviconLabel.textContent = "Currently used favicon"; }
                else { faviconPreview.removeAttribute("src"); faviconPreview.style.display = "none"; currentFaviconLabel.textContent = "No favicon is currently saved"; }
                selectedFaviconPreview.removeAttribute("src"); selectedFaviconPreview.style.display = "none"; selectedFaviconLabel.hidden = true;
              }
              status.textContent="Saved. Website configuration has been applied.";status.style.color="#176b43";
            }catch(error){status.textContent="Save failed: "+(error.message||"Unknown error");status.style.color="#a12622"}
            finally{save.disabled=false;reload.disabled=false}
          });
          loadConfig().catch(error=>{status.textContent="Could not load saved configuration: "+error.message;status.style.color="#a12622"});
          return;
        }
        if (section.id === "overview") {
          content.replaceChildren();
          const title = document.createElement("h2"); title.className="dashboard-section-title"; title.textContent="Overview";
          const intro = document.createElement("p"); intro.className="dashboard-section-description"; intro.textContent="Content management and database summary.";
          const stats = document.createElement("div"); stats.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-top:18px";
          content.append(title,intro,stats);
          const targets=[["Heroes","hero_items"],["Posts","post"],["Pages","pages"],["Albums","albums"],["Users","profiles"],["Roles","roles"]];
          for (const [label,table] of targets) {
            const card=document.createElement("div");card.style.cssText="padding:16px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:10px;background:var(--dg-surface)";
            const l=document.createElement("div");l.style.cssText="font-size:var(--dg-font-size-sm);color:#666";l.textContent=label;
            const n=document.createElement("strong");n.style.cssText="display:block;font-size:25px;margin-top:8px";n.textContent="—";card.append(l,n);stats.append(card);
            let countQuery=supabaseClient.from(table).select("id",{count:"exact",head:true});
            if(table==="profiles")countQuery=countQuery.neq("id","c5b6d47e-3e78-4d4e-bc15-6f137a8c1e75");
            countQuery.then(({count,error})=>{if(isCurrent())n.textContent=error?"—":String(count??0);});
          }
          return;
        }
        if (section.id === "recycle") {
          content.replaceChildren();
          const wrap = document.createElement("div"); wrap.className = "dashboard-crud";
          const card = document.createElement("section"); card.className = "dashboard-crud-card";
          const h = document.createElement("h3"); h.textContent = "Recycle Bin";
          const note = document.createElement("p"); note.className = "dashboard-crud-hint";
          note.textContent = "Deleted items are kept here for 30 days. Restore returns an item to its original section. Items are scheduled for permanent cleanup after the retention period.";
          const status = document.createElement("p"); status.className = "dashboard-crud-status"; status.setAttribute("role","status");
          const list = document.createElement("div"); list.className = "dashboard-crud-list";
          card.append(h,note,status,list); wrap.append(card); content.append(wrap);
          function recycleStatus(message,isError=false,target=status){target.textContent=message;target.style.color=isError?"#a12622":"#176b43";}
          async function loadTrash(){
            list.replaceChildren();
            const loading=document.createElement("p");loading.className="dashboard-crud-empty";loading.textContent="Loading deleted items…";list.append(loading);
            const {data,error}=await supabaseClient.from("recycle_bin").select("*").order("deleted_at",{ascending:false}).limit(500);
            if(!isCurrent())return;
            list.replaceChildren();
            if(error){const p=document.createElement("p");p.className="dashboard-crud-empty";p.textContent="Could not load recycle bin: "+error.message;list.append(p);return;}
            if(!data?.length){const p=document.createElement("p");p.className="dashboard-crud-empty";p.textContent="Recycle Bin is empty.";list.append(p);return;}
            const table=document.createElement("table");table.className="dashboard-crud-table";
            const thead=document.createElement("thead"),trh=document.createElement("tr");
            ["Item","Original Section","Deleted","Scheduled permanent deletion","Actions"].forEach(label=>{const th=document.createElement("th");th.textContent=label;trh.append(th);});thead.append(trh);table.append(thead);
            const tbody=document.createElement("tbody");
            for(const item of data){
              const row=document.createElement("tr");
              const name=localizedRecordValue(item.record_data,"title")||localizedRecordValue(item.record_data,"caption")||item.record_data?.name||item.record_data?.key||localizedRecordValue(item.record_data,"full_name")||item.original_id;
              [String(name),String(item.original_table),new Date(item.deleted_at).toLocaleString(),new Date(item.purge_after).toLocaleString()].forEach(value=>{const td=document.createElement("td");td.textContent=value;row.append(td);});
              const actionCell=document.createElement("td");
              const rowStatus=document.createElement("p");rowStatus.className="dashboard-crud-status";rowStatus.setAttribute("role","status");rowStatus.setAttribute("aria-live","polite");
              const restore=document.createElement("button");restore.type="button";restore.className="action-button primary";restore.textContent="Restore";
              const purge=document.createElement("button");purge.type="button";purge.className="action-button";purge.textContent="Delete permanently";purge.style.marginLeft="6px";
              restore.addEventListener("click",async()=>{
                if(!confirm("Restore this item to its original section?"))return;
                restore.disabled=true;purge.disabled=true;
                try{
                  const original=item.record_data||{};
                  const {error:insertError}=await supabaseClient.from(item.original_table).insert(original);
                  if(insertError){
                    const keyColumn=original.id?"id":"key";
                    const keyValue=original.id||original.key;
                    const {data:existing,error:checkError}=await supabaseClient.from(item.original_table).select(keyColumn).eq(keyColumn,keyValue).maybeSingle();
                    if(checkError||!existing)throw insertError;
                  }
                  const related=item.related_data||{};
                  async function restoreLinks(tableName,rows){
                    if(!Array.isArray(rows)||!rows.length)return;
                    const {error}=await supabaseClient.from(tableName).upsert(rows,{ignoreDuplicates:true});
                    if(error)throw error;
                  }
                  if(item.original_table==="roles"){
                    await restoreLinks("user_roles",related.user_roles);
                    await restoreLinks("role_permissions",related.role_permissions);
                  }
                  if(item.original_table==="permissions") await restoreLinks("role_permissions",related.role_permissions);
                  const {error:trashError}=await supabaseClient.from("recycle_bin").delete().eq("id",item.id);
                  if(trashError)throw trashError;
                  await loadTrash();recycleStatus("Item restored successfully.");
                }catch(error){recycleStatus(error.message||"Could not restore item.",true,rowStatus);restore.disabled=false;purge.disabled=false;}
              });
              purge.addEventListener("click",async()=>{
                if(!confirm("Permanently delete this item and its stored file, if any? This cannot be undone."))return;
                restore.disabled=true;purge.disabled=true;
                try{
                  await removeRecycleStorageFiles(item);
                  const {error}=await supabaseClient.from("recycle_bin").delete().eq("id",item.id);
                  if(error)throw error;
                  await loadTrash();recycleStatus("Item permanently deleted.");
                }catch(error){recycleStatus(error.message||"Could not permanently delete item.",true,rowStatus);restore.disabled=false;purge.disabled=false;}
              });
              actionCell.append(restore,purge,rowStatus);row.append(actionCell);tbody.append(row);
            }
            table.append(tbody);list.append(table);
          }
          await loadTrash();
          return;
        }
        const config=configs[section.id];
        if (!config) return;
        if(!isCurrent())return;
        content.replaceChildren();
        if(section.id==="page"){
          const autoCard=document.createElement("section");autoCard.className="dashboard-crud-card";
          const autoTitle=document.createElement("h3");autoTitle.textContent="Homepage Page Button Auto-scroll";
          const autoHint=document.createElement("p");autoHint.className="dashboard-crud-hint";autoHint.textContent="Turn automatic scrolling on or off and set how often the homepage Page buttons advance.";
          const autoForm=document.createElement("form");autoForm.className="dashboard-crud";
          const enabledLabel=document.createElement("label");enabledLabel.style.display="flex";enabledLabel.style.alignItems="center";enabledLabel.style.gap="10px";enabledLabel.textContent="Enable auto-scroll";
          const enabledInput=document.createElement("input");enabledInput.type="checkbox";enabledInput.style.width="auto";enabledInput.style.minHeight="auto";enabledLabel.prepend(enabledInput);
          const intervalLabel=document.createElement("label");intervalLabel.textContent="Slide interval (seconds)";
          const intervalInput=document.createElement("input");intervalInput.className="dashboard-crud-input";intervalInput.type="number";intervalInput.min="1";intervalInput.max="60";intervalInput.step="1";intervalInput.value="3";intervalLabel.append(intervalInput);
          const autoStatus=document.createElement("p");autoStatus.className="dashboard-crud-status";autoStatus.setAttribute("role","status");
          const autoSave=document.createElement("button");autoSave.type="submit";autoSave.className="action-button primary";autoSave.textContent="Save Auto-scroll Settings";
          const autoReload=document.createElement("button");autoReload.type="button";autoReload.className="action-button";autoReload.textContent="Reload Saved Values";
          autoForm.append(enabledLabel,intervalLabel,autoSave,autoReload,autoStatus);autoCard.append(autoTitle,autoHint,autoForm);content.append(autoCard);
          async function loadAutoSettings(){
            autoReload.disabled=true;autoStatus.textContent="Loading saved settings…";
            try{
              const {data,error}=await supabaseClient.from("site_customizations").select("value").eq("key","home_page_pill_autoscroll").maybeSingle();
              if(error)throw error;
              let value=data?.value;if(typeof value==="string"){try{value=JSON.parse(value)}catch(_){value={}}}
              if(!value||typeof value!=="object"||Array.isArray(value))value={};
              enabledInput.checked=value.enabled!==false;
              intervalInput.value=String(Math.max(1,Math.min(60,Number(value.interval_seconds)||3)));
              autoStatus.textContent="Saved settings loaded.";autoStatus.style.color="#176b43";
            }catch(error){autoStatus.textContent="Could not load settings: "+(error.message||"Unknown error");autoStatus.style.color="#a12622"}
            finally{autoReload.disabled=false}
          }
          autoReload.addEventListener("click",loadAutoSettings);
          autoForm.addEventListener("submit",async event=>{
            event.preventDefault();autoSave.disabled=true;autoReload.disabled=true;autoStatus.textContent="Saving…";autoStatus.style.color="";
            try{
              const user=await getCurrentUser();if(!user)throw new Error("Your admin session has expired. Please sign in again.");
              const seconds=Number(intervalInput.value);if(!Number.isInteger(seconds)||seconds<1||seconds>60)throw new Error("Enter a whole number from 1 to 60 seconds.");
              const value={enabled:enabledInput.checked,interval_seconds:seconds};
              const {error}=await supabaseClient.from("site_customizations").upsert({key:"home_page_pill_autoscroll",value,description:"Homepage Page button auto-scroll settings",updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:"key"});
              if(error)throw error;
              autoStatus.textContent="Saved. Reload the homepage to apply the updated settings.";autoStatus.style.color="#176b43";
            }catch(error){autoStatus.textContent="Save failed: "+(error.message||"Unknown error");autoStatus.style.color="#a12622"}
            finally{autoSave.disabled=false;autoReload.disabled=false}
          });
          loadAutoSettings();
        }
        const wrap=document.createElement("div");wrap.className="dashboard-crud";
        const formCard=document.createElement("section");formCard.className="dashboard-crud-card";
        const formHeading=document.createElement("h3");formHeading.textContent="Create / Edit "+config.label;
        const hint=document.createElement("p");hint.className="dashboard-crud-hint";hint.textContent=section.id==="user"?"This section edits profile records only. Creating or deleting Supabase Auth accounts requires a secured server-side function.":"Select a row below to load its values here. Save changes to update, or use Delete to remove the selected record.";
        const form=document.createElement("form");form.className="dashboard-crud-form";
        const status=document.createElement("p");status.className="dashboard-crud-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
        const actions=document.createElement("div");actions.className="dashboard-crud-actions dashboard-crud-field full";
        const save=document.createElement("button");save.className="action-button primary";save.type="submit";save.textContent="Create";
        const remove=document.createElement("button");remove.className="action-button";remove.type="button";remove.textContent="Delete";remove.disabled=true;
        const clear=document.createElement("button");clear.className="action-button";clear.type="button";clear.textContent="New / Clear";
        actions.append(save,remove,clear);form.append(actions,status);
        const listCard=document.createElement("section");listCard.className="dashboard-crud-card";
        const listHeading=document.createElement("h3");listHeading.textContent="Existing "+config.label;
        const list=document.createElement("div");list.className="dashboard-crud-list";
        listCard.append(listHeading,list);formCard.append(formHeading,hint,form);wrap.append(formCard,listCard);
        content.append(wrap);
        let selectedId=null, records=[], selectedRecordData=null;
        const controls={};
        function setStatus(message,type){status.textContent=message;status.style.color=type==="error"?"#a12622":type==="success"?"#176b43":"#555";}
        function makeField(def){
          const holder=document.createElement("div");holder.className="dashboard-crud-field"+(def.full?" full":"");
          const label=document.createElement("label");label.textContent=def.label;label.htmlFor="dash-"+section.id+"-"+def.name;
          let input;
          if(def.type==="textarea"){input=document.createElement("textarea");input.rows=def.rows||4;}
          else if(def.type==="select"||def.type==="multiselect"){input=document.createElement("select");if(def.type==="multiselect")input.multiple=true;(def.options||[]).forEach(([value,labelText])=>{const opt=document.createElement("option");opt.value=value;opt.textContent=labelText;input.append(opt);});if(def.type==="multiselect")input.size=4;}
          else {input=document.createElement("input");input.type=def.type==="files"?"file":def.type;if(def.type==="files")input.multiple=true;if(def.accept)input.accept=def.accept;}
          input.className="dashboard-crud-input";input.id=label.htmlFor;input.name=def.name;
          if(def.required)input.required=true;if(def.readonly)input.readOnly=true;
          holder.append(label,input);
          if(def.type==="files"){
            const titleList=document.createElement("div");titleList.style.cssText="display:grid;gap:8px;margin-top:8px";
            const existingList=document.createElement("div");existingList.style.cssText="display:grid;gap:8px;margin-top:10px";
            const existingHeading=document.createElement("strong");existingHeading.textContent="Selected Files (uncheck to detach)";existingList.append(existingHeading);
            const picker=document.createElement("details");picker.style.cssText="margin-top:10px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-radius-small);padding:10px";
            const pickerSummary=document.createElement("summary");pickerSummary.textContent="Select from Media Library";pickerSummary.style.cursor="pointer";
            const pickerSearch=document.createElement("input");pickerSearch.className="dashboard-crud-input";pickerSearch.type="search";pickerSearch.placeholder="Search media titles";pickerSearch.style.marginTop="10px";
            const pickerList=document.createElement("div");pickerList.style.cssText="display:grid;gap:8px;max-height:240px;overflow:auto;margin-top:8px";
            picker.append(pickerSummary,pickerSearch,pickerList);holder.append(titleList,existingList,picker);
            controls.mediaTitleInputs=[];controls.mediaLibraryChecks=[];controls.mediaPickerList=pickerList;controls.mediaTitleList=titleList;controls.mediaExistingList=existingList;controls.mediaPickerSearch=pickerSearch;
            input.addEventListener("change",()=>{
              titleList.replaceChildren();controls.mediaTitleInputs=[];
              Array.from(input.files||[]).forEach((file,index)=>{
                const row=document.createElement("label");row.style.cssText="display:grid;gap:4px;padding:8px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-radius-small)";
                const filename=document.createElement("span");filename.textContent=file.name;
                const titleEnInput=document.createElement("input");titleEnInput.className="dashboard-crud-input";titleEnInput.required=true;titleEnInput.placeholder="English title (required)";titleEnInput.value="";titleEnInput.setAttribute("aria-label","English title for "+file.name);
                const titleBnInput=document.createElement("input");titleBnInput.className="dashboard-crud-input";titleBnInput.required=true;titleBnInput.placeholder="বাংলা নাম (আবশ্যক)";titleBnInput.value="";titleBnInput.setAttribute("aria-label","Bengali title for "+file.name);
                controls.mediaTitleInputs[index]={en:titleEnInput,bn:titleBnInput};row.append(filename,titleEnInput,titleBnInput);titleList.append(row);
              });
            });
            async function loadMediaChoices(){
              pickerList.replaceChildren();controls.mediaLibraryChecks=[];
              const {data,error}=await supabaseClient.from("media_assets").select("id,title,title_bn,title_en,original_filename,storage_bucket,storage_path,mime_type,size_bytes").order("title").limit(500);
              if(error){const p=document.createElement("p");p.textContent="Could not load Media Library: "+error.message;pickerList.append(p);return;}
              const drawChoices=()=>{
                pickerList.replaceChildren();
                const q=pickerSearch.value.trim().toLowerCase();
                (data||[]).filter(a=>[a.title,a.title_bn,a.title_en,a.original_filename].some(v=>String(v||"").toLowerCase().includes(q))).forEach(asset=>{
                  const row=document.createElement("label");row.style.cssText="display:flex;align-items:flex-start;gap:8px;padding:7px;border-bottom:1px solid #eee";
                  const check=document.createElement("input");check.type="checkbox";check.style.cssText="width:auto;min-height:0;margin-top:3px";check.dataset.mediaId=asset.id;
                  check.checked=Array.isArray(controls.mediaSelectedAssets)&&controls.mediaSelectedAssets.some(x=>x.id===asset.id);
                  check.addEventListener("change",()=>{
                    let chosen=Array.isArray(controls.mediaSelectedAssets)?controls.mediaSelectedAssets.slice():[];
                    if(check.checked){if(!chosen.some(x=>x.id===asset.id))chosen.push(asset);}
                    else chosen=chosen.filter(x=>x.id!==asset.id);
                    controls.mediaSelectedAssets=chosen;
                  });
                  const text=document.createElement("span");text.textContent=localizedMediaValue(asset,"title")||asset.original_filename||"File";text.title=asset.original_filename||"";row.append(check,text);pickerList.append(row);controls.mediaLibraryChecks.push(check);
                });
                if(!pickerList.childElementCount){const p=document.createElement("p");p.className="dashboard-crud-hint";p.textContent="No matching files.";pickerList.append(p);}
              };
              pickerSearch.oninput=drawChoices;drawChoices();
            }
            picker.addEventListener("toggle",()=>{if(picker.open)loadMediaChoices();});
            pickerSearch.addEventListener("input",()=>{});
            const help=document.createElement("small");help.className="dashboard-crud-hint";help.textContent="New files require a title each. Existing files can be selected and reused without uploading again.";holder.append(help);
          }
          if(def.help){const help=document.createElement("small");help.className="dashboard-crud-hint";help.textContent=def.help;holder.append(help);}
          form.insertBefore(holder,actions);controls[def.name]=input;
          if(def.name==="url" && controls.title) {
            let urlEdited=false;input.addEventListener("input",()=>{urlEdited=true;});
            const makeSlug=()=>generateUrlValue(controls.title.value);
            controls.title.addEventListener("input",()=>{if(!urlEdited&&!selectedId)input.value=makeSlug();});
            input.addEventListener("blur",()=>{if(!input.value.trim()&&controls.title.value.trim())input.value=makeSlug();});
          }
          return input;
        }
        function generateOpaqueToken(byteCount=24){
          const bytes=new Uint8Array(byteCount);crypto.getRandomValues(bytes);
          return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
        }
        function generateUrlValue(value){return String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
        for(const def of config.fields)makeField(def);
  
        // Global bilingual auto-translation: every matching *_bn / *_en field pair
        // uses the same server-side Translation LLM and remains editable by the admin.
        const bilingualPairs=[];
        const bilingualTimers=new Map();
        const bilingualLastEdited=new Map();
        const bilingualGeneratedValues=new Map();
        const bilingualPending=new Map();
        const bilingualStatusNodes=new Map();
        const bilingualDefinitions=new Map(config.fields.map(def=>[def.name,def]));
        const bilingualBases=[...new Set(config.fields.map(def=>def.name).filter(name=>/_bn$/.test(name)).map(name=>name.slice(0,-3)).filter(base=>bilingualDefinitions.has(base+"_en")))];
        function bilingualSetStatus(base,message,type=""){
          for(const node of bilingualStatusNodes.get(base)||[]){
            node.textContent=message;
            node.style.color=type==="error"?"#a12622":type==="success"?"#176b43":"#555";
            node.hidden=!message;
          }
        }
        async function bilingualTranslate(base,sourceName){
          const sourceInput=controls[sourceName];
          const targetName=sourceName===base+"_bn"?base+"_en":base+"_bn";
          const targetInput=controls[targetName];
          if(!sourceInput||!targetInput)return;
          const sourceText=String(sourceInput.value||"").trim();
          if(!sourceText){bilingualSetStatus(base,"");return;}
          const targetValue=String(targetInput.value||"");
          const targetIsGenerated=bilingualGeneratedValues.get(targetName)===targetValue;
          if(targetValue.trim()&&!targetIsGenerated)return;
          const sourceBefore=sourceInput.value;
          const targetBefore=targetInput.value;
          bilingualSetStatus(base,"Translating…");
          const request=(async()=>{
            try{
              const {data,error}=await supabaseClient.functions.invoke("translate-bilingual",{
                body:{
                  text:sourceText,
                  source_language:sourceName.endsWith("_bn")?"bn":"en",
                  target_language:targetName.endsWith("_bn")?"bn":"en",
                  format:/^content(_bn|_en)$/.test(sourceName)||/^content(_bn|_en)$/.test(targetName)?"html":"text"
                }
              });
              if(error)throw new Error(data?.error||error.message||"Translation request failed.");
              if(!data?.translated_text)throw new Error(data?.error||"The translation service returned no text.");
              // Never overwrite edits made while the network request was running.
              if(!sourceInput.isConnected||!targetInput.isConnected||sourceInput.value!==sourceBefore||targetInput.value!==targetBefore)return;
              targetInput.value=data.translated_text;
              bilingualGeneratedValues.set(targetName,targetInput.value);
              bilingualSetStatus(base,"Auto-translated. Review and edit either language before saving.","success");
            }catch(error){
              console.warn("Bilingual auto-translation failed:",error);
              bilingualSetStatus(base,error.message||"Translation failed. Your text is unchanged.","error");
            }
          })();
          bilingualPending.set(base,request);
          try{await request;}finally{if(bilingualPending.get(base)===request)bilingualPending.delete(base);}
        }
        function scheduleBilingualTranslation(base,sourceName,immediate=false){
          const oldTimer=bilingualTimers.get(base);
          if(oldTimer)clearTimeout(oldTimer);
          if(immediate){
            bilingualTimers.delete(base);
            void bilingualTranslate(base,sourceName);
            return;
          }
          bilingualTimers.set(base,setTimeout(()=>{
            bilingualTimers.delete(base);
            void bilingualTranslate(base,sourceName);
          },650));
        }
        for(const base of bilingualBases){
          const bnInput=controls[base+"_bn"],enInput=controls[base+"_en"];
          if(!bnInput||!enInput||!["input","textarea"].includes(bilingualDefinitions[base+"_bn"].type)||!["input","textarea"].includes(bilingualDefinitions[base+"_en"].type))continue;
          const bnHolder=bnInput.closest(".dashboard-crud-field"),enHolder=enInput.closest(".dashboard-crud-field");
          const statusNodes=[];
          for(const holder of [bnHolder,enHolder]){
            if(!holder)continue;
            const note=document.createElement("small");note.className="dashboard-crud-hint";note.setAttribute("aria-live","polite");note.hidden=true;
            holder.append(note);statusNodes.push(note);
          }
          bilingualStatusNodes.set(base,statusNodes);
          const pair={base,bnInput,enInput};bilingualPairs.push(pair);
          for(const [input,sourceName] of [[bnInput,base+"_bn"],[enInput,base+"_en"]]){
            input.addEventListener("input",()=>{
              const generated=bilingualGeneratedValues.get(sourceName);
              if(generated!==undefined&&input.value!==generated)bilingualGeneratedValues.delete(sourceName);
              bilingualLastEdited.set(base,sourceName);
              scheduleBilingualTranslation(base,sourceName);
            });
            input.addEventListener("blur",()=>{
              const source=String(input.value||"").trim();
              const other=sourceName===base+"_bn"?enInput:bnInput;
              const otherGenerated=bilingualGeneratedValues.get(other.name)===other.value;
              if(source&&(!String(other.value||"").trim()||otherGenerated))scheduleBilingualTranslation(base,sourceName,true);
            });
          }
        }
        async function flushBilingualTranslations(){
          for(const pair of bilingualPairs){
            const timer=bilingualTimers.get(pair.base);
            if(timer)clearTimeout(timer);
            bilingualTimers.delete(pair.base);
            const sourceName=bilingualLastEdited.get(pair.base)||
              (String(pair.bnInput.value||"").trim()?pair.base+"_bn":pair.base+"_en");
            const source=sourceName===pair.base+"_bn"?pair.bnInput:pair.enInput;
            const target=sourceName===pair.base+"_bn"?pair.enInput:pair.bnInput;
            const targetGenerated=bilingualGeneratedValues.get(target.name)===target.value;
            if(String(source.value||"").trim()&&(!String(target.value||"").trim()||targetGenerated)){
              await bilingualTranslate(pair.base,sourceName);
            }else if(bilingualPending.has(pair.base)){
              await bilingualPending.get(pair.base);
            }
          }
        }
  
        if(controls.album_id) {
          const {data:albums,error:albumsError}=await supabaseClient.from("albums").select("id,title,title_bn,title_en").order("title").limit(500);
          if(!isCurrent())return;
          if(!albumsError)for(const album of albums||[]){const option=document.createElement("option");option.value=album.id;option.textContent=localizedRecordValue(album,"title");controls.album_id.append(option);}
        }
        if(controls.permissions) {
          const {data:permissions,error:permissionsError}=await supabaseClient.from("permissions").select("id,name").order("name");
          if(!isCurrent())return;
          if(!permissionsError)for(const permission of permissions||[]){const option=document.createElement("option");option.value=permission.id;option.textContent=permission.name;controls.permissions.append(option);}
        }
        function resetForm(){
          selectedId=null;selectedRecordData=null;controls.mediaSelectedAssets=[];form.reset();if(controls.mediaTitleList)controls.mediaTitleList.replaceChildren();if(controls.mediaPickerList)controls.mediaPickerList.replaceChildren();if(controls.mediaExistingList)controls.mediaExistingList.replaceChildren();
          if(config.table==="post"&&controls.visibility)controls.visibility.value=(getRuntimeConfig().ui_settings_content_defaults||{}).default_visibility||"public";
          if(config.table==="pages"&&controls.visibility)controls.visibility.value=(getRuntimeConfig().ui_settings_content_defaults||{}).default_page_visibility||"public";
          if(config.table==="albums"&&controls.visibility)controls.visibility.value=(getRuntimeConfig().ui_settings_privacy_visibility||{}).default_album_visibility||"public";
          save.textContent=config.readOnlyCreate?"Save Profile":"Create";save.disabled=false;remove.disabled=true;setStatus("");
          list.querySelectorAll(".dashboard-crud-row").forEach(row=>row.classList.remove("is-selected"));
        }
        clear.addEventListener("click",resetForm);
        async function loadRecords(){
          if(!isCurrent())return;
          list.replaceChildren();const loading=document.createElement("p");loading.className="dashboard-crud-empty";loading.textContent="Loading records…";list.append(loading);
          let query=supabaseClient.from(config.table).select("*").order("created_at",{ascending:false}).limit(200);
          if(config.table==="profiles")query=query.neq("id","c5b6d47e-3e78-4d4e-bc15-6f137a8c1e75");
          if(config.table==="site_customizations"||config.table==="site_settings")query=supabaseClient.from(config.table).select("*").order("key").limit(200);
          const {data,error}=await query;
          if(!isCurrent())return;
          list.replaceChildren();
          if(error){const p=document.createElement("p");p.className="dashboard-crud-empty";p.textContent="Could not load records: "+error.message;list.append(p);return;}
          records=data||[];
          if(!records.length){const p=document.createElement("p");p.className="dashboard-crud-empty";p.textContent="No records found yet.";list.append(p);return;}
          const table=document.createElement("table");table.className="dashboard-crud-table";
          const thead=document.createElement("thead"),trh=document.createElement("tr");
          const headerLabels=["Select","Title / Name","Details","Visibility","Created"];
          headerLabels.forEach(label=>{const th=document.createElement("th");th.textContent=label;trh.append(th);});
          thead.append(trh);table.append(thead);
          const tbody=document.createElement("tbody");
          records.forEach(record=>{
            const row=document.createElement("tr");row.className="dashboard-crud-row";row.tabIndex=0;
            const title=localizedRecordValue(record,"title")||record.caption_en||record.caption_bn||record.caption||record.title||record.name||record.key||record.full_name||record.id||"Record";
            const details=record.url||localizedRecordValue(record,"description")||record.description||record.phone||(Array.isArray(record.media)?record.media.length+" file(s)":"");
            const values=[String(record.id||"").slice(0,8)||"—",title,details];
            values.push(record.visibility==="private"?"Only Me":record.visibility==="public"?"Public":"—",record.created_at?new Date(record.created_at).toLocaleString():"—");
            values.forEach((value,index)=>{
              const td=document.createElement("td");
              if(index===1||index===2)td.dataset.userContent="true";
              if(section.id==="page"&&index===2&&record.url){
                const link=document.createElement("a");
                link.href=window.location.pathname+"?page="+encodeURIComponent(record.url);
                link.textContent="?page="+record.url;
                link.target="_blank";link.rel="noopener noreferrer";
                link.style.cssText="overflow-wrap:anywhere";
                td.append(link);
              }else td.textContent=String(value);
              row.append(td);
            });
            const first=row.firstElementChild;first.textContent="Select";
            row.addEventListener("click",()=>selectRecord(record,row));
            row.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectRecord(record,row);}});
            tbody.append(row);
          });
          table.append(tbody);list.append(table);
          if(section.id==="page") await renderPageOrderManager();
          if(section.id==="album") await renderAlbumOrderManager();
        }
        async function renderPageOrderManager(){
          if(section.id!=="page" || !isCurrent()) return;
          const panel=document.createElement("section");panel.className="dashboard-crud-card";panel.style.marginTop="16px";
          const heading=document.createElement("h3");heading.textContent="Homepage Page Title Order";
          const hint=document.createElement("p");hint.className="dashboard-crud-hint";hint.textContent="Use the arrows to choose the order of Public pages shown as pill buttons on Home. Only Public pages appear there.";
          const status=document.createElement("p");status.className="dashboard-crud-status";status.setAttribute("role","status");
          const orderList=document.createElement("div");orderList.style.cssText="display:grid;gap:8px";
          const actions=document.createElement("div");actions.className="dashboard-crud-actions";
          const saveOrder=document.createElement("button");saveOrder.type="button";saveOrder.className="action-button primary";saveOrder.textContent="Save Order";
          panel.append(heading,hint,orderList,actions,status);actions.append(saveOrder);list.append(panel);
          const {data:setting,error:settingError}=await supabaseClient.from("site_customizations").select("value").eq("key","home_page_order").maybeSingle();
          if(!isCurrent())return;
          let ids=setting?.value;if(typeof ids==="string"){try{ids=JSON.parse(ids);}catch(_){ids=[];}}
          if(ids&&!Array.isArray(ids)&&Array.isArray(ids.ids))ids=ids.ids;if(!Array.isArray(ids))ids=[];
          const publicRecords=records.filter(r=>r.visibility==="public").sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
          const byId=new Map(publicRecords.map(r=>[String(r.id),r]));
          const ordered=[...ids.map(id=>byId.get(String(id))).filter(Boolean)];
          publicRecords.forEach(r=>{if(!ordered.some(x=>String(x.id)===String(r.id)))ordered.push(r);});
          function drawOrder(){
            orderList.replaceChildren();
            if(!ordered.length){const empty=document.createElement("p");empty.className="dashboard-crud-empty";empty.textContent="No Public pages to reorder.";orderList.append(empty);saveOrder.disabled=true;return;}
            saveOrder.disabled=false;
            ordered.forEach((record,index)=>{
              const row=document.createElement("div");row.style.cssText="display:flex;align-items:center;gap:10px;min-width:0;padding:10px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-control-radius);background:var(--dg-surface)";
              const label=document.createElement("span");label.textContent=(index+1)+". "+(localizedRecordValue(record,"title")||record.url||"Page");label.style.cssText="flex:1;min-width:0;overflow-wrap:anywhere;font-size:var(--dg-font-size-base)";
              const up=document.createElement("button");up.type="button";up.className="action-button";up.textContent="↑";up.setAttribute("aria-label","Move "+(localizedRecordValue(record,"title")||"page")+" up");up.disabled=index===0;
              const down=document.createElement("button");down.type="button";down.className="action-button";down.textContent="↓";down.setAttribute("aria-label","Move "+(localizedRecordValue(record,"title")||"page")+" down");down.disabled=index===ordered.length-1;
              up.addEventListener("click",()=>{[ordered[index-1],ordered[index]]=[ordered[index],ordered[index-1]];drawOrder();});
              down.addEventListener("click",()=>{[ordered[index+1],ordered[index]]=[ordered[index],ordered[index+1]];drawOrder();});
              row.append(label,up,down);orderList.append(row);
            });
          }
          if(settingError){status.textContent="Could not load saved order. You can still set and save a new order.";status.style.color="#a12622";}
          drawOrder();
          saveOrder.addEventListener("click",async()=>{
            saveOrder.disabled=true;status.textContent="Saving order…";status.style.color="";
            try{
              const payload={key:"home_page_order",value:ordered.map(r=>String(r.id)),description:"Order of Public pages shown in the homepage Page Title section",updated_at:new Date().toISOString()};
              const {error}=await supabaseClient.from("site_customizations").upsert(payload,{onConflict:"key"});if(error)throw error;
              status.textContent="Homepage page order saved.";status.style.color="#176b43";
            }catch(error){status.textContent="Could not save order: "+(error.message||"Please try again.");status.style.color="#a12622";}
            finally{saveOrder.disabled=false;}
          });
        }
        async function renderAlbumOrderManager(){
          if(section.id!=="album" || !isCurrent()) return;
          const panel=document.createElement("section");panel.className="dashboard-crud-card";panel.style.marginTop="16px";
          const heading=document.createElement("h3");heading.textContent="Homepage Album Order";
          const hint=document.createElement("p");hint.className="dashboard-crud-hint";hint.textContent="Use the arrows to choose which Public album card appears first on Home. This changes the order only; it does not duplicate or edit albums.";
          const status=document.createElement("p");status.className="dashboard-crud-status";status.setAttribute("role","status");
          const orderList=document.createElement("div");orderList.style.cssText="display:grid;gap:8px";
          const actions=document.createElement("div");actions.className="dashboard-crud-actions";
          const saveOrder=document.createElement("button");saveOrder.type="button";saveOrder.className="action-button primary";saveOrder.textContent="Save Order";
          panel.append(heading,hint,orderList,actions,status);actions.append(saveOrder);list.append(panel);
          const {data:setting,error:settingError}=await supabaseClient.from("site_customizations").select("value").eq("key","home_album_order").maybeSingle();
          if(!isCurrent())return;
          let ids=setting?.value;if(typeof ids==="string"){try{ids=JSON.parse(ids);}catch(_){ids=[];}}
          if(ids&&!Array.isArray(ids)&&Array.isArray(ids.ids))ids=ids.ids;if(!Array.isArray(ids))ids=[];
          const publicRecords=records.filter(r=>r.visibility==="public").sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
          const byId=new Map(publicRecords.map(r=>[String(r.id),r]));
          const ordered=[...ids.map(id=>byId.get(String(id))).filter(Boolean)];
          publicRecords.forEach(r=>{if(!ordered.some(x=>String(x.id)===String(r.id)))ordered.push(r);});
          function drawOrder(){
            orderList.replaceChildren();
            if(!ordered.length){const empty=document.createElement("p");empty.className="dashboard-crud-empty";empty.textContent="No Public albums to reorder.";orderList.append(empty);saveOrder.disabled=true;return;}
            saveOrder.disabled=false;
            ordered.forEach((record,index)=>{
              const row=document.createElement("div");row.style.cssText="display:flex;align-items:center;gap:10px;min-width:0;padding:10px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-control-radius);background:var(--dg-surface)";
              const label=document.createElement("span");label.textContent=(index+1)+". "+(localizedRecordValue(record,"title")||record.url||"Album");label.style.cssText="flex:1;min-width:0;overflow-wrap:anywhere;font-size:var(--dg-font-size-base)";
              const up=document.createElement("button");up.type="button";up.className="action-button";up.textContent="↑";up.setAttribute("aria-label","Move "+(localizedRecordValue(record,"title")||"album")+" up");up.disabled=index===0;
              const down=document.createElement("button");down.type="button";down.className="action-button";down.textContent="↓";down.setAttribute("aria-label","Move "+(localizedRecordValue(record,"title")||"album")+" down");down.disabled=index===ordered.length-1;
              up.addEventListener("click",()=>{[ordered[index-1],ordered[index]]=[ordered[index],ordered[index-1]];drawOrder();});
              down.addEventListener("click",()=>{[ordered[index+1],ordered[index]]=[ordered[index],ordered[index+1]];drawOrder();});
              row.append(label,up,down);orderList.append(row);
            });
          }
          if(settingError){status.textContent="Could not load saved order. You can still set and save a new order.";status.style.color="#a12622";}
          drawOrder();
          saveOrder.addEventListener("click",async()=>{
            saveOrder.disabled=true;status.textContent="Saving order…";status.style.color="";
            try{
              const payload={key:"home_album_order",value:ordered.map(r=>String(r.id)),description:"Order of Public album cards shown on the homepage",updated_at:new Date().toISOString()};
              const {error}=await supabaseClient.from("site_customizations").upsert(payload,{onConflict:"key"});if(error)throw error;
              status.textContent="Homepage album order saved.";status.style.color="#176b43";
            }catch(error){status.textContent="Could not save order: "+(error.message||"Please try again.");status.style.color="#a12622";}
            finally{saveOrder.disabled=false;}
          });
        }
        async function selectRecord(record,row){
          selectedId=record.id||record.key||record.id;selectedRecordData=record;resetSelectionHighlight();row.classList.add("is-selected");
          if(controls.mediaExistingList){
            controls.mediaExistingList.replaceChildren();
            const existingHeading=document.createElement("strong");existingHeading.textContent="Selected Files (uncheck to detach)";controls.mediaExistingList.append(existingHeading);
            (Array.isArray(record.media)?record.media:[]).forEach(item=>{
              const row=document.createElement("label");row.style.cssText="display:flex;align-items:flex-start;gap:8px;padding:7px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-radius-small)";
              const check=document.createElement("input");check.type="checkbox";check.checked=true;check.dataset.existingPath=String(item.path||"");check.style.cssText="width:auto;min-height:0;margin-top:3px";
              const text=document.createElement("span");text.textContent=(localizedMediaValue(item,"title")||item.path||"File")+" — "+(item.path||"");
              row.append(check,text);controls.mediaExistingList.append(row);
            });
          }
          controls.mediaSelectedAssets=[];if(controls.mediaTitleList)controls.mediaTitleList.replaceChildren();if(controls.mediaPickerList)controls.mediaPickerList.replaceChildren();
          config.fields.forEach(def=>{
            const input=controls[def.name];if(!input)return;
            if(def.type==="files"||def.type==="multiselect")return;
            let value=record[def.name];
            if((section.id==="customization"||section.id==="settings")&&def.name==="value")value=JSON.stringify(value??null,null,2);
            input.value=value==null?"":String(value);
          });
          if(controls.permissions) {
            const {data:links}=await supabaseClient.from("role_permissions").select("permission_id").eq("role_id",record.id);
            const selected=new Set((links||[]).map(link=>String(link.permission_id)));
            Array.from(controls.permissions.options).forEach(option=>option.selected=selected.has(option.value));
          }
          save.textContent=config.readOnlyCreate?"Save Profile":"Update";save.disabled=false;remove.disabled=!!config.noDelete;setStatus("Selected record loaded into the form.");
          
        }
        function resetSelectionHighlight(){list.querySelectorAll(".dashboard-crud-row").forEach(row=>row.classList.remove("is-selected"));}
        form.addEventListener("submit",async event=>{
          event.preventDefault();
          save.disabled=true;remove.disabled=true;save.textContent="Saving…";setStatus("");
          try{
            await flushBilingualTranslations();
            const payload={};
            config.fields.forEach(def=>{
              const input=controls[def.name];
              if(def.type==="files"||def.type==="multiselect")return;
              let value=input.value;
              if(def.name==="value"&&(section.id==="customization"||section.id==="settings")){try{value=JSON.parse(value);}catch{throw new Error("Value must be valid JSON.");}}
              else if(value==="")value=null;
              payload[def.name]=value;
            });
            if(["hero","post","page","album"].includes(section.id)) {
              const lang = getUiLanguage();
              const localizedTitle = String((lang === "en" ? payload.title_en : payload.title_bn) || payload.title_bn || payload.title_en || "").trim();
              const localizedDescription = String((lang === "en" ? payload.description_en : payload.description_bn) || payload.description_bn || payload.description_en || "").trim();
              if (!String(payload.title_bn || "").trim() || !String(payload.title_en || "").trim()) throw new Error("Enter the title in both Bengali and English.");
              for (const [bnKey,enKey,label] of [["description_bn","description_en","description"],["content_bn","content_en","content"]]) {
                const bnValue=String(payload[bnKey]||"").trim(),enValue=String(payload[enKey]||"").trim();
                if ((bnValue&&!enValue)||(!bnValue&&enValue)) throw new Error("Enter "+label+" in both Bengali and English, or leave both empty.");
              }
              if (section.id==="page" && (!String(payload.content_bn||"").trim() || !String(payload.content_en||"").trim())) throw new Error("Custom page HTML content is required in both Bengali and English.");
              payload.title = localizedTitle;
              if (Object.prototype.hasOwnProperty.call(payload, "description_bn") || Object.prototype.hasOwnProperty.call(payload, "description_en")) payload.description = localizedDescription || null;
              if (section.id === "page" || section.id === "post") payload.content = (lang === "en" ? payload.content_en : payload.content_bn) || payload.content_bn || payload.content_en || "";
              if (section.id === "post") {
                payload.caption = localizedTitle;
                payload.caption_bn = payload.title_bn || null;
                payload.caption_en = payload.title_en || null;
              }
              if (section.id !== "hero") {
                payload.url=generateUrlValue(payload.url||localizedTitle);
                if(!payload.url)throw new Error("URL is required. Use English letters, numbers and hyphens.");
                const {data:duplicate,error:duplicateError}=await supabaseClient.from(config.table).select("id").eq("url",payload.url).limit(1).maybeSingle();
                if(duplicateError)throw duplicateError;
                if(duplicate&&duplicate.id!==selectedId)throw new Error("This URL is already in use. Choose another URL.");
              }
            }
            if(section.id==="post") {
              payload.caption=String(payload.title||"").trim();
              payload.caption_bn=payload.title_bn||null;
              payload.caption_en=payload.title_en||null;
            }
            if(controls.album_id)payload.album_id=controls.album_id.value||null;
            const existingMedia=Array.isArray(selectedRecordData?.media)?selectedRecordData.media.map(item=>({...item})):[];
            if(controls.mediaExistingList&&selectedRecordData){
              const keepPaths=new Set(Array.from(controls.mediaExistingList.querySelectorAll('input[type="checkbox"][data-existing-path]:checked')).map(el=>el.dataset.existingPath));
              for(let i=existingMedia.length-1;i>=0;i--)if(!keepPaths.has(String(existingMedia[i].path||"")))existingMedia.splice(i,1);
            }
            const selectedLibraryAssets=Array.isArray(controls.mediaSelectedAssets)?controls.mediaSelectedAssets.slice():[];
            for(const asset of selectedLibraryAssets){
              if(!existingMedia.some(item=>item.path===asset.storage_path))existingMedia.push({path:asset.storage_path,name:asset.original_filename,mime_type:asset.mime_type,size_bytes:asset.size_bytes,media_id:asset.id,title:asset.title,title_bn:asset.title_bn,title_en:asset.title_en,alt_text:asset.alt_text,alt_text_bn:asset.alt_text_bn,alt_text_en:asset.alt_text_en});
            }
            const chosenFiles=Array.from(controls.media?.files||[]);
            const allowedTypes=new Set(["image/jpeg","image/png","image/webp","image/gif","image/avif","image/svg+xml","video/mp4","video/webm","video/quicktime","audio/mpeg","audio/mp4","audio/wav","audio/ogg","application/pdf"]);
            const visibility=payload.visibility||"public";
            for(const file of chosenFiles){
              if(!allowedTypes.has(file.type)||file.size>50*1024*1024)throw new Error("Choose supported image, video, audio or PDF files up to 50 MB each.");
              const titleInputs=controls.mediaTitleInputs?.[chosenFiles.indexOf(file)];
              if(!String(titleInputs?.en?.value||"").trim()||!String(titleInputs?.bn?.value||"").trim())throw new Error("Enter both English and Bengali titles for every uploaded file.");
            }
            // Keep stored paths stable: Media Library IDs and section links refer to them.
            for(const file of chosenFiles) {
              const extension=(file.name.match(/\.([a-zA-Z0-9]{1,10})$/)||[])[1]||"bin";
              const folder=visibility==="public"?"public":"private";
              const path=folder+"/"+user.id+"/"+crypto.randomUUID()+"."+extension.toLowerCase();
              const {error:uploadError}=await supabaseClient.storage.from("content-files").upload(path,file,{contentType:file.type,cacheControl:"0",upsert:false});
              if(uploadError)throw uploadError;
              const titleInputs=controls.mediaTitleInputs?.[chosenFiles.indexOf(file)];
              const titleEn=String(titleInputs?.en?.value||"").trim();
              const titleBn=String(titleInputs?.bn?.value||"").trim();
              const title=titleEn;
              try{
                const {data:asset,error:assetError}=await supabaseClient.from("media_assets").insert({title,title_en:titleEn,title_bn:titleBn,original_filename:file.name,storage_bucket:"content-files",storage_path:path,mime_type:file.type||"application/octet-stream",size_bytes:file.size,created_by:user.id}).select("id,title,title_bn,title_en,storage_path").single();
                if(assetError)throw assetError;
                existingMedia.push({path,name:file.name,mime_type:file.type,size_bytes:file.size,media_id:asset.id,title,title_bn:titleBn,title_en:titleEn});
              }catch(assetError){
                await supabaseClient.storage.from("content-files").remove([path]);
                throw new Error("File uploaded but could not be registered in Media Library: "+(assetError.message||"Unknown error"));
              }
            }
            if(config.fields.some(def=>def.name==="media"))payload.media=existingMedia;
            const selectedPermissions=controls.permissions?Array.from(controls.permissions.selectedOptions).map(option=>option.value):null;
            if(config.table==="site_customizations"||config.table==="site_settings")payload.updated_by=user.id;
            if(config.table!=="profiles")payload.updated_at=new Date().toISOString();
            let result;
            if(selectedId){result=await supabaseClient.from(config.table).update(payload).eq(config.table==="site_settings"||config.table==="site_customizations"?"id":"id",selectedId).select().single();}
            else{
              if(config.readOnlyCreate)throw new Error("Profiles are created through the account registration flow.");
              if(["post","pages","hero_items","albums"].includes(config.table))payload.created_by=user.id;
              result=await supabaseClient.from(config.table).insert(payload).select().single();
            }
            if(result.error)throw result.error;
            const savedId=result.data?.id||selectedId;
            if(section.id==="role" && savedId) {
              const {error:clearLinksError}=await supabaseClient.from("role_permissions").delete().eq("role_id",savedId);
              if(clearLinksError)throw clearLinksError;
              if(selectedPermissions?.length) {
                const rows=selectedPermissions.map(permission_id=>({role_id:savedId,permission_id}));
                const {error:linkError}=await supabaseClient.from("role_permissions").insert(rows);
                if(linkError)throw linkError;
              }
            }
            if(["post","pages","hero_items","albums"].includes(config.table)&&savedId){
              const links=[];
              for(const item of existingMedia){
                let mediaId=item.media_id;
                if(!mediaId&&item.path){const {data:asset,error:assetError}=await supabaseClient.from("media_assets").select("id").eq("storage_bucket","content-files").eq("storage_path",item.path).maybeSingle();if(assetError)throw assetError;mediaId=asset?.id;}
                if(mediaId)links.push({media_id:mediaId,source_table:config.table,source_id:savedId,sort_order:links.length});
              }
              const {error:clearLinkError}=await supabaseClient.from("media_links").delete().eq("source_table",config.table).eq("source_id",savedId);
              if(clearLinkError)throw clearLinkError;
              if(links.length){
                const {error:linkError}=await supabaseClient.from("media_links").upsert(links,{onConflict:"media_id,source_table,source_id"});
                if(linkError)throw linkError;
              }
            }
            const wasUpdating=Boolean(selectedId);resetForm();setStatus(wasUpdating?"Record updated successfully.":"Record created successfully.","success");await loadRecords();
          }catch(error){setStatus(error.message||"Could not save record.","error");}
          finally{save.disabled=false;save.textContent=selectedId?"Update":(config.readOnlyCreate?"Save Profile":"Create");remove.disabled=!selectedId||!!config.noDelete;}
        });
        remove.addEventListener("click",async()=>{
          if(!selectedId||config.noDelete)return;
          const record=records.find(r=>(r.id||r.key)===selectedId);if(!record)return;
          if(!confirm("Move this record to Recycle Bin? It can be restored within 30 days."))return;
          remove.disabled=true;save.disabled=true;
          let trashId=null;
          try{
            const related={};
            const tableName=config.table;
            if(tableName==="roles"){
              const [users,permissions]=await Promise.all([
                supabaseClient.from("user_roles").select("*").eq("role_id",selectedId),
                supabaseClient.from("role_permissions").select("*").eq("role_id",selectedId)
              ]);
              if(users.error)throw users.error;if(permissions.error)throw permissions.error;
              related.user_roles=users.data||[];related.role_permissions=permissions.data||[];
            }else if(tableName==="permissions"){
              const {data,error}=await supabaseClient.from("role_permissions").select("*").eq("permission_id",selectedId);if(error)throw error;
              related.role_permissions=data||[];
            }
            const trashPayload={
              original_table:tableName,original_id:String(selectedId),record_data:record,related_data:related,
              deleted_by:user.id
            };
            const {data:trash,error:trashError}=await supabaseClient.from("recycle_bin").insert(trashPayload).select("id").single();
            if(trashError)throw trashError;trashId=trash.id;
            if(tableName==="roles"){
              const {error:userError}=await supabaseClient.from("user_roles").delete().eq("role_id",selectedId);if(userError)throw userError;
              const {error:permError}=await supabaseClient.from("role_permissions").delete().eq("role_id",selectedId);if(permError)throw permError;
            }
            if(tableName==="permissions"){const {error}=await supabaseClient.from("role_permissions").delete().eq("permission_id",selectedId);if(error)throw error;}
            const {error}=await supabaseClient.from(tableName).delete().eq("id",selectedId);if(error)throw error;
            resetForm();setStatus("Moved to Recycle Bin. Scheduled for permanent deletion in 30 days.","success");await loadRecords();
          }catch(error){
            if(trashId)console.warn("Recycle Bin entry retained for recovery after an incomplete move.",trashId);
            setStatus((error.message||"Could not move record to Recycle Bin.")+(trashId?" The recycle entry was kept so the operation can be recovered.":""),"error");
          }
          finally{save.disabled=false;remove.disabled=true;}
        });
        async function renderRoleAssignments(){
          if(section.id!=="role"||!isCurrent())return;
          const panel=document.createElement("section");panel.className="dashboard-crud-card";panel.style.marginTop="18px";
          const heading=document.createElement("h3");heading.textContent="Assign a role to each user";
          const hint=document.createElement("p");hint.className="dashboard-crud-hint";hint.textContent="Each user can have one role. The role's permissions control access to dashboard sections and database operations.";
          const statusLine=document.createElement("p");statusLine.className="dashboard-crud-status";statusLine.setAttribute("role","status");
          const list=document.createElement("div");list.style.cssText="display:grid;gap:12px";
          panel.append(heading,hint,statusLine,list);content.append(panel);
          const [profilesResult,rolesResult,assignmentsResult]=await Promise.all([
            supabaseClient.from("profiles").select("id,full_name").order("full_name").limit(500),
            supabaseClient.from("roles").select("id,name").order("name").limit(200),
            supabaseClient.from("user_roles").select("user_id,role_id").limit(1000)
          ]);
          if(!isCurrent())return;
          const failed=[profilesResult.error,rolesResult.error,assignmentsResult.error].find(Boolean);
          if(failed){statusLine.textContent="Could not load role assignments: "+failed.message;statusLine.style.color="#a12622";return;}
          const assignments=new Map((assignmentsResult.data||[]).map(row=>[row.user_id,row.role_id]));
          const roles=rolesResult.data||[];
          if(!profilesResult.data?.length){list.textContent="No user profiles are available.";return;}
          for(const profile of profilesResult.data){
            const row=document.createElement("div");row.className="section-order-row";
            const name=document.createElement("div");name.className="section-order-name";const isProtectedSuperAdmin=profile.id==="c5b6d47e-3e78-4d4e-bc15-6f137a8c1e75";name.textContent=isProtectedSuperAdmin?(profile.full_name||"Dalimgari")+" · SUPER ADMIN · PROTECTED":(profile.full_name||"User")+" · "+String(profile.id).slice(0,8);
            const select=document.createElement("select");select.className="dashboard-crud-input";select.style.maxWidth="260px";select.setAttribute("aria-label","Role for "+(profile.full_name||profile.id));
            const none=document.createElement("option");none.value="";none.textContent="No role";select.append(none);
            for(const roleRow of roles){const option=document.createElement("option");option.value=roleRow.id;option.textContent=roleRow.name;select.append(option);}
            select.value=assignments.get(profile.id)||"";
            const saveAssignment=document.createElement("button");saveAssignment.type="button";saveAssignment.className="action-button primary";saveAssignment.textContent="Save role";
            const assignmentStatus=document.createElement("p");assignmentStatus.className="dashboard-crud-status";assignmentStatus.setAttribute("role","status");assignmentStatus.setAttribute("aria-live","polite");
            saveAssignment.addEventListener("click",async()=>{
              saveAssignment.disabled=true;assignmentStatus.textContent="Saving role assignment…";assignmentStatus.style.color="";
              try{
                if(select.value){const {error}=await supabaseClient.from("user_roles").upsert({user_id:profile.id,role_id:select.value},{onConflict:"user_id"});if(error)throw error;}
                else{const {error}=await supabaseClient.from("user_roles").delete().eq("user_id",profile.id);if(error)throw error;}
                assignmentStatus.textContent="Role assignment saved. The user may need to refresh or sign in again.";assignmentStatus.style.color="#176b43";
              }catch(error){assignmentStatus.textContent="Could not save role assignment: "+(error.message||"Please try again.");assignmentStatus.style.color="#a12622";}
              finally{saveAssignment.disabled=false;}
            });
            row.append(name,select,saveAssignment,assignmentStatus);list.append(row);
          }
          if(!roles.length)statusLine.textContent="Create a role and assign permissions above before assigning users.";
        }
        if(!isCurrent())return;
        resetForm();await loadRecords();
        if(section.id==="role")await renderRoleAssignments();
      }
  

  window.DalimgariDashboard = { renderDashboard };
})();
