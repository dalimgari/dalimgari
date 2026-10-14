    const { supabaseUrl, supabaseAnonKey } = window.DG_CONFIG;
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    const menuButton = document.querySelector(".menu-button");
    const floatingMenu = document.querySelector("#floating-menu");
    const mainContent = document.querySelector("#main-content");
    const menuLinks = document.querySelectorAll(".menu-link");
    // Best-effort media-saving deterrents. Browsers cannot reliably block OS screenshots,
    // developer tools, or copying a URL that a visitor is authorized to view.
    (() => {
      const mediaSelector = "img, video, audio, .dg-image-lightbox";
      const hardenedMediaNodes = new WeakSet();
      const hardenMedia = (root) => {
        const process = media => {
          if (!(media instanceof Element) || hardenedMediaNodes.has(media)) return;
          hardenedMediaNodes.add(media);
          media.draggable = false;
          media.setAttribute("draggable", "false");
          if (media instanceof HTMLMediaElement) {
            media.setAttribute("controlslist", "nodownload noplaybackrate");
            media.disablePictureInPicture = true;
            media.disableRemotePlayback = true;
          }
        };
        if (root instanceof Element && root.matches("img, video, audio")) process(root);
        if (root && typeof root.querySelectorAll === "function") {
          root.querySelectorAll("img, video, audio").forEach(process);
        }
      };
      hardenMedia(document);
      document.addEventListener("contextmenu", event => {
        const target = event.target;
        if (target instanceof Element && target.closest(mediaSelector)) event.preventDefault();
      }, true);
      document.addEventListener("dragstart", event => {
        const target = event.target;
        if (target instanceof Element && target.closest(mediaSelector)) event.preventDefault();
      }, true);
      document.addEventListener("selectstart", event => {
        const target = event.target;
        if (target instanceof Element && target.closest("img, video, audio, .dg-lightbox-image")) event.preventDefault();
      }, true);
      const pendingRoots = new Set();
      let hardeningScheduled = false;
      const flushMediaHardening = () => {
        hardeningScheduled = false;
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();
        const uniqueRoots = roots.filter((root, index) =>
          root.isConnected && !roots.some((other, otherIndex) =>
            index !== otherIndex && other.isConnected && other !== root && other.contains(root)
          )
        );
        for (const root of uniqueRoots) hardenMedia(root);
      };
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element) pendingRoots.add(node);
          }
        }
        if (!pendingRoots.size || hardeningScheduled) return;
        hardeningScheduled = true;
        if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(flushMediaHardening);
        else window.setTimeout(flushMediaHardening, 0);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    })();


    // Site-wide: automatically scroll focused controls into view on every page.
    document.addEventListener("focusin", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) ||
          !target.matches("input, select, textarea, button, a, [tabindex]")) return;
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


    // Site-wide image lightbox. Homepage album cards keep their existing click-to-open behavior.
    (() => {
      const lightbox = document.createElement("div");
      lightbox.className = "dg-image-lightbox";
      lightbox.hidden = true;
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.setAttribute("aria-label", "Image preview");
      const toolbar = document.createElement("div");
      toolbar.className = "dg-lightbox-toolbar";
      const title = document.createElement("h2");
      title.className = "dg-lightbox-title";
      title.textContent = "Image preview";
      const actions = document.createElement("div");
      actions.className = "dg-lightbox-actions";
      const zoomOut = document.createElement("button");
      zoomOut.type = "button"; zoomOut.textContent = "−"; zoomOut.setAttribute("aria-label", "Zoom out");
      const zoomReset = document.createElement("button");
      zoomReset.type = "button"; zoomReset.textContent = "100%"; zoomReset.setAttribute("aria-label", "Reset zoom");
      const zoomIn = document.createElement("button");
      zoomIn.type = "button"; zoomIn.textContent = "+"; zoomIn.setAttribute("aria-label", "Zoom in");
      const close = document.createElement("button");
      close.type = "button"; close.textContent = "×"; close.setAttribute("aria-label", "Close image preview");
      actions.append(zoomOut, zoomReset, zoomIn, close);
      toolbar.append(title, actions);
      const stage = document.createElement("div");
      stage.className = "dg-lightbox-stage";
      const preview = document.createElement("img");
      preview.className = "dg-lightbox-image";
      preview.alt = "";
      stage.append(preview);
      lightbox.append(toolbar, stage);
      document.body.append(lightbox);

      let zoom = 1;
      let baseWidth = 0;
      let baseHeight = 0;
      let previousOverflow = "";
      let previousFocus = null;
      const applyZoom = () => {
        if (!baseWidth || !baseHeight) return;
        const width = Math.round(baseWidth * zoom);
        const height = Math.round(baseHeight * zoom);
        preview.style.width = width + "px";
        preview.style.height = height + "px";
        zoomReset.textContent = Math.round(zoom * 100) + "%";
        lightbox.classList.toggle("is-zoomed", zoom > 1);
      };
      const closePreview = () => {
        if (lightbox.hidden) return;
        lightbox.hidden = true;
        document.body.style.overflow = previousOverflow;
        preview.removeAttribute("src");
        preview.style.width = "";
        preview.style.height = "";
        if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === "function") previousFocus.focus({preventScroll:true});
      };
      const openPreview = image => {
        const source = image.currentSrc || image.src;
        if (!source) return;
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        title.textContent = image.dataset.previewTitle || image.getAttribute("title") || image.alt || "Image preview";
        preview.alt = title.textContent;
        preview.src = source;
        zoom = 1;
        baseWidth = 0;
        baseHeight = 0;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        close.focus({preventScroll:true});
        const sizeImage = () => {
          if (!preview.naturalWidth || !preview.naturalHeight) return;
          const availableWidth = Math.max(180, window.innerWidth - 32);
          const availableHeight = Math.max(180, window.innerHeight - 112);
          const fit = Math.min(availableWidth / preview.naturalWidth, availableHeight / preview.naturalHeight, 1);
          baseWidth = Math.max(1, Math.round(preview.naturalWidth * fit));
          baseHeight = Math.max(1, Math.round(preview.naturalHeight * fit));
          applyZoom();
          stage.scrollTop = 0; stage.scrollLeft = 0;
        };
        if (preview.complete) sizeImage();
        else preview.onload = sizeImage;
        preview.onerror = () => { title.textContent = "Image could not be loaded"; };
      };
      zoomIn.addEventListener("click", () => { zoom = Math.min(5, +(zoom + 0.25).toFixed(2)); applyZoom(); });
      zoomOut.addEventListener("click", () => { zoom = Math.max(0.5, +(zoom - 0.25).toFixed(2)); applyZoom(); });
      zoomReset.addEventListener("click", () => { zoom = 1; applyZoom(); stage.scrollTop = 0; stage.scrollLeft = 0; });
      preview.addEventListener("click", () => {
        zoom = zoom > 1 ? 1 : Math.min(2, zoom + 0.5);
        applyZoom();
      });
      // Mobile pinch-to-zoom and one-finger panning while zoomed.
      let pinchStartDistance = 0;
      let pinchStartZoom = 1;
      let lastTouchX = 0;
      let lastTouchY = 0;
      const touchDistance = touches => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
      };
      stage.addEventListener("touchstart", event => {
        if (event.touches.length === 2) {
          pinchStartDistance = touchDistance(event.touches);
          pinchStartZoom = zoom;
        } else if (event.touches.length === 1) {
          lastTouchX = event.touches[0].clientX;
          lastTouchY = event.touches[0].clientY;
        }
      }, {passive:true});
      stage.addEventListener("touchmove", event => {
        if (event.touches.length === 2) {
          event.preventDefault();
          const distance = touchDistance(event.touches);
          if (pinchStartDistance > 0) {
            zoom = Math.max(0.5, Math.min(5, pinchStartZoom * distance / pinchStartDistance));
            applyZoom();
          }
        } else if (event.touches.length === 1 && zoom > 1) {
          event.preventDefault();
          const touch = event.touches[0];
          stage.scrollLeft -= touch.clientX - lastTouchX;
          stage.scrollTop -= touch.clientY - lastTouchY;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
        }
      }, {passive:false});
      stage.addEventListener("touchend", event => {
        if (event.touches.length < 2) pinchStartDistance = 0;
        if (event.touches.length === 1) {
          lastTouchX = event.touches[0].clientX;
          lastTouchY = event.touches[0].clientY;
        }
      }, {passive:true});
      stage.addEventListener("touchcancel", () => { pinchStartDistance = 0; }, {passive:true});
      close.addEventListener("click", closePreview);
      lightbox.addEventListener("click", event => { if (event.target === lightbox) closePreview(); });
      document.addEventListener("keydown", event => {
        if (lightbox.hidden) return;
        if (event.key === "Escape") { event.preventDefault(); closePreview(); }
        else if (event.key === "+" || event.key === "=") { zoom = Math.min(5, +(zoom + 0.25).toFixed(2)); applyZoom(); }
        else if (event.key === "-") { zoom = Math.max(0.5, +(zoom - 0.25).toFixed(2)); applyZoom(); }
        else if (event.key === "0") { zoom = 1; applyZoom(); stage.scrollTop = 0; stage.scrollLeft = 0; }
      });
      window.addEventListener("resize", () => {
        if (lightbox.hidden || !preview.naturalWidth || !preview.naturalHeight) return;
        const factor = Math.min((window.innerWidth - 32) / preview.naturalWidth, (window.innerHeight - 112) / preview.naturalHeight, 1);
        baseWidth = Math.max(1, Math.round(preview.naturalWidth * factor));
        baseHeight = Math.max(1, Math.round(preview.naturalHeight * factor));
        applyZoom();
      });

      const imageTitle = image => {
        const explicit = image.getAttribute("data-preview-title") || image.getAttribute("title") || image.getAttribute("alt");
        if (explicit && explicit.trim()) return explicit.trim();
        const figure = image.closest("figure");
        const caption = figure && figure.querySelector("figcaption");
        if (caption && caption.textContent.trim()) return caption.textContent.trim();
        const tile = image.parentElement;
        const tileCaption = tile && tile.querySelector("figcaption, p");
        if (tileCaption && tileCaption.textContent.trim()) return tileCaption.textContent.trim();
        const content = image.closest("article, .home-content-card, .dashboard-crud-card, .stored-html-page, .gallery-page");
        const heading = content && content.querySelector("h1, h2, h3, h4");
        if (heading && heading.textContent.trim()) return heading.textContent.trim();
        return "Image preview";
      };
      document.addEventListener("click", event => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const image = target.closest("img");
        if (!image || lightbox.contains(image) || image.closest(".header-home-link, .home-album-open, .home-album-cover-slideshow")) return;
        if (image.closest("[data-no-image-preview], .dg-no-image-preview")) return;
        if (image.closest("button, [role='button']") && image.closest(".home-album-open")) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        image.dataset.previewTitle = imageTitle(image);
        openPreview(image);
      }, true);
    })();

    // The header favicon is a navigation control, never an image-preview target.
    document.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const homeControl = target.closest(".header-home-link");
      if (!homeControl) return;
      event.preventDefault();
      event.stopPropagation();
      document.querySelector('.menu-link[data-page="Home"]')?.click();
    }, true);

    let activeSession = null;
    const getUiLanguage = () => window.DalimgariI18n?.getLanguage?.() === "en" ? "en" : "bn";
    const localizedSiteTitle = config => {
      const general = config?.ui_settings_general || {};
      const identity = config?.ui_customization_identity || {};
      const englishTitle = String(general.site_title || identity.site_title || "Dalimgari").trim() || "Dalimgari";
      const bengaliTitle = String(general.site_title_bn || identity.site_title_bn || (englishTitle === "Dalimgari" ? "ডালিমগাড়ী" : englishTitle)).trim() || "ডালিমগাড়ী";
      return getUiLanguage() === "en" ? englishTitle : bengaliTitle;
    };
    const localizedRecordValue = (record, field) => {
      if (!record) return "";
      const lang = getUiLanguage();
      const preferred = record[field + "_" + lang];
      const alternate = record[field + "_" + (lang === "en" ? "bn" : "en")];
      const legacy = record[field];
      return String(preferred ?? "").trim() ? preferred : (String(alternate ?? "").trim() ? alternate : (legacy ?? ""));
    };
    // Media metadata uses the same language fallback as every other bilingual record.
    const localizedMediaValue = (item, field = "title") => {
      const value = localizedRecordValue(item, field);
      if (String(value ?? "").trim()) return value;
      if (field === "title") return item?.name || item?.original_filename || item?.path || item?.storage_path || "";
      return "";
    };

    function updateAuthMenu(session) {
      activeSession = session || null;
      const loginAction = document.querySelector('.menu-link[data-page="Login"], .menu-link[data-page="Logout"]');
      if (loginAction) {
        const signedIn = Boolean(activeSession);
        loginAction.dataset.page = signedIn ? "Logout" : "Login";
        loginAction.textContent = signedIn ? "Logout" : "Login";
        loginAction.setAttribute("aria-label", signedIn ? "Log out of your account" : "Log in to your account");
      }
      const dashboardAction = document.querySelector('.menu-link[data-page="Dashboard"]');
      const role = String((activeSession && activeSession.user && activeSession.user.app_metadata && activeSession.user.app_metadata.role) || "").toLowerCase();
      if (dashboardAction) dashboardAction.hidden = role !== "admin" || dashboardAction.getAttribute("aria-current") === "page";
    }

    const allowedContentMediaBuckets = new Set(["content-files", "hero-images", "profile-pictures"]);
    const contentMediaUrlCache = new Map();
    const contentMediaUrlPending = new Map();
    const CONTENT_MEDIA_URL_CACHE_TTL_MS = 50 * 60 * 1000;

    async function createContentMediaUrl(path, bucket = "content-files", transform = null) {
      const normalizedPath = typeof path === "string" ? path.trim().replace(/^\/+/, "") : "";
      const bucketId = allowedContentMediaBuckets.has(String(bucket)) ? String(bucket) : "content-files";
      if (!normalizedPath) return "";
      const normalizedTransform = transform && typeof transform === "object"
        ? Object.fromEntries(Object.entries(transform).filter(([key, value]) =>
            ["width", "height", "quality", "resize", "format"].includes(key) && value != null
          ))
        : null;
      const transformKey = normalizedTransform && Object.keys(normalizedTransform).length
        ? ":" + JSON.stringify(normalizedTransform)
        : "";
      const cacheKey = bucketId + ":" + normalizedPath + transformKey;
      const cached = contentMediaUrlCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) return cached.url;
      if (cached) contentMediaUrlCache.delete(cacheKey);
      const pending = contentMediaUrlPending.get(cacheKey);
      if (pending) return pending;

      const request = (async () => {
        const storage = supabaseClient.storage.from(bucketId);
        let result = normalizedTransform && Object.keys(normalizedTransform).length
          ? await storage.createSignedUrl(normalizedPath, 3600, { transform: normalizedTransform })
          : await storage.createSignedUrl(normalizedPath, 3600);
        // Keep the original image as a safe fallback when Storage image transformations
        // are unavailable for this project or object.
        if (result.error && normalizedTransform && Object.keys(normalizedTransform).length) {
          result = await storage.createSignedUrl(normalizedPath, 3600);
        }
        if (result.error) {
          console.warn("Could not create a content media URL:", result.error.message);
          return "";
        }
        const url = result.data?.signedUrl || "";
        if (url) contentMediaUrlCache.set(cacheKey, { url, expiresAt: Date.now() + CONTENT_MEDIA_URL_CACHE_TTL_MS });
        return url;
      })().finally(() => contentMediaUrlPending.delete(cacheKey));
      contentMediaUrlPending.set(cacheKey, request);
      return request;
    }
    async function mapWithConcurrency(items, concurrency, mapper) {
      const results = new Array(items.length);
      let nextIndex = 0;
      const workerCount = Math.min(items.length, Math.max(1, Math.floor(concurrency) || 1));
      await Promise.all(Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          results[index] = await mapper(items[index], index);
        }
      }));
      return results;
    }

    // Signed URLs expire. If an image fails to load, refresh its URL once instead of
    // leaving a broken image when a page has remained open beyond the URL lifetime.
    function attachSignedImageRefresh(image, path, bucket = "content-files") {
      let refreshed = false;
      image.addEventListener("error", async () => {
        if (refreshed || !image.isConnected) return;
        refreshed = true;
        const freshUrl = await createContentMediaUrl(path, bucket);
        if (freshUrl && image.isConnected) image.src = freshUrl;
      }, { once: true });
    }

    async function renderContentMedia(container, media) {
      if (!Array.isArray(media) || !media.length) return;
      const gallery = document.createElement("div");
      gallery.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:18px";
      // Keep a small concurrency limit: sequential signed-URL requests made pages with several files slow,
      // while unbounded Promise.all can overwhelm the Storage API on large galleries.
      const resolvedItems = [];
      for (let start = 0; start < media.length; start += 6) {
        const batch = await Promise.all(media.slice(start, start + 6).map(async item => {
          if (!item || typeof item !== "object") return null;
          const path = item.path || item.storage_path;
          const bucket = item.storage_bucket || item.bucket || "content-files";
          const url = await createContentMediaUrl(path, bucket);
          return url ? { item, url, path, bucket } : null;
        }));
        resolvedItems.push(...batch);
      }
      for (const resolved of resolvedItems) {
        if (!resolved) continue;
        const { item, url } = resolved;
        const tile = document.createElement("div");
        tile.style.cssText = "min-width:0;padding:10px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:10px;overflow-wrap:anywhere";
        if (String(item.mime_type || "").startsWith("image/")) {
          const image = document.createElement("img"); image.alt = localizedMediaValue(item,"alt_text") || localizedMediaValue(item,"title"); image.loading = "lazy"; attachSignedImageRefresh(image, resolved.path, resolved.bucket); image.src = url;
          image.style.cssText = "display:block;width:100%;max-height:320px;object-fit:contain;border-radius:6px"; tile.append(image);
        } else if (String(item.mime_type || "").startsWith("video/")) {
          const video = document.createElement("video"); video.src = url; video.controls = true;
          video.style.cssText = "display:block;width:100%;max-height:320px;border-radius:6px"; tile.append(video);
        } else if (String(item.mime_type || "").startsWith("audio/")) {
          const audio = document.createElement("audio"); audio.src = url; audio.controls = true; audio.style.width = "100%"; tile.append(audio);
        } else {
          // Do not expose a direct file-opening/download link from public content views.
          const fileLabel = document.createElement("span");
          fileLabel.textContent = localizedMediaValue(item,"title") || "File";
          fileLabel.setAttribute("aria-label", "File attachment");
          fileLabel.style.cssText = "display:block;padding:12px;overflow-wrap:anywhere";
          tile.append(fileLabel);
        }
        if (localizedMediaValue(item,"title")) { const caption=document.createElement("p"); caption.textContent=localizedMediaValue(item,"title"); caption.style.cssText="margin:8px 0 0;font-size:var(--dg-font-size-sm)"; tile.append(caption); }
        gallery.append(tile);
      }
      if (gallery.childElementCount) container.append(gallery);
    }


    let dalimgariRuntimeConfig = {};
    let dalimgariSiteConfigCache = null;
    let dalimgariSiteConfigPromise = null;
    let dalimgariSiteConfigRequestId = 0;
    let dalimgariHomeObserver = null;
    // Loads public-safe configuration once per page lifecycle; force=true refreshes after dashboard saves.
    async function applyDalimgariSiteConfig(force=false) {
      const keys=["ui_customization_identity","ui_customization_theme","ui_customization_header_footer","ui_customization_layout","ui_customization_typography","ui_customization_responsive","ui_customization_components","ui_customization_media","ui_customization_page_style","ui_customization_effects","ui_customization_hero","ui_settings_general","ui_settings_homepage_defaults","ui_settings_content_defaults","ui_settings_users_access","ui_settings_privacy_visibility","ui_settings_maintenance_features"];
      if (force) {
        dalimgariSiteConfigCache = null;
        dalimgariSiteConfigPromise = null;
        dalimgariSiteConfigRequestId += 1;
      }
      let cfg = dalimgariSiteConfigCache;
      if (!cfg) {
        if (!dalimgariSiteConfigPromise) {
          const requestId = ++dalimgariSiteConfigRequestId;
          dalimgariSiteConfigPromise = (async () => {
            try {
              const {data,error}=await supabaseClient.from("site_customizations").select("key,value").in("key",keys);
              if(error){console.warn("Site configuration could not be loaded:",error.message);return null;}
              const parsed={};
              for(const row of data||[]){let value=row.value||{};if(typeof value==="string"){try{value=JSON.parse(value)}catch(_){value={}}}parsed[row.key]=value&&typeof value==="object"?value:{};}
              if (requestId === dalimgariSiteConfigRequestId) dalimgariSiteConfigCache = parsed;
              return parsed;
            } catch (error) {
              console.warn("Site configuration could not be loaded:", error);
              return null;
            }
          })();
        }
        const pending = dalimgariSiteConfigPromise;
        cfg = await pending;
        if (dalimgariSiteConfigPromise === pending) dalimgariSiteConfigPromise = null;
      }
      if (!cfg) return {};
      dalimgariRuntimeConfig = cfg;
      const identity=cfg.ui_customization_identity||{}, general=cfg.ui_settings_general||{};
      // Use only the administrator-uploaded favicon. No bundled/default icon is applied.
      const faviconDataUrl = typeof general.favicon_data_url === "string" &&
        /^data:image\/(?:png|gif|x-icon|vnd\.microsoft\.icon);base64,/i.test(general.favicon_data_url)
        ? general.favicon_data_url : "";
      let faviconLink = document.querySelector('link[rel~="icon"]');
      const headerFavicon = document.querySelector(".header-favicon");
      if (faviconDataUrl) {
        if (!faviconLink) {
          faviconLink = document.createElement("link");
          faviconLink.rel = "icon";
          document.head.append(faviconLink);
        }
        faviconLink.href = faviconDataUrl;
        faviconLink.type = faviconDataUrl.startsWith("data:image/png") ? "image/png" :
          (faviconDataUrl.startsWith("data:image/gif") ? "image/gif" : "image/x-icon");
        if (headerFavicon) {
          headerFavicon.src = faviconDataUrl;
          headerFavicon.hidden = false;
        }
      } else {
        if (faviconLink) faviconLink.remove();
        if (headerFavicon) {
          headerFavicon.removeAttribute("src");
          headerFavicon.hidden = true;
        }
      }
      const theme=cfg.ui_customization_theme||{}, header=cfg.ui_customization_header_footer||{};
      const layout=cfg.ui_customization_layout||{}, typography=cfg.ui_customization_typography||{};
      const responsive=cfg.ui_customization_responsive||{}, components=cfg.ui_customization_components||{}, media=cfg.ui_customization_media||{}, pageStyle=cfg.ui_customization_page_style||{}, effects=cfg.ui_customization_effects||{}, heroVisual=cfg.ui_customization_hero||{}, features=cfg.ui_settings_maintenance_features||{};
      const homepageDefaults=cfg.ui_settings_homepage_defaults||{};
      const title=getUiLanguage()==="en"
        ? (String(general.site_title||identity.site_title||"Dalimgari").trim()||"Dalimgari")
        : (String(general.site_title_bn||identity.site_title_bn||(String(general.site_title||identity.site_title||"Dalimgari").trim()==="Dalimgari"?"ডালিমগাড়ী":general.site_title||identity.site_title||"ডালিমগাড়ী")).trim()||"ডালিমগাড়ী");
      document.title=title;
      let descriptionMeta=document.querySelector('meta[name="description"]');
      if(!descriptionMeta){descriptionMeta=document.createElement("meta");descriptionMeta.name="description";document.head.append(descriptionMeta);}
      descriptionMeta.content=String(general.site_description||"").trim();
      const titleLabel=document.querySelector("#current-page-label");
      if(titleLabel && (!titleLabel.textContent || titleLabel.textContent==="Home"))titleLabel.textContent=window.DalimgariI18n?.t?.("Home") || "Home";
      const root=document.documentElement;
      const validColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||""))?String(value):"";
      const setColor=(token,value)=>{const color=validColor(value);if(color)root.style.setProperty(token,color);};
      setColor("--dg-primary",theme.primary_color);
      setColor("--dg-secondary",theme.secondary_color);
      setColor("--dg-bg",theme.background_color);
      setColor("--dg-surface",theme.surface_color);
      setColor("--dg-text",theme.text_color);
      setColor("--dg-muted",theme.muted_text_color);
      setColor("--dg-border",theme.border_color);
      setColor("--dg-link",theme.link_color);
      setColor("--dg-success",theme.success_color);
      setColor("--dg-warning",theme.warning_color);
      setColor("--dg-error",theme.error_color);
      const setBoundedNumber=(token,value,min,max,suffix="px")=>{const n=Number(value);if(Number.isFinite(n)&&n>=min&&n<=max)root.style.setProperty(token,n+suffix);};
      setBoundedNumber("--dg-card-radius",theme.card_radius,0,32);
      setBoundedNumber("--dg-control-radius",theme.control_radius,0,24);
      const shadow=Number(theme.shadow_strength);
      if(Number.isFinite(shadow)&&shadow>=0&&shadow<=30)root.style.setProperty("--dg-shadow-opacity",(shadow/100).toFixed(2));
      setBoundedNumber("--dg-line-height",typography.line_height,1.2,2.2,"");
      setBoundedNumber("--dg-section-gap",layout.section_gap,0,64);
      setBoundedNumber("--dg-card-gap",layout.card_gap,0,48);
      setBoundedNumber("--dg-card-padding",components.card_padding,0,40);
      setBoundedNumber("--dg-button-height",components.button_height,32,64);
      setBoundedNumber("--dg-input-height",components.input_height,32,64);
      setBoundedNumber("--dg-image-radius",media.image_radius,0,32);
      setBoundedNumber("--dg-transition",effects.transition_speed,0,600,"ms");
      setBoundedNumber("--dg-header-height",header.header_height,44,120);
      let configStyle=document.getElementById("dalimgari-runtime-theme");
      if(!configStyle){configStyle=document.createElement("style");configStyle.id="dalimgari-runtime-theme";document.head.append(configStyle);}
      const safeWidth=Number(pageStyle.page_content_width);
      const safeTitleSize=Number(pageStyle.page_title_size);
      const safeParagraphSpacing=Number(pageStyle.paragraph_spacing);
      const safeMenuGap=Number(header.menu_gap);
      const safeColumns=Number(media.gallery_columns);
      const animationRule=effects.animations_enabled===false ? " *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" : "";
      // The page canvas uses one solid background color. Header styling is confined
      // to the floating header surface and must not introduce a page background image.
      const backgroundImageRule="body::before{background-image:none;opacity:0}";
      const heroOverlayHex=/^#[0-9a-f]{6}$/i.test(String(heroVisual.overlay_color||""))?String(heroVisual.overlay_color):"#0f172a";
      const heroOverlayRgb=heroOverlayHex.match(/[0-9a-f]{2}/ig).map(part=>parseInt(part,16)).join(",");
      const heroOverlayOpacity=Math.max(0,Math.min(90,Number(heroVisual.overlay_opacity)||0))/100;
      const heroImageFit=["cover","contain"].includes(heroVisual.image_fit)?heroVisual.image_fit:"cover";
      const heroImagePosition=["center","top","bottom","left","right"].includes(heroVisual.image_position)?heroVisual.image_position:"center";
      const themeComponentRules = [
        ".home-page .home-page-pill{background-color:var(--dg-surface,#fff)!important;border-color:var(--dg-primary,#222)!important;color:var(--dg-primary,#222)!important}",
        ".home-page .home-page-pill:hover,.home-page .home-page-pill:focus-visible{background-color:var(--dg-primary,#222)!important;border-color:var(--dg-primary,#222)!important;color:#fff!important}",
        ".home-page .home-page-html-card{background-color:var(--dg-surface,#fff)!important;border-color:var(--dg-border,#e5e7eb)!important;color:var(--dg-text,#222)!important}",
        ".home-page .home-page-html-card>h2,.home-page .home-page-html-card>h3{color:var(--dg-text,#222)!important}",
        ".home-page .home-page-html-preview{background-color:var(--dg-surface,#fff)!important;border-color:var(--dg-border,#e5e7eb)!important;color:var(--dg-text,#222)!important}",
        ".home-page .home-page-html-preview :is(h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,figcaption,td,th,label){color:var(--dg-text,#222)!important}",
        ".home-page .home-page-html-preview a{color:var(--dg-link,var(--dg-primary,#222))!important}",
        ".home-page .home-page-html-preview :is(button,[role='button'],input[type='button'],input[type='submit']){background-color:var(--dg-primary,#222)!important;border-color:var(--dg-primary,#222)!important;color:#fff!important}",
        ".home-page .home-page-html-card>a,.home-page .home-hero a[role='button'],.home-page .home-hero button{background-color:var(--dg-primary,#222)!important;border-color:var(--dg-primary,#222)!important;color:#fff!important}",
        ".home-page .home-content-card{background-color:var(--dg-surface,#fff)!important;border-color:var(--dg-border,#e5e7eb)!important;color:var(--dg-text,#222)!important}",
        ".home-page .home-content-card :is(h1,h2,h3,h4){color:var(--dg-text,#222)!important}",
        ".home-page .home-content-card p{color:var(--dg-muted,#666)!important}"
      ].join("\n");
      configStyle.textContent=[
        backgroundImageRule,
        themeComponentRules,
        safeWidth>=640&&safeWidth<=1800?".stored-html-page,.gallery-page{max-width:"+safeWidth+"px!important}":"",
        safeTitleSize>=20&&safeTitleSize<=56?".stored-html-page h1,.gallery-page h1{font-size:"+safeTitleSize+"px!important}":"",
        safeParagraphSpacing>=0&&safeParagraphSpacing<=48?".stored-html-page p{margin-bottom:"+safeParagraphSpacing+"px!important}":"",
        safeMenuGap>=0&&safeMenuGap<=32?".floating-menu{gap:"+safeMenuGap+"px!important}":"",
        safeColumns>=1&&safeColumns<=6?".gallery-page .gallery-grid,.gallery-page .media-grid{grid-template-columns:repeat("+safeColumns+",minmax(0,1fr))!important}":"",
        media.image_fit==="contain"?".home-page img,.gallery-page img,.stored-html-page img{object-fit:contain!important}":media.image_fit==="cover"?".home-page img,.gallery-page img,.stored-html-page img{object-fit:cover!important}":"",
        animationRule,
        Number(heroVisual.desktop_height)>=180&&Number(heroVisual.desktop_height)<=900?".home-hero-image-frame{height:"+Number(heroVisual.desktop_height)+"px!important;aspect-ratio:auto!important}":"",
        Number(heroVisual.desktop_height)===0?".home-hero-image-frame{height:auto!important;aspect-ratio:16/9!important}":"",
        Number(heroVisual.mobile_height)>=140&&Number(heroVisual.mobile_height)<=700?"@media(max-width:600px){.home-hero-image-frame{height:"+Number(heroVisual.mobile_height)+"px!important;aspect-ratio:auto!important}}":"",
        Number(heroVisual.mobile_height)===0?"@media(max-width:600px){.home-hero-image-frame{height:auto!important;aspect-ratio:16/9!important}}":"",
        Number(heroVisual.border_radius)>=0&&Number(heroVisual.border_radius)<=48?".home-hero-image-frame{border-radius:"+Number(heroVisual.border_radius)+"px!important}":"",
        Number(heroVisual.heading_width)>=320&&Number(heroVisual.heading_width)<=1200?".home-hero-text-overlay h1{max-width:"+Number(heroVisual.heading_width)+"px!important}":"",
        Number(heroVisual.description_width)>=280&&Number(heroVisual.description_width)<=1200?".home-hero-text-overlay p:not(.home-tagline){max-width:"+Number(heroVisual.description_width)+"px!important}":"",
        heroVisual.text_align==="left"?".home-hero-text-overlay{align-items:flex-start!important;text-align:left!important}":heroVisual.text_align==="right"?".home-hero-text-overlay{align-items:flex-end!important;text-align:right!important}":".home-hero-text-overlay{align-items:center!important;text-align:center!important}",
        heroVisual.vertical_align==="top"?".home-hero-text-overlay{justify-content:flex-start!important}":heroVisual.vertical_align==="bottom"?".home-hero-text-overlay{justify-content:flex-end!important}":".home-hero-text-overlay{justify-content:center!important}",
        /^#[0-9a-f]{6}$/i.test(String(heroVisual.text_color||""))?".home-hero-text-overlay{color:"+String(heroVisual.text_color)+"!important}":"",
        /^#[0-9a-f]{6}$/i.test(String(heroVisual.heading_color||""))?".home-hero-text-overlay h1{color:"+String(heroVisual.heading_color)+"!important}":"",
        /^#[0-9a-f]{6}$/i.test(String(heroVisual.description_color||""))?".home-hero-text-overlay p:not(.home-tagline){color:"+String(heroVisual.description_color)+"!important}":"",
        /^#[0-9a-f]{6}$/i.test(String(heroVisual.tagline_color||""))?".home-hero-text-overlay .home-tagline{color:"+String(heroVisual.tagline_color)+"!important}":"",
        heroVisual.show_tagline===false?".home-hero-text-overlay .home-tagline{display:none!important}":"",
        heroVisual.image_fit?".home-hero-image-frame > img{object-fit:"+heroImageFit+"!important}":"",
        heroVisual.image_position?".home-hero-image-frame > img{object-position:"+heroImagePosition+"!important}":"",
        Object.prototype.hasOwnProperty.call(heroVisual,"overlay_enabled")&&heroVisual.overlay_enabled===false?".home-hero-image-frame > div[aria-hidden='true']{display:none!important}":"",
        Object.prototype.hasOwnProperty.call(heroVisual,"overlay_enabled")&&heroVisual.overlay_enabled!==false?".home-hero-image-frame > div[aria-hidden='true']{display:block!important;background:linear-gradient(90deg,rgba("+heroOverlayRgb+","+heroOverlayOpacity+"),rgba("+heroOverlayRgb+","+(heroOverlayOpacity*0.42)+"),rgba("+heroOverlayRgb+","+heroOverlayOpacity+"))!important}":""
      ].filter(Boolean).join("\n");
      if(typography.font_family&&typography.font_family!=="system")document.body.style.fontFamily=typography.font_family;
      else document.body.style.removeProperty("font-family");
      if(Number(typography.base_font_size)>=12&&Number(typography.base_font_size)<=22)document.body.style.fontSize=Number(typography.base_font_size)+"px";
      const siteHeader=document.querySelector("body > header"), siteFooter=document.querySelector("body > footer");
      if(siteHeader){siteHeader.hidden=header.show_header===false;siteHeader.style.position=header.header_sticky===false?"relative":"sticky";}
      if(siteFooter){siteFooter.hidden=header.show_footer===false;if(header.footer_text)siteFooter.textContent=header.footer_text;}
      const home=document.querySelector(".home-page");
      if(home){
        const width=Number(responsive.content_width);
        if(width>=640&&width<=1800)home.style.maxWidth=width+"px";
        const padding=Number(responsive.mobile_padding);
        if(padding>=8&&padding<=32)home.style.paddingLeft=padding+"px",home.style.paddingRight=padding+"px";
        const sectionMap={"hero":".home-hero","page_title":".home-page-title","widget":".home-widget","album":".home-album","page_card":".home-page-card"};
        for(const [key,selector] of Object.entries(sectionMap)){
          const el=home.querySelector(selector);if(!el)continue;
          const field="show_"+key;
          if(key!=="page_title"&&Object.prototype.hasOwnProperty.call(layout,field))el.hidden=!layout[field];
          if(features.enable_homepage_media===false&&(key==="widget"||key==="album"))el.hidden=true;
        }
        if(Array.isArray(layout.section_order)){
          const ordered=layout.section_order.map(key=>sectionMap[key]).filter(Boolean).map(selector=>home.querySelector(selector)).filter(Boolean);
          const rest=Array.from(home.children).filter(el=>!ordered.includes(el));
          home.append(...ordered,...rest);
        }
        if(dalimgariHomeObserver){dalimgariHomeObserver.disconnect();dalimgariHomeObserver=null;}
        const syncEmptySections=()=>{
          for(const [key,selector] of Object.entries(sectionMap)){
            const el=home.querySelector(selector);if(!el)continue;
            const field="show_"+key;
            const disabledByLayout=key!=="page_title"&&Object.prototype.hasOwnProperty.call(layout,field)&&layout[field]===false;
            const disabledByFeature=features.enable_homepage_media===false&&(key==="widget"||key==="album");
            const empty=!el.classList.contains("is-loading")&&!el.textContent.trim()&&!el.querySelector("img,video,iframe,canvas,button,a");
            el.hidden=disabledByLayout||disabledByFeature||(!homepageDefaults.show_empty_sections&&empty);
          }
        };
        if(!homepageDefaults.show_empty_sections&&typeof MutationObserver!=="undefined"){
          dalimgariHomeObserver=new MutationObserver(syncEmptySections);
          dalimgariHomeObserver.observe(home,{subtree:true,childList:true,characterData:true});
        }
        syncEmptySections();
      }
      return cfg;
    }

    async function renderGalleryPage(initialAlbumId=null, session=null) {
      const params=new URLSearchParams(window.location.hash.includes("?")?window.location.hash.split("?").slice(1).join("?"):"");
      const selectedAlbumId=initialAlbumId||params.get("album")||"";
      const initialView=params.get("view")||"all";
      const siteConfig=await applyDalimgariSiteConfig();
      document.title=localizedSiteTitle(siteConfig);
      mainContent.style.alignItems="flex-start";
      mainContent.style.justifyContent="flex-start";

      const shell=document.createElement("section");
      shell.className="gallery-page";
      shell.style.cssText="width:100%;max-width:1200px;min-width:0;margin:0 auto;padding:24px 16px 40px;box-sizing:border-box";
      const nav=document.createElement("nav");
      nav.setAttribute("aria-label","Gallery filters and albums");
      nav.style.cssText="position:sticky;top:104px;z-index:9;display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;overflow-y:hidden;padding:10px 2px 12px;margin:0 0 22px;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);overscroll-behavior-x:contain;scrollbar-width:thin";
      const view=document.createElement("div");
      view.className="gallery-view";
      view.style.cssText="width:100%;min-width:0";
      shell.append(nav,view);
      mainContent.replaceChildren(shell);

      const pill=(label,kind,value,active)=>{
        const button=document.createElement("button");
        button.type="button";
        button.className="gallery-pill";
        button.textContent=label;
        button.dataset.kind=kind;
        if(value)button.dataset.value=value;
        button.setAttribute("aria-pressed",String(active));
        button.style.cssText="flex:0 0 auto;min-height:40px;padding:0 16px;border:1px solid "+(active?"#222":"#dedede")+";border-radius:999px;background:"+(active?"#222":"#fff")+";color:"+(active?"#fff":"#333")+";font:inherit;font-size:var(--dg-font-size-base);font-weight:var(--dg-font-weight-semibold);white-space:nowrap;cursor:pointer";
        nav.append(button);
        return button;
      };
      const allPill=pill("All","view","all",!selectedAlbumId&&initialView==="all");
      const photoPill=pill("Photo","view","photo",!selectedAlbumId&&initialView==="photo");
      const videoPill=pill("Video","view","video",!selectedAlbumId&&initialView==="video");

      const [albumResult,postResult,pageResult,heroResult]=await Promise.all([
        supabaseClient.from("albums").select("id,title,title_bn,title_en,description,description_bn,description_en,url,cover_path,media,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(200),
        supabaseClient.from("post").select("id,title,title_bn,title_en,caption_bn,caption_en,media,visibility,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(500),
        supabaseClient.from("pages").select("id,title,title_bn,title_en,media,visibility,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(500),
        supabaseClient.from("hero_items").select("id,title,media,visibility,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(200)
      ]);
      const albums=!albumResult.error&&Array.isArray(albumResult.data)?albumResult.data:[];
      const sources=[
        ...(Array.isArray(postResult.data)?postResult.data:[]),
        ...(Array.isArray(pageResult.data)?pageResult.data:[]),
        ...(Array.isArray(heroResult.data)?heroResult.data:[])
      ];
      const mediaForAlbum=album=>Array.isArray(album.media)?album.media.filter(item=>item&&(item.path||item.storage_path)):[];
      const inferMime=item=>{
        if(item.mime_type)return String(item.mime_type).toLowerCase();
        const path=String(item.path||item.storage_path||item.name||"").toLowerCase().split("?")[0];
        if(/\.(jpe?g|png|gif|webp|avif|bmp|svg)$/.test(path))return "image/unknown";
        if(/\.(mp4|webm|mov|m4v|ogv)$/.test(path))return "video/unknown";
        if(/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(path))return "audio/unknown";
        return "application/octet-stream";
      };
      const uniqueMedia=[];
      const seen=new Set();
      const addMedia=(raw,sourceTitle="")=>{
        if(!raw||!(raw.path||raw.storage_path))return;
        const item={...raw,mime_type:inferMime(raw),source_title:sourceTitle||raw.source_title||""};
        const pathKey="path:"+String(item.path||item.storage_path);
        const idKey=item.media_id?"id:"+String(item.media_id):"";
        if(seen.has(pathKey)||(idKey&&seen.has(idKey)))return;
        seen.add(pathKey);
        if(idKey)seen.add(idKey);
        uniqueMedia.push(item);
      };
      for(const album of albums){
        for(const item of mediaForAlbum(album))addMedia(item,album.title);
        if(album.cover_path)addMedia({path:album.cover_path,mime_type:"image/unknown",title:localizedRecordValue(album,"title"),alt_text:localizedRecordValue(album,"title")},album.title);
      }
      for(const source of sources)for(const item of (Array.isArray(source.media)?source.media:[]))addMedia(item,localizedRecordValue(source,"title"));
      for(const album of albums)pill(localizedRecordValue(album,"title")||"Untitled","album",album.id,selectedAlbumId===album.id);

      const galleryLoaders = new WeakMap();
      const observedMediaTiles = new Set();
      const galleryMediaObserver = typeof IntersectionObserver === "function"
        ? new IntersectionObserver(entries => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              galleryMediaObserver.unobserve(entry.target);
              observedMediaTiles.delete(entry.target);
              const load = galleryLoaders.get(entry.target);
              if (load) load();
            }
          }, { rootMargin: "320px 0px" })
        : null;
      const galleryGrid=(items)=>{
        const container=document.createElement("div");
        container.style.cssText="width:100%;min-width:0";
        const grid=document.createElement("div");
        grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:14px;width:100%;min-width:0";
        const validItems=items.filter(item=>item&&(item.path||item.storage_path));
        let nextIndex=0;
        const batchSize=48;
        const appendBatch=()=>{
          const batch=validItems.slice(nextIndex,nextIndex+batchSize);
          nextIndex+=batch.length;
          for(const item of batch){
            const tile=document.createElement("figure");
            tile.style.cssText="min-width:0;margin:0;overflow:hidden;border-radius:10px;background:#f3f4f6";
            const mediaPath=item.path||item.storage_path;
            const mediaBucket=item.storage_bucket||item.bucket||"content-files";
            const mime=inferMime(item);
            let mediaElement;
            if(mime.startsWith("image/")){
              mediaElement=document.createElement("img");
              mediaElement.alt=localizedMediaValue(item,"alt_text")||localizedMediaValue(item,"title");
              mediaElement.loading="lazy";
              mediaElement.decoding="async";
              attachSignedImageRefresh(mediaElement,mediaPath,mediaBucket);
              mediaElement.style.cssText="display:block;width:100%;aspect-ratio:4/3;object-fit:cover";
            }else if(mime.startsWith("video/")){
              mediaElement=document.createElement("video");
              mediaElement.controls=true;
              mediaElement.preload="metadata";
              mediaElement.style.cssText="display:block;width:100%;aspect-ratio:4/3;object-fit:contain";
            }else if(mime.startsWith("audio/")){
              mediaElement=document.createElement("audio");
              mediaElement.controls=true;
              mediaElement.style.cssText="display:block;width:calc(100% - 20px);margin:10px";
            }else{
              // Keep non-previewable files listed without publishing a direct download URL.
              mediaElement=document.createElement("span");
              mediaElement.textContent=localizedMediaValue(item,"title")||"File";
              mediaElement.setAttribute("aria-label","File attachment");
              mediaElement.style.cssText="display:block;padding:18px;overflow-wrap:anywhere";
            }
            const loadMediaUrl=async()=>{
              const url=await createContentMediaUrl(mediaPath,mediaBucket);
              if(!tile.isConnected)return;
              if(!url){tile.remove();return;}
              if(["IMG","VIDEO","AUDIO"].includes(mediaElement.tagName))mediaElement.src=url;
            };
            if(galleryMediaObserver){
              galleryLoaders.set(tile,loadMediaUrl);
              observedMediaTiles.add(tile);
              galleryMediaObserver.observe(tile);
            }else{
              Promise.resolve().then(loadMediaUrl);
            }
            tile.append(mediaElement);
            const captionText=localizedMediaValue(item,"title");
            if(captionText){
              const caption=document.createElement("figcaption");
              caption.textContent=captionText;
              caption.style.cssText="padding:8px 10px;font-size:var(--dg-font-size-sm);line-height:1.4;overflow-wrap:anywhere";
              tile.append(caption);
            }
            grid.append(tile);
          }
          if(nextIndex<validItems.length){
            moreButton.hidden=false;
            moreButton.textContent="Load more ("+(validItems.length-nextIndex)+")";
          }else{
            moreButton.hidden=true;
          }
        };
        const moreButton=document.createElement("button");
        moreButton.type="button";
        moreButton.hidden=true;
        moreButton.style.cssText="display:block;margin:18px auto 0;min-height:40px;padding:8px 18px;border:1px solid var(--dg-border);border-radius:var(--dg-control-radius);background:var(--dg-surface);color:var(--dg-text);font:inherit;cursor:pointer";
        moreButton.addEventListener("click",appendBatch);
        container.append(grid,moreButton);
        appendBatch();
        return container;
      };
      const updatePills=(kind,value)=>{
        nav.querySelectorAll(".gallery-pill").forEach(button=>{
          const active=button.dataset.kind===kind&&button.dataset.value===value;
          button.setAttribute("aria-pressed",String(active));
          button.style.background=active?"#222":"#fff";
          button.style.color=active?"#fff":"#333";
          button.style.borderColor=active?"#222":"#dedede";
        });
      };
      const showView=(kind,value,writeHistory=true)=>{
        if(galleryMediaObserver){
          for(const tile of observedMediaTiles){
            if(view.contains(tile))galleryMediaObserver.unobserve(tile);
          }
          observedMediaTiles.clear();
        }
        view.replaceChildren();
        let items=[];
        if(kind==="album"){
          const album=albums.find(item=>item.id===value);
          if(!album){
            const message=document.createElement("p");message.textContent="This album is unavailable.";view.append(message);
            updatePills("view","all");return;
          }
          const albumTitle=localizedRecordValue(album,"title");
          const albumDescription=localizedRecordValue(album,"description");
          const title=document.createElement("h2");title.textContent=albumTitle||"Untitled";title.style.cssText="margin:0 0 8px;font-size:clamp(21px,3vw,28px)";
          view.append(title);
          if(albumDescription){
            const description=document.createElement("p");description.textContent=albumDescription;description.style.cssText="margin:0 0 18px;color:var(--dg-secondary);white-space:pre-wrap;line-height:1.6";view.append(description);
          }
          items=mediaForAlbum(album);
          if(album.cover_path&&!items.some(item=>(item.path||item.storage_path)===album.cover_path))items.push({path:album.cover_path,mime_type:"image/unknown",title:localizedRecordValue(album,"title"),alt_text:localizedRecordValue(album,"title")});
          if(items.length)view.append(galleryGrid(items));
          else{const empty=document.createElement("p");empty.textContent="No media in this album.";view.append(empty);}
          updatePills("album",value);
          if(writeHistory)history.pushState(null,"","#gallery?album="+encodeURIComponent(value));
        }else{
          const selected=kind==="photo"?uniqueMedia.filter(item=>inferMime(item).startsWith("image/")):kind==="video"?uniqueMedia.filter(item=>inferMime(item).startsWith("video/")):uniqueMedia;
          const title=document.createElement("h2");title.textContent=kind==="photo"?"Photo":kind==="video"?"Video":"All public media";title.style.cssText="margin:0 0 14px;font-size:clamp(20px,3vw,26px)";
          view.append(title);
          if(selected.length)view.append(galleryGrid(selected));
          else{const empty=document.createElement("p");empty.textContent="No public media found.";view.append(empty);}
          if(kind==="all"){
            for(const album of albums){
              const section=document.createElement("section");
              section.style.cssText="margin-top:32px;padding-top:22px;border-top:var(--dg-border-width) var(--dg-border-style) var(--dg-border)";
              const sectionTitle=document.createElement("h2");sectionTitle.textContent=localizedRecordValue(album,"title")||"Untitled";sectionTitle.style.cssText="margin:0 0 14px;font-size:clamp(19px,3vw,24px)";
              section.append(sectionTitle);
              const albumItems=mediaForAlbum(album);
              if(album.cover_path&&!albumItems.some(item=>(item.path||item.storage_path)===album.cover_path))albumItems.push({path:album.cover_path,mime_type:"image/unknown",title:localizedRecordValue(album,"title"),alt_text:localizedRecordValue(album,"title")});
              if(albumItems.length)section.append(galleryGrid(albumItems));
              else{const empty=document.createElement("p");empty.textContent="No media in this album.";section.append(empty);}
              view.append(section);
            }
          }
          updatePills("view",kind);
          if(writeHistory)history.pushState(null,"",kind==="all"?"#gallery":"#gallery?view="+encodeURIComponent(kind));
        }
        view.scrollIntoView({behavior:"smooth",block:"start"});
      };
      nav.addEventListener("click",event=>{
        const button=event.target.closest(".gallery-pill");
        if(!button)return;
        const kind=button.dataset.kind==="view"?button.dataset.value:button.dataset.kind;
        showView(kind,button.dataset.value||"all",true);
      });
      const selectedAlbum=albums.find(album=>album.id===selectedAlbumId);
      if(selectedAlbum)showView("album",selectedAlbum.id,false);
      else if(initialView==="photo"||initialView==="video")showView(initialView,initialView,false);
      else showView("all","all",false);
    }

    async function renderHome() {
      // Fetch the small homepage template while Supabase configuration and session checks run.
      const homeTemplatePromise = (async () => {
        try {
          const response = await fetch(new URL("home.html", window.location.href), { credentials: "same-origin" });
          if (!response.ok) throw new Error("home.html returned HTTP " + response.status);
          return { markup: await response.text(), error: null };
        } catch (error) {
          return { markup: null, error };
        }
      })();
      const [siteConfig, currentUser] = await Promise.all([
        applyDalimgariSiteConfig(),
        getCurrentUser()
      ]);
      const maintenance = siteConfig.ui_settings_maintenance_features || {};
      const currentRole = String((currentUser && currentUser.app_metadata && currentUser.app_metadata.role) || "").toLowerCase();
      if (maintenance.maintenance_mode && currentRole !== "admin") {
        const notice = document.createElement("section");
        notice.style.cssText = "width:min(100% - 32px,760px);margin:48px auto;padding:28px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-card-radius);background:var(--dg-surface);text-align:center";
        const heading = document.createElement("h1"); heading.textContent = "We’ll be back soon";
        const detail = document.createElement("p"); detail.textContent = "The website is temporarily under maintenance. Please check again later.";
        notice.append(heading, detail);
        mainContent.replaceChildren(notice);
        return;
      }
      const homepageDefaults = siteConfig.ui_settings_homepage_defaults || {};
      if (!window.location.hash && homepageDefaults.default_home_route === "login") {
        history.replaceState(null, "", "#login");
        renderPage("Login");
        return;
      }
      document.title = localizedSiteTitle(siteConfig);
      // Home content starts below the header instead of being vertically centered.
      mainContent.style.alignItems = "flex-start";
      mainContent.style.justifyContent = "flex-start";

      // Home section structure lives in home.html; shared rendering and data logic stay here.
      let page;
      try {
        const templateResult = await homeTemplatePromise;
        if (templateResult.error) throw templateResult.error;
        const homeMarkup = templateResult.markup;
        const homeDocument = new DOMParser().parseFromString(homeMarkup, "text/html");
        const requiredSections = ["home-hero", "home-page-title", "home-widget", "home-album", "home-page-card"];
        if (homeDocument.querySelectorAll(".home-page").length !== 1) throw new Error("home.html must contain exactly one .home-page template");
        page = homeDocument.querySelector(".home-page");
        if (requiredSections.some(className => page.querySelectorAll("." + className).length !== 1) ||
            page.querySelectorAll(".home-page-pillbar").length !== 1) {
          throw new Error("home.html is missing a required homepage section or contains duplicates");
        }
        mainContent.replaceChildren(page);
      } catch (error) {
        console.error("Could not load the homepage template:", error);
        const notice = document.createElement("section");
        notice.style.cssText = "width:min(100% - 32px,760px);margin:48px auto;padding:28px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-card-radius);background:var(--dg-surface);text-align:center";
        const heading = document.createElement("h1");
        heading.textContent = "Home page could not be loaded";
        const detail = document.createElement("p");
        detail.textContent = "Please refresh the page. If the problem continues, contact the site administrator.";
        notice.append(heading, detail);
        mainContent.replaceChildren(notice);
        return;
      }
      const heroSection = page.querySelector(".home-hero");
      heroSection.classList.add("is-loading");
      const extraSections = [".home-page-title", ".home-widget", ".home-album", ".home-page-card"]
        .map(selector => page.querySelector(selector));
      const pillBar = page.querySelector(".home-page-pillbar");
      pillBar.replaceChildren();
      // The site configuration was resolved above; avoid an extra await before the LCP request.

      // Start loading the hero record and image before unrelated homepage sections.
      // The hero image is the measured LCP element on production.
      let heroImagePreloader = null;
      const heroContentPromise = (async () => {
        const { data: heroRecord } = await supabaseClient.from("hero_items")
          .select("title,title_bn,title_en,description,description_bn,description_en,media,visibility").eq("visibility","public").order("created_at",{ascending:false}).limit(1).maybeSingle();
        let headline = String(localizedRecordValue(heroRecord,"title") || "").trim();
        let welcomeMessage = String(localizedRecordValue(heroRecord,"description") || "").trim();
        let heroImageUrl = "";
        const heroMedia = Array.isArray(heroRecord?.media) ? heroRecord.media : [];
        const firstImage = heroMedia.find(item => String(item.mime_type || "").startsWith("image/"));
        if (firstImage?.path) heroImageUrl = await createContentMediaUrl(firstImage.path, "content-files", { width: 1200, quality: 75 });
        if (!heroRecord) {
          const { data, error } = await supabaseClient.from("site_customizations").select("value").eq("key", "home_hero").maybeSingle();
          if (!error && data && data.value) {
            let heroData = data.value;
            if (typeof heroData === "string") { try { heroData = JSON.parse(heroData); } catch (_) { heroData = {}; } }
            if (heroData && typeof heroData === "object") {
              headline = String(heroData.headline || "").trim();
              welcomeMessage = String(heroData.welcomeMessage || "").trim();
              heroImageUrl = String(heroData.heroImageUrl || "").trim();
            }
          }
        }
        // Warm the image request as soon as its signed URL is available, without
        // changing its source, access policy, or displayed dimensions.
        if (heroImageUrl) {
          heroImagePreloader = new Image();
          heroImagePreloader.fetchPriority = "high";
          heroImagePreloader.decoding = "async";
          heroImagePreloader.src = heroImageUrl;
        }
        return { headline, welcomeMessage, heroImageUrl };
      })();

      // Render the LCP hero as soon as its record and signed image URL are ready.
      // Do not let page-order, pill-motion, or optional included-page reads delay it.
      const heroRenderPromise = (async () => {
        const { headline, welcomeMessage, heroImageUrl } = await heroContentPromise;
        if (!headline && !welcomeMessage && !heroImageUrl && !String((siteConfig.ui_customization_identity||{}).tagline||"").trim()) {
          heroSection.classList.remove("is-loading");
          return false;
        }
        // Keep the image as the floating hero surface and layer its text over the center.
        const imageFrame = document.createElement("div");
        imageFrame.className = "home-hero-image-frame";
        imageFrame.style.cssText = "position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:100%;aspect-ratio:16/9;margin:0;overflow:hidden;border:1px solid rgba(148,163,184,.35);border-radius:20px;background:linear-gradient(135deg,#e2e8f0,#f8fafc)";
        if (heroImageUrl) {
          const image = document.createElement("img");
          image.src = heroImageUrl;
          image.alt = "";
          image.loading = "eager";
          image.decoding = "async";
          image.fetchPriority = "high";
          image.style.cssText = "position:absolute;inset:0;z-index:-2;display:block;width:100%;height:100%;max-width:100%;object-fit:cover;object-position:center";
          imageFrame.append(image);
          const shade = document.createElement("div");
          shade.setAttribute("aria-hidden", "true");
          shade.style.cssText = "position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(15,23,42,.48),rgba(15,23,42,.2),rgba(15,23,42,.48))";
          imageFrame.append(shade);
        }
  
        const textOverlay = document.createElement("div");
        textOverlay.className = "home-hero-text-overlay";
        textOverlay.style.cssText = "position:relative;z-index:1;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;max-height:100%;overflow-y:auto;padding:clamp(16px,4vw,44px);text-align:center;color:" + (heroImageUrl ? "#fff" : "#334155") + ";text-shadow:" + (heroImageUrl ? "0 2px 12px rgba(0,0,0,.5)" : "none");
        const tagline=String((siteConfig.ui_customization_identity||{}).tagline||"").trim();
        if(tagline){const tag=document.createElement("p");tag.className="home-tagline";tag.textContent=tagline;textOverlay.append(tag);}
        if (headline) {
          const heading = document.createElement("h1");
          heading.textContent = headline;
          heading.style.cssText = "max-width:900px;margin:0 0 12px;font-size:clamp(24px,5.5vw,52px);line-height:1.12;font-weight:750;overflow-wrap:anywhere";
          textOverlay.append(heading);
        }
        if (welcomeMessage) {
          const welcome = document.createElement("p");
          welcome.textContent = welcomeMessage;
          welcome.style.cssText = "max-width:760px;margin:0;font-size:clamp(14px,2.5vw,20px);line-height:1.55;overflow-wrap:anywhere";
          textOverlay.append(welcome);
        }
        imageFrame.append(textOverlay);
        heroSection.append(imageFrame);
        heroSection.classList.remove("is-loading");
        return true;
      })();

      // These reads do not depend on each other: start the public-page list and its
      // ordering settings while optional included-page configuration is being resolved.
      const publicPageConfigPromise = Promise.all([
        supabaseClient.from("pages").select("id,title,title_bn,title_en,url,visibility,created_at").eq("visibility","public").order("created_at",{ascending:true}).limit(200),
        supabaseClient.from("site_customizations").select("value").eq("key","home_page_order").maybeSingle(),
        supabaseClient.from("site_customizations").select("value").eq("key","home_page_pill_autoscroll").maybeSingle()
      ]);

      // Optional homepage placement map, configured in Dashboard > Customizations
      // with key "home_page_includes" and JSON such as {"home-page-title":"about-us"}.
      const { data: includeConfigRow } = await supabaseClient.from("site_customizations")
        .select("value").eq("key", "home_page_includes").maybeSingle();
      let homeIncludes = includeConfigRow?.value || {};
      if (typeof homeIncludes === "string") {
        try { homeIncludes = JSON.parse(homeIncludes); } catch (_) { homeIncludes = {}; }
      }
      if (homeIncludes && typeof homeIncludes === "object" && !Array.isArray(homeIncludes)) {
        const includeTargets = Object.entries(homeIncludes).map(([sectionClass, rawSlug]) => {
          const target = [heroSection, ...extraSections].find(section => section.classList.contains(sectionClass));
          const slug = generatePageSlug(rawSlug);
          return target && slug ? { target, slug } : null;
        }).filter(Boolean);
        // These page reads are independent; fetch them concurrently instead of serially.
        const includedPages = await Promise.all(includeTargets.map(async ({ target, slug }) => {
          const { data, error } = await supabaseClient.from("pages")
            .select("content").eq("url", slug).maybeSingle();
          return !error && data ? { target, content: data.content || "" } : null;
        }));
        await Promise.all(includedPages.filter(Boolean).map(({ target, content }) =>
          renderHtmlInto(target, content, null)
        ));
      }

      // Public Pages appear as pill buttons in the homepage Page Title section.
      const pageTitleSection = extraSections[0];
      pillBar.setAttribute("aria-label", "Pages");
      const [{data: publicPages, error: pagesError}, {data: pageOrderSetting}, {data: pillMotionSetting}] =
        await publicPageConfigPromise;
      let pillMotionConfig = pillMotionSetting?.value;
      if (typeof pillMotionConfig === "string") { try { pillMotionConfig = JSON.parse(pillMotionConfig); } catch (_) { pillMotionConfig = {}; } }
      if (!pillMotionConfig || typeof pillMotionConfig !== "object" || Array.isArray(pillMotionConfig)) pillMotionConfig = {};
      const pillAutoEnabled = pillMotionConfig.enabled !== false;
      const pillAutoInterval = Math.max(1, Math.min(60, Number(pillMotionConfig.interval_seconds) || 3));
      if (!pagesError && Array.isArray(publicPages) && publicPages.length) {
        let pageOrder = pageOrderSetting?.value;
        if (typeof pageOrder === "string") { try { pageOrder = JSON.parse(pageOrder); } catch (_) { pageOrder = []; } }
        if (pageOrder && !Array.isArray(pageOrder) && Array.isArray(pageOrder.ids)) pageOrder = pageOrder.ids;
        if (!Array.isArray(pageOrder)) pageOrder = [];
        const rank = new Map(pageOrder.map((id,index)=>[String(id),index]));
        publicPages.sort((a,b) => {
          const ar=rank.has(String(a.id))?rank.get(String(a.id)):Number.MAX_SAFE_INTEGER;
          const br=rank.has(String(b.id))?rank.get(String(b.id)):Number.MAX_SAFE_INTEGER;
          return ar-br || new Date(a.created_at||0)-new Date(b.created_at||0);
        });
        for (const storedPage of publicPages) {
          const storedPageTitle = localizedRecordValue(storedPage,"title");
          if (!storedPage.url || !storedPageTitle) continue;
          const pill = document.createElement("a");
          pill.href = "#home-page-" + encodeURIComponent(storedPage.url);
          pill.dataset.pageUrl = String(storedPage.url);
          pill.textContent = storedPageTitle;
          pill.className = "home-page-pill";
          pill.style.cssText = "display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;min-height:40px;white-space:nowrap;padding:8px 16px;border:1px solid #dedede;border-radius:999px;background:var(--dg-surface);color:#333;text-decoration:none;font-size:var(--dg-font-size-base);font-weight:var(--dg-font-weight-semibold);line-height:1.35";
          pill.addEventListener("click",(event)=>{
            event.preventDefault();
            const target=Array.from(document.querySelectorAll(".home-page-html-card")).find(card=>card.dataset.pageUrl===pill.dataset.pageUrl);
            if(target){
              target.scrollIntoView({behavior:"smooth",block:"start"});
              target.focus({preventScroll:true});
            }else{
              pageCards?.scrollIntoView({behavior:"smooth",block:"start"});
            }
          });
          pill.addEventListener("mouseenter",()=>{pill.style.background="#f3f4f6";});
          pill.addEventListener("mouseleave",()=>{pill.style.background="#fff";});
          pillBar.append(pill);
        }
      }
      if (pillBar.childElementCount) {
        pillBar.hidden = false;
        page.insertBefore(pillBar,pageTitleSection);
        const pillMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let pillAutoTimer = null;
        const stopPillAutoScroll = () => {
          if (pillAutoTimer !== null) {
            window.clearInterval(pillAutoTimer);
            pillAutoTimer = null;
          }
        };
        const startPillAutoScroll = () => {
          stopPillAutoScroll();
          if (!pillAutoEnabled || pillMotion.matches || pillBar.children.length < 2) return;
          pillAutoTimer = window.setInterval(() => {
            if (!pillBar.isConnected) {
              stopPillAutoScroll();
              return;
            }
            const pills = Array.from(pillBar.querySelectorAll(".home-page-pill"));
            if (pills.length < 2 || pillBar.scrollWidth <= pillBar.clientWidth + 2) return;
            const currentLeft = pillBar.scrollLeft;
            const nextPill = pills.find(pill => pill.offsetLeft > currentLeft + 3);
            if (!nextPill || currentLeft + pillBar.clientWidth >= pillBar.scrollWidth - 3) {
              pillBar.scrollTo({left: 0, behavior: "smooth"});
            } else {
              pillBar.scrollTo({left: nextPill.offsetLeft - pillBar.offsetLeft, behavior: "smooth"});
            }
          }, pillAutoInterval * 1000);
        };
        pillBar.addEventListener("mouseenter", stopPillAutoScroll);
        pillBar.addEventListener("mouseleave", startPillAutoScroll);
        pillBar.addEventListener("focusin", stopPillAutoScroll);
        pillBar.addEventListener("focusout", startPillAutoScroll);
        if (pillMotion.addEventListener) pillMotion.addEventListener("change", startPillAutoScroll);
        else if (pillMotion.addListener) pillMotion.addListener(startPillAutoScroll);
        startPillAutoScroll();
      }
      // Render lower homepage sections after the hero has already started rendering.
      const homepageCardsPromise = renderHomepageContentCards(siteConfig);
      const heroRendered = await heroRenderPromise;
      if (!heroRendered) {
        await homepageCardsPromise;
        return;
      }
      await homepageCardsPromise;
    }

    async function renderHomepageContentCards(siteConfig){
      const widget=document.querySelector(".home-widget"), albumSection=document.querySelector(".home-album"), pageCards=document.querySelector(".home-page-card");
      const makeGrid=()=>{const grid=document.createElement("div");grid.className="home-content-grid";return grid;};
      const makeCard=(title,description)=>{const card=document.createElement("article");card.className="home-content-card";const h=document.createElement("h3");h.textContent=title||"Untitled";card.append(h);if(description){const p=document.createElement("p");p.textContent=description;card.append(p);}return card;};
      // Start independent section reads together; render work can then proceed as each resolves.
      const widgetRowsPromise = widget
        ? supabaseClient.from("widgets").select("id,widget_type,title,title_bn,title_en,is_visible,settings").eq("is_visible",true).order("created_at",{ascending:true})
        : Promise.resolve({ data: [], error: null });
      const albumRowsPromise = albumSection
        ? supabaseClient.from("albums").select("id,title,title_bn,title_en,description,description_bn,description_en,url,cover_path,media,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(24)
        : Promise.resolve({ data: [], error: null });
      const albumOrderPromise = albumSection
        ? supabaseClient.from("site_customizations").select("value").eq("key","home_album_order").maybeSingle()
        : Promise.resolve({ data: null, error: null });
      const pageRowsPromise = pageCards
        ? supabaseClient.from("pages").select("title,title_bn,title_en,description,description_bn,description_en,content,content_bn,content_en,url,media,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(200)
        : Promise.resolve({ data: [], error: null });

      // Only configured widgets belong in the homepage Widget section.
      if(widget){
        const {data:widgets,error}=await widgetRowsPromise;
        if(!error&&Array.isArray(widgets)&&widgets.length){
          const grid=makeGrid();
          for(const item of widgets){
            const settings=item.settings&&typeof item.settings==="object"?item.settings:{};
            const card=makeCard("","");
            const widgetHeading=card.querySelector("h3");if(widgetHeading)widgetHeading.remove();
            if(item.widget_type==="datetime"){
              const date=document.createElement("p");
              date.style.cssText="margin:4px 0 0;color:var(--dg-secondary);font-size:var(--dg-font-size-base)";
              const time=document.createElement("h2");
              time.style.cssText="margin:0 0 8px;font-size:clamp(24px,4vw,36px);line-height:1.2;font-variant-numeric:tabular-nums";
              const banglaDate=document.createElement("p");
              banglaDate.style.cssText="margin:0 0 8px;color:var(--dg-secondary);font-size:var(--dg-font-size-base)";
              const clockLayout=document.createElement("div");
              clockLayout.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;min-width:0";
              const clockDetails=document.createElement("div");
              clockDetails.style.cssText="flex:1;min-width:0";
              clockDetails.append(time,banglaDate,date);
              const dialWrap=document.createElement("div");
              dialWrap.style.cssText="flex:0 0 clamp(108px,22vw,164px);width:clamp(108px,22vw,164px);max-width:44%;aspect-ratio:1";
              const svgNS="http://www.w3.org/2000/svg";
              const dial=document.createElementNS(svgNS,"svg");
              dial.setAttribute("viewBox","0 0 160 160");
              dial.setAttribute("role","img");
              dial.setAttribute("aria-label",getUiLanguage()==="bn"?"বাংলাদেশের সময় দেখানো অ্যানালগ ঘড়ি":"Analog clock showing Bangladesh time");
              dial.style.cssText="display:block;width:100%;height:100%;overflow:visible";
              const face=document.createElementNS(svgNS,"circle");
              face.setAttribute("cx","80");face.setAttribute("cy","80");face.setAttribute("r","75");
              face.setAttribute("fill","var(--card-bg, #fff)");face.setAttribute("stroke","var(--border-color, #d1d5db)");face.setAttribute("stroke-width","2");
              dial.append(face);
              for(let tick=0;tick<60;tick++){
                const angle=tick*Math.PI/30;
                const major=tick%5===0;
                const line=document.createElementNS(svgNS,"line");
                line.setAttribute("x1",String(80+Math.sin(angle)*(major?61:66)));
                line.setAttribute("y1",String(80-Math.cos(angle)*(major?61:66)));
                line.setAttribute("x2",String(80+Math.sin(angle)*70));
                line.setAttribute("y2",String(80-Math.cos(angle)*70));
                line.setAttribute("stroke","var(--text-color, #374151)");
                line.setAttribute("stroke-width",major?"2.5":"1");
                line.setAttribute("stroke-linecap","round");
                dial.append(line);
              }
              for(let numeral=1;numeral<=12;numeral++){
                const angle=numeral*Math.PI/6;
                const label=document.createElementNS(svgNS,"text");
                label.setAttribute("x",String(80+Math.sin(angle)*49));
                label.setAttribute("y",String(80-Math.cos(angle)*49+4));
                label.setAttribute("text-anchor","middle");
                label.setAttribute("font-size","11");
                label.setAttribute("font-weight","600");
                label.setAttribute("fill","var(--text-color, #374151)");
                label.textContent=new Intl.NumberFormat(getUiLanguage()==="bn"?"bn-BD":"en-GB",{useGrouping:false}).format(numeral);
                dial.append(label);
              }
              const makeHand=(length,width,color)=>{
                const hand=document.createElementNS(svgNS,"line");
                hand.setAttribute("x1","80");hand.setAttribute("y1","80");
                hand.setAttribute("x2","80");hand.setAttribute("y2",String(80-length));
                hand.setAttribute("stroke",color);hand.setAttribute("stroke-width",String(width));
                hand.setAttribute("stroke-linecap","round");
                dial.append(hand);
                return hand;
              };
              const hourHand=makeHand(34,4,"var(--text-color, #374151)");
              const minuteHand=makeHand(48,2.8,"var(--text-color, #374151)");
              const secondHand=makeHand(55,1.2,"#dc2626");
              const pin=document.createElementNS(svgNS,"circle");
              pin.setAttribute("cx","80");pin.setAttribute("cy","80");pin.setAttribute("r","3.5");pin.setAttribute("fill","#dc2626");
              dial.append(pin);
              dialWrap.append(dial);
              clockLayout.append(clockDetails,dialWrap);
              card.append(clockLayout);
              const updateClock=()=>{
                const now=new Date();
                const bangladeshTimeZone="Asia/Dhaka";
                const language=getUiLanguage();
                const locale=language==="bn"?"bn-BD":"en-GB";
                const parts=new Intl.DateTimeFormat("en-GB",{timeZone:bangladeshTimeZone,year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",hourCycle:"h23"}).formatToParts(now);
                const part=name=>Number(parts.find(part=>part.type===name)?.value);
                const year=part("year"),month=part("month"),day=part("day");
                const hour=part("hour"),minute=part("minute"),second=part("second");
                const banglaDigitFormatter=new Intl.NumberFormat("bn-BD",{useGrouping:false});
                if(language==="en"){
                  time.textContent=new Intl.DateTimeFormat(locale,{hour:"2-digit",minute:"2-digit",hourCycle:"h12",timeZone:bangladeshTimeZone}).format(now).replace(/\b(am|pm)\b/i,period=>period.toUpperCase());
                }else{
                  const bengaliPeriod=hour>=4&&hour<11?"সকাল":hour>=11&&hour<15?"দুপুর":hour>=15&&hour<18?"বিকেল":hour>=18&&hour<20?"সন্ধ্যা":"রাত";
                  const bengaliHour=new Intl.NumberFormat(locale,{minimumIntegerDigits:2,useGrouping:false}).format(hour%12||12);
                  const bengaliMinute=new Intl.NumberFormat(locale,{minimumIntegerDigits:2,useGrouping:false}).format(minute);
                  time.textContent=bengaliPeriod+" "+bengaliHour+":"+bengaliMinute;
                }
                const gregorianParts=new Intl.DateTimeFormat("en-GB",{timeZone:bangladeshTimeZone,weekday:"long",day:"numeric",month:"long",year:"numeric"}).formatToParts(now);
                const gregorianPart=name=>gregorianParts.find(part=>part.type===name)?.value||"";
                date.textContent=gregorianPart("weekday")+", "+gregorianPart("day")+" "+gregorianPart("month")+", "+gregorianPart("year");
                const banglaYear=year-(month>4||(month===4&&day>=14)?593:594);
                const startYear=month>4||(month===4&&day>=14)?year:year-1;
                const elapsed=Math.floor((Date.UTC(year,month-1,day)-Date.UTC(startYear,3,14))/86400000);
                const leapYear=startYear+1;
                const isLeap=leapYear%4===0&&(leapYear%100!==0||leapYear%400===0);
                const monthNames=["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"];
                const monthLengths=[31,31,31,31,31,31,30,30,30,30,isLeap?30:29,30];
                let remaining=elapsed,banglaMonth=0;
                while(banglaMonth<monthLengths.length-1&&remaining>=monthLengths[banglaMonth]){remaining-=monthLengths[banglaMonth];banglaMonth++;}
                const weekdayNames=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
                const weekday=new Date(Date.UTC(year,month-1,day)).getUTCDay();
                banglaDate.textContent=weekdayNames[weekday]+", "+monthNames[banglaMonth]+" "+banglaDigitFormatter.format(remaining+1)+", "+banglaDigitFormatter.format(banglaYear);
                hourHand.setAttribute("transform","rotate("+((hour%12)*30+minute*0.5)+" 80 80)");
                minuteHand.setAttribute("transform","rotate("+(minute*6+second*0.1)+" 80 80)");
                secondHand.setAttribute("transform","rotate("+(second*6)+" 80 80)");
              };
              updateClock();
              document.addEventListener("dalimgari:languagechange",updateClock);
              const clockTimer=setInterval(()=>{if(!card.isConnected){clearInterval(clockTimer);document.removeEventListener("dalimgari:languagechange",updateClock);return;}updateClock();},1000);
            }else if(item.widget_type==="map"){
              const map=document.createElement("iframe");
              const locationQuery=String(settings.location||"Saudi Arabia").trim();
              const configuredZoom=Number(settings.zoom);
              const zoom=Number.isFinite(configuredZoom)?Math.max(1,Math.min(21,Math.round(configuredZoom))):13;
              const generatedEmbed="https://maps.google.com/maps?q="+encodeURIComponent(locationQuery)+"&z="+zoom+"&output=embed";
              const embed=String(settings.embed_url||generatedEmbed).trim();
              let validMapUrl=false,displayEmbed=embed;
              try{const parsed=new URL(embed);validMapUrl=parsed.protocol==="https:"&&["maps.google.com","www.google.com","openstreetmap.org","www.openstreetmap.org"].includes(parsed.hostname);if(["maps.google.com","www.google.com"].includes(parsed.hostname)){parsed.searchParams.set("z",String(zoom));displayEmbed=parsed.toString();}}catch(_){}
              map.src=validMapUrl?displayEmbed:generatedEmbed;
              map.title=item.title||"Map";
              map.loading="lazy";
              map.referrerPolicy="no-referrer-when-downgrade";
              map.setAttribute("allowfullscreen","");
              map.style.cssText="display:block;width:100%;height:300px;max-width:100%;border:0;border-radius:10px;background:#f3f4f6";
              card.append(map);
            }
            grid.append(card);
          }
          widget.append(grid);
        }
      }
      if(albumSection){
        const {data:albumRows,error}=await albumRowsPromise;
        // Home only shows albums with media items or a configured cover image.
        const albums=Array.isArray(albumRows)?albumRows.filter(album=>
          Boolean(String(album.cover_path||"").trim())||
          (Array.isArray(album.media)&&album.media.some(item=>item&&String(item.path||"").trim()))
        ):[];
        if(!error&&albums.length){
          const coverCandidates = albums.map(album => ({
            album,
            items: (Array.isArray(album.media) ? album.media : [])
              .filter(item => item && String(item.mime_type || "").startsWith("image/") && item.path)
              .sort(() => Math.random() - 0.5)
              .slice(0, 4)
          }));
          const coverRequests = coverCandidates.flatMap(({ album, items }) =>
            items.map(item => ({ album, item }))
          );
          const resolvedCoverRequests = await mapWithConcurrency(coverRequests, 6, async ({ album, item }) => {
            const url = await createContentMediaUrl(item.path);
            return url ? { albumId: String(album.id), url, alt: localizedMediaValue(item,"alt_text") || localizedMediaValue(item,"title") || localizedRecordValue(album,"title") || "" } : null;
          });
          const coverImagesByAlbum = new Map();
          for (const resolved of resolvedCoverRequests) {
            if (!resolved) continue;
            if (!coverImagesByAlbum.has(resolved.albumId)) coverImagesByAlbum.set(resolved.albumId, []);
            coverImagesByAlbum.get(resolved.albumId).push({ url: resolved.url, alt: resolved.alt });
          }
          const albumsNeedingFallback = albums.filter(album => !(coverImagesByAlbum.get(String(album.id)) || []).length && album.cover_path);
          const fallbackCovers = await mapWithConcurrency(albumsNeedingFallback, 6, async album => {
            const url = await createContentMediaUrl(album.cover_path);
            return url ? { albumId: String(album.id), url, alt: localizedRecordValue(album,"title") || "" } : null;
          });
          for (const fallback of fallbackCovers) {
            if (fallback) coverImagesByAlbum.set(fallback.albumId, [{ url: fallback.url, alt: fallback.alt }]);
          }
          try{
            const {data:orderSetting}=await albumOrderPromise;
            let albumIds=orderSetting?.value;
            if(typeof albumIds==="string"){try{albumIds=JSON.parse(albumIds);}catch(_){albumIds=[];}}
            if(albumIds&&!Array.isArray(albumIds)&&Array.isArray(albumIds.ids))albumIds=albumIds.ids;
            if(Array.isArray(albumIds)){
              const byId=new Map(albums.map(album=>[String(album.id),album]));
              const orderedAlbums=albumIds.map(id=>byId.get(String(id))).filter(Boolean);
              albums.forEach(album=>{if(!orderedAlbums.some(item=>String(item.id)===String(album.id)))orderedAlbums.push(album);});
              albums.splice(0,albums.length,...orderedAlbums);
            }
          }catch(orderError){console.warn("Could not load homepage album order:",orderError);}
          const grid=makeGrid();
          grid.classList.add("home-album-carousel");
          grid.style.cssText="display:flex;flex-wrap:nowrap;gap:16px;width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;scroll-behavior:auto;overscroll-behavior-x:contain;padding:2px 1px 12px";
          for(const album of albums){
            const albumTitle=localizedRecordValue(album,"title");
            const albumDescription=localizedRecordValue(album,"description");
            const card=makeCard(albumTitle,albumDescription||"");
            const coverImages=coverImagesByAlbum.get(String(album.id)) || [];
            if(coverImages.length){
              const cover=document.createElement("div");
              cover.className="home-album-cover-slideshow";
              cover.setAttribute("aria-label",(albumTitle||"Album")+" cover slideshow");
              cover.style.cssText="position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:10px;margin:0 0 14px;background:#f3f4f6";
              let currentIndex=Math.floor(Math.random()*coverImages.length);
              let front=document.createElement("img"),back=document.createElement("img");
              const styleSlide=(image)=>{image.alt="";image.loading="lazy";image.decoding="async";image.style.cssText="position:absolute;inset:0;width:100%;height:100%;max-height:none;object-fit:cover;margin:0;border-radius:0;transition:opacity .7s ease";};
              styleSlide(front);styleSlide(back);
              front.src=coverImages[currentIndex].url;front.alt=coverImages[currentIndex].alt;front.style.opacity="1";back.style.opacity="0";
              cover.append(front,back);
              if(coverImages.length>1){
                const slideshowTimer=setInterval(()=>{
                  if(!cover.isConnected){clearInterval(slideshowTimer);return;}
                  let nextIndex=currentIndex;
                  while(nextIndex===currentIndex)nextIndex=Math.floor(Math.random()*coverImages.length);
                  back.onload=()=>{
                    back.style.opacity="1";front.style.opacity="0";
                    const previousFront=front;front=back;back=previousFront;
                    currentIndex=nextIndex;
                    back.onload=null;
                  };
                  back.src=coverImages[nextIndex].url;
                },4500);
              }
              const heading=card.querySelector("h3");
              card.insertBefore(cover,heading||card.firstChild);
            }
            // Homepage keeps one card per album; opening it navigates to Gallery.
            card.classList.add("home-album-open");
            card.dataset.albumId=album.id;
            card.style.flex="0 0 clamp(240px,30vw,320px)";
            card.style.maxWidth="85vw";
            card.tabIndex=0;
            card.setAttribute("role","button");
            card.setAttribute("aria-label","Open album in Gallery: "+(albumTitle||"Untitled"));
            card.style.cursor="pointer";
            grid.append(card);
          }
          grid.addEventListener("click",event=>{
            const card=event.target.closest(".home-album-open");
            if(!card||!grid.contains(card))return;
            const albumId=card.dataset.albumId;
            if(!albumId)return;
            history.pushState(null,"","#gallery?album="+encodeURIComponent(albumId));
            renderGalleryPage(albumId);
            setCurrentMenuPage("Gallery");
          });
          grid.addEventListener("keydown",event=>{
            if(event.key!=="Enter"&&event.key!==" ")return;
            const card=event.target.closest(".home-album-open");
            if(!card||!grid.contains(card))return;
            event.preventDefault();
            const albumId=card.dataset.albumId;
            if(!albumId)return;
            history.pushState(null,"","#gallery?album="+encodeURIComponent(albumId));
            renderGalleryPage(albumId);
            setCurrentMenuPage("Gallery");
          });
          if(albums.length>1){
            // Seamless carousel loop with one DOM card per album; rotate passed cards instead of cloning.
            let paused=false,lastTime=0,normalizingScroll=false;
            const rotatePassedCards=()=>{
              if(normalizingScroll||!grid.isConnected)return;
              normalizingScroll=true;
              let guard=0;
              while(grid.firstElementChild&&guard<grid.children.length){
                const first=grid.firstElementChild;
                const gap=parseFloat(getComputedStyle(grid).columnGap)||0;
                const shift=first.getBoundingClientRect().width+gap;
                if(shift<=0||grid.scrollLeft+0.5<shift)break;
                grid.append(first);
                grid.scrollLeft=Math.max(0,grid.scrollLeft-shift);
                guard++;
              }
              normalizingScroll=false;
            };
            grid.addEventListener("scroll",rotatePassedCards,{passive:true});
            const reducedMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const animateAlbums=(time)=>{
              if(!grid.isConnected)return;
              if(!lastTime)lastTime=time;
              const delta=Math.min(50,time-lastTime);lastTime=time;
              if(!paused&&!reducedMotion){
                grid.scrollLeft+=delta*0.025;
                rotatePassedCards();
              }
              requestAnimationFrame(animateAlbums);
            };
            grid.addEventListener("mouseenter",()=>paused=true);
            grid.addEventListener("mouseleave",()=>paused=false);
            grid.addEventListener("focusin",()=>paused=true);
            grid.addEventListener("focusout",()=>paused=false);
            grid.addEventListener("touchstart",()=>paused=true,{passive:true});
            grid.addEventListener("touchend",()=>paused=false,{passive:true});
            requestAnimationFrame(animateAlbums);
          }
          albumSection.append(grid);
        }
      }
      if(pageCards){
        const {data:pages,error}=await pageRowsPromise;
        if(!error&&pages?.length){
          const grid=makeGrid();
          for(const page of pages){
            const pageTitle=localizedRecordValue(page,"title");
            const pageDescription=localizedRecordValue(page,"description");
            page.content=localizedRecordValue(page,"content")||page.content||"";
            const card=makeCard(pageTitle,pageDescription||"");
            card.classList.add("home-page-html-card");
            card.dataset.pageUrl=String(page.url||"");
            card.id="home-page-"+String(page.url||"").replace(/[^a-zA-Z0-9_-]/g,"-");
            card.tabIndex=-1;
            card.style.scrollMarginTop="24px";
            const preview=document.createElement("div");
            preview.className="home-page-html-preview";
            preview.setAttribute("aria-label",(pageTitle||"Page")+" HTML preview");
            preview.style.cssText="max-height:420px;overflow:auto;overscroll-behavior:contain;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:10px;padding:12px;margin:12px 0;background:var(--dg-surface);min-width:0;overflow-wrap:anywhere";
            card.append(preview);
            await renderHtmlInto(preview,page.content||"",activeSession,0,".home-page-html-preview");
            await renderContentMedia(preview,page.media||[]);
            if(page.url){
              const link=document.createElement("a");
              link.href=window.location.pathname+"?page="+encodeURIComponent(page.url);
              link.textContent=getUiLanguage()==="en"?"See More":"আরও দেখুন";
              link.setAttribute("aria-label","See more of "+(pageTitle||"this page"));
              link.style.cssText="display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 16px;border-radius:var(--dg-control-radius);background:var(--dg-primary,#222);color:#fff;text-decoration:none;font-weight:var(--dg-font-weight-semibold);margin-top:4px";
              card.append(link);
            }
            grid.append(card);
          }
          pageCards.append(grid);
        }
      }
    }

    function isUnsafePageUrl(value) {
      const normalized = String(value || "").replace(/[\u0000-\u0020\u007f]/g, "").toLowerCase();
      return normalized.startsWith("javascript:") ||
        normalized.startsWith("vbscript:") ||
        normalized.startsWith("data:text/html") ||
        normalized.startsWith("data:image/svg+xml");
    }

    function sanitizePageHtml(html) {
      const parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
      parsed.querySelectorAll("script,iframe,object,embed,base,meta,link,title,foreignObject").forEach(node => node.remove());
      const pageStyles = Array.from(parsed.querySelectorAll("style"));
      pageStyles.forEach(node => node.remove());
      parsed.querySelectorAll("*").forEach(node => {
        Array.from(node.attributes).forEach(attribute => {
          const name = attribute.name.toLowerCase();
          if (name.startsWith("on") || name === "srcdoc" ||
              ((name === "href" || name === "src" || name === "xlink:href" || name === "action" || name === "formaction") &&
               isUnsafePageUrl(attribute.value))) {
            node.removeAttribute(attribute.name);
          }
        });
        if (node.tagName === "FORM") {
          node.removeAttribute("action");
          node.removeAttribute("method");
        }
      });
      pageStyles.forEach(style => parsed.body.append(style));
      return parsed.body;
    }

    function splitPageCssSelectors(value) {
      const selectors = [];
      let start = 0, depth = 0, quote = "";
      for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (quote) { if (ch === quote && value[i - 1] !== "\\") quote = ""; continue; }
        if (ch === "'" || ch === '"') { quote = ch; continue; }
        if (ch === "(" || ch === "[") depth++;
        else if (ch === ")" || ch === "]") depth--;
        else if (ch === "," && depth === 0) { selectors.push(value.slice(start, i).trim()); start = i + 1; }
      }
      selectors.push(value.slice(start).trim());
      return selectors.filter(Boolean);
    }

    function scopePageCss(cssText, prefix) {
      let output = "", cursor = 0;
      while (cursor < cssText.length) {
        const open = cssText.indexOf("{", cursor);
        if (open < 0) { output += cssText.slice(cursor); break; }
        let depth = 1, close = open + 1, quote = "";
        for (; close < cssText.length && depth > 0; close++) {
          const ch = cssText[close];
          if (quote) { if (ch === quote && cssText[close - 1] !== "\\") quote = ""; continue; }
          if (ch === "'" || ch === '"') { quote = ch; continue; }
          if (ch === "{") depth++;
          else if (ch === "}") depth--;
        }
        if (depth !== 0) { output += cssText.slice(cursor); break; }
        const selector = cssText.slice(cursor, open).trim();
        const body = cssText.slice(open + 1, close - 1);
        output += cssText.slice(cursor, open);
        if (/^@(media|supports|container|layer|document)\b/i.test(selector)) {
          output = output.slice(0, output.length - (cssText.slice(cursor, open).length));
          output += selector + "{" + scopePageCss(body, prefix) + "}";
        } else if (/^@(-webkit-)?keyframes\b|^@font-face\b|^@property\b|^@counter-style\b/i.test(selector)) {
          output += "{" + body + "}";
        } else if (selector.startsWith("@")) {
          output += "{" + body + "}";
        } else {
          const scoped = splitPageCssSelectors(selector).map(item => {
            if (/^(html|body|:root)(\b|$)/i.test(item)) {
              return item.replace(/^(html|body|:root)(\b|$)/i, prefix);
            }
            return prefix + " " + item;
          }).join(", ");
          output = output.slice(0, output.length - (cssText.slice(cursor, open).length));
          output += scoped + "{" + body + "}";
        }
        cursor = close;
      }
      return output;
    }

    function scopePageStyles(container, prefix=".stored-html-page .stored-html-page-content.stored-html-page-content") {
      container.querySelectorAll("style").forEach(style => {
        style.textContent = scopePageCss(style.textContent || "", prefix);
      });
    }

    async function renderHtmlInto(container, html, session, depth=0, stylePrefix=".stored-html-page .stored-html-page-content.stored-html-page-content") {
      const safeBody = sanitizePageHtml(html);
      container.replaceChildren(...Array.from(safeBody.childNodes).map(node => document.importNode(node, true)));
      scopePageStyles(container,stylePrefix);
      const includes = Array.from(container.querySelectorAll("[data-dalimgari-include]"));
      for (const slot of includes) {
        if (depth >= 5) { slot.textContent = "Page include depth limit reached."; continue; }
        const slug = generatePageSlug(slot.getAttribute("data-dalimgari-include"));
        if (!slug) { slot.remove(); continue; }
        const { data, error } = await supabaseClient.from("pages")
          .select("title,content,url,visibility,media").eq("url", slug).maybeSingle();
        if (error || !data) {
          slot.replaceChildren();
          slot.textContent = "Included page is unavailable.";
          continue;
        }
        await renderHtmlInto(slot, data.content || "", session, depth + 1, stylePrefix);
        await renderContentMedia(slot, data.media || []);
      }
    }

    function generatePageSlug(value) {
      return String(value || "").trim().toLowerCase().replaceAll("/", "")
        .replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    }

    async function renderStoredPage(rawSlug, session) {
      const siteConfig = await applyDalimgariSiteConfig();
      const maintenance = siteConfig.ui_settings_maintenance_features || {};
      const currentRole = String((session && session.user && session.user.app_metadata && session.user.app_metadata.role) || "").toLowerCase();
      if (maintenance.maintenance_mode && currentRole !== "admin") {
        const notice = document.createElement("section");
        notice.style.cssText = "width:min(100% - 32px,760px);margin:48px auto;padding:28px;border:var(--dg-border-width) var(--dg-border-style) var(--dg-border);border-radius:var(--dg-card-radius);background:var(--dg-surface);text-align:center";
        const heading = document.createElement("h1"); heading.textContent = "We’ll be back soon";
        const detail = document.createElement("p"); detail.textContent = "The website is temporarily under maintenance. Please check again later.";
        notice.append(heading, detail); mainContent.replaceChildren(notice); return;
      }
      const siteTitle = localizedSiteTitle(siteConfig);
      document.title = siteTitle;
      mainContent.style.alignItems = "flex-start";
      mainContent.style.justifyContent = "flex-start";
      mainContent.replaceChildren();
      const slug = generatePageSlug(rawSlug);
      const shell = document.createElement("article");
      shell.className = "stored-html-page";
      shell.style.cssText = "width:100%;max-width:1100px;box-sizing:border-box;margin:0 auto;padding:24px 16px 40px;overflow-wrap:anywhere";
      mainContent.append(shell);
      if (!slug) { shell.textContent = "Page not found."; return; }
      const { data, error } = await supabaseClient.from("pages")
        .select("title,title_bn,title_en,description,description_bn,description_en,content,content_bn,content_en,url,visibility,media").eq("url", slug).maybeSingle();
      if (error || !data) {
        const message = document.createElement("p");
        message.textContent = "This page is unavailable or you do not have permission to view it.";
        shell.append(message);
        return;
      }
      const heading = document.createElement("h1");
      const pageTitle = localizedRecordValue(data,"title");
      const pageLabel = document.querySelector("#current-page-label");
      if (pageLabel) pageLabel.textContent = pageTitle || window.DalimgariI18n?.t?.("Page") || "Page";
      const pageDescription = localizedRecordValue(data,"description");
      data.content = localizedRecordValue(data,"content") || data.content || "";
      heading.textContent = pageTitle || "";
      heading.style.cssText = "margin:0 0 12px;overflow-wrap:anywhere";
      shell.append(heading);
      if (pageDescription) {
        const description = document.createElement("p");
        description.textContent = pageDescription;
        description.style.cssText = "margin:0 0 24px;color:var(--dg-secondary);font-size:17px;line-height:1.65;overflow-wrap:anywhere";
        shell.append(description);
      }
      const content = document.createElement("div");
      content.className = "stored-html-page-content";
      shell.append(content);
      await renderHtmlInto(content, data.content || "", session);
      await renderContentMedia(content, data.media || []);
      document.title = (pageTitle ? pageTitle + " | " : "") + siteTitle;
    }

    function renderPage(pageName) {
      mainContent.style.removeProperty("align-items");
      mainContent.style.removeProperty("justify-content");

      if (activeSession && (pageName === "Login" || pageName === "CreateAccount")) {
        pageName = "Profile";
        history.replaceState(null, "", "#profile");
      }
      mainContent.replaceChildren();

      if (pageName === "CreateAccount") { renderCreateAccount(); return; }
      if (pageName === "ForgotPassword") { renderForgotPassword(); return; }
      if (pageName === "Profile") { renderProfile(); return; }
      if (pageName === "EditProfile") { renderEditProfile(); return; }
      if (pageName === "Dashboard") { renderDashboard(); return; }
      if (pageName !== "Login") return;

      const form = document.createElement("form");
      form.className = "login-form";
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector(".login-submit");
        const message = form.querySelector(".login-message");
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
        message.textContent = "";
        message.removeAttribute("data-type");

        let loginResult;
        try {
          loginResult = await supabaseClient.auth.signInWithPassword({
            email: email.value.trim(),
            password: password.value
          });
        } catch (error) {
          loginResult = { error };
        }

        const { error } = loginResult;
        if (error) {
          const errorText = (error.message || "").toLowerCase();
          message.dataset.type = "error";
          if (errorText.includes("invalid login credentials")) {
            message.textContent = "Email or password is incorrect.";
          } else if (errorText.includes("email not confirmed")) {
            message.textContent = "Please confirm your email before logging in.";
          } else if (errorText.includes("rate limit") || errorText.includes("too many requests")) {
            message.textContent = "Too many attempts. Please wait a little and try again.";
          } else if (errorText.includes("fetch") || errorText.includes("network")) {
            message.textContent = "Connection problem. Check your internet and try again.";
          } else {
            message.textContent = "We couldn’t log you in. Please try again.";
          }
          submitButton.disabled = false;
          submitButton.textContent = "Login";
          return;
        }

        if (remember.checked) {
          localStorage.setItem("dalimgari-remember-email", "true");
          localStorage.setItem("dalimgari-saved-email", email.value.trim());
        } else {
          localStorage.removeItem("dalimgari-remember-email");
          localStorage.removeItem("dalimgari-saved-email");
        }

        renderPage("Profile");
        history.replaceState(null, "", "#profile");
        setCurrentMenuPage("Profile");
      });

      const email = document.createElement("input");
      email.className = "login-field";
      email.type = "email";
      email.name = "email";
      email.placeholder = "Email Address";
      email.setAttribute("aria-label", "Email Address");
      email.autocomplete = "email";
      email.required = true;
      if (localStorage.getItem("dalimgari-remember-email") === "true") {
        email.value = localStorage.getItem("dalimgari-saved-email") || "";
      }

      const password = document.createElement("input");
      password.className = "login-field";
      password.type = "password";
      password.name = "password";
      password.placeholder = "Password";
      password.setAttribute("aria-label", "Password");
      password.autocomplete = "current-password";
      password.required = true;

      const rememberRow = document.createElement("div");
      rememberRow.className = "remember-row";

      const remember = document.createElement("input");
      remember.type = "checkbox";
      remember.id = "remember-password";
      remember.name = "remember-password";
      remember.checked = localStorage.getItem("dalimgari-remember-email") === "true";

      const rememberLabel = document.createElement("label");
      rememberLabel.htmlFor = "remember-password";
      rememberLabel.textContent = "Remember me";

      rememberRow.append(remember, rememberLabel);

      const forgot = document.createElement("a");
      forgot.className = "forgot-password";
      forgot.href = "#forgot-password";
      forgot.textContent = "Forgot password?";
      forgot.addEventListener("click", (event) => {
        event.preventDefault();
        history.pushState(null, "", "#forgot-password");
        renderPage("ForgotPassword");
        setCurrentMenuPage("ForgotPassword");
      });

      const submit = document.createElement("button");
      submit.className = "login-submit";
      submit.type = "submit";
      submit.textContent = "Login";

      const createAccount = document.createElement("a");
      createAccount.className = "create-account";
      createAccount.href = "#create-account";
      createAccount.textContent = "Create new account?";
      createAccount.addEventListener("click", (event) => {
        event.preventDefault();
        renderPage("CreateAccount");
        setCurrentMenuPage("CreateAccount");
        history.replaceState(null, "", "#create-account");
      });

      const message = document.createElement("p");
      message.className = "login-message";
      message.setAttribute("role", "alert");

      form.append(email, password, rememberRow, forgot, submit, message, createAccount);
      mainContent.append(form);
    }


    async function removeRecycleStorageFiles(item){
      const groups=new Map();
      const add=(bucket,path)=>{if(!path||typeof path!=="string"||/^https?:\/\//i.test(path))return;const safeBucket=String(bucket||"content-files");if(!groups.has(safeBucket))groups.set(safeBucket,new Set());groups.get(safeBucket).add(path.replace(/^\/+/, ""));};
      const scan=(value,defaultBucket="content-files")=>{if(!value||typeof value!=="object")return;if(Array.isArray(value)){for(const child of value)scan(child,defaultBucket);return;}const bucket=value.bucket_id||value.bucket||value.storage_bucket||defaultBucket;for(const key of ["path","file_path","storage_path","object_path","cover_path"]){if(typeof value[key]==="string")add(bucket,value[key]);}for(const child of Object.values(value)){if(child&&typeof child==="object")scan(child,bucket);}};
      scan(item.record_data||{});scan(item.related_data||{});
      for(const [bucket,pathsSet] of groups){const paths=Array.from(pathsSet);for(let i=0;i<paths.length;i+=1000){const {error}=await supabaseClient.storage.from(bucket).remove(paths.slice(i,i+1000));if(error)throw new Error("Could not remove stored files from "+bucket+": "+error.message);}}
    }

    async function renderCreateAccount() {
      const { data: accessRow, error: accessError } = await supabaseClient.from("site_customizations").select("value").eq("key", "ui_settings_users_access").maybeSingle();
      if(accessError){const notice=document.createElement("section");notice.className="login-form";const heading=document.createElement("h1");heading.className="login-title";heading.textContent="Registration temporarily unavailable";const detail=document.createElement("p");detail.className="login-message";detail.dataset.type="error";detail.textContent="The account creation setting could not be verified. Please try again later.";notice.append(heading,detail);mainContent.replaceChildren(notice);return;}
      let accessConfig=accessRow&&accessRow.value?accessRow.value:{};
      if(typeof accessConfig==="string"){try{accessConfig=JSON.parse(accessConfig)}catch(_){accessConfig={}}}
      if(accessConfig.allow_account_creation===false){const notice=document.createElement("section");notice.className="login-form";const heading=document.createElement("h1");heading.className="login-title";heading.textContent="Account creation is disabled";const detail=document.createElement("p");detail.className="login-message";detail.dataset.type="info";detail.textContent="New account registration is currently disabled.";notice.append(heading,detail);mainContent.replaceChildren(notice);return;}
      const form = document.createElement("form");
      form.className = "login-form";

      const heading = document.createElement("h1");
      heading.className = "login-title";
      heading.textContent = "Create New Account";

      const email = document.createElement("input");
      email.className = "login-field";
      email.type = "email";
      email.name = "signup-email";
      email.placeholder = "Email Address";
      email.setAttribute("aria-label", "Email Address");
      email.autocomplete = "email";
      email.required = true;

      const password = document.createElement("input");
      password.className = "login-field";
      password.type = "password";
      password.name = "signup-password";
      password.placeholder = "Password (at least 12 characters)";
      password.setAttribute("aria-label", "Password");
      password.autocomplete = "new-password";
      password.minLength = 12;
      password.required = true;

      const confirmPassword = document.createElement("input");
      confirmPassword.className = "login-field";
      confirmPassword.type = "password";
      confirmPassword.name = "confirm-password";
      confirmPassword.placeholder = "Confirm Password";
      confirmPassword.setAttribute("aria-label", "Confirm Password");
      confirmPassword.autocomplete = "new-password";
      confirmPassword.minLength = 12;
      confirmPassword.required = true;

      const submit = document.createElement("button");
      submit.className = "login-submit";
      submit.type = "submit";
      submit.textContent = "Create Account";

      const message = document.createElement("p");
      message.className = "login-message";
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");

      const backToLogin = document.createElement("a");
      backToLogin.className = "create-account";
      backToLogin.href = "#login";
      backToLogin.textContent = "Already have an account? Login";
      backToLogin.addEventListener("click", (event) => {
        event.preventDefault();
        renderPage("Login");
        history.replaceState(null, "", "#login");
        setCurrentMenuPage("Login");
      });

      form.append(heading, email, password, confirmPassword, submit, message, backToLogin);
      mainContent.append(form);

      function setStatus(text, type) {
        message.dataset.type = type;
        message.replaceChildren(document.createTextNode(text));
      }

      function showExistingAccountMessage() {
        setStatus("This email may already be registered. Reset your password to continue.", "info");
        const resetLink = document.createElement("a");
        resetLink.className = "message-link";
        resetLink.href = "#forgot-password";
        resetLink.textContent = "Reset password";
        resetLink.addEventListener("click", (event) => {
          event.preventDefault();
          history.pushState(null, "", "#forgot-password");
          renderPage("ForgotPassword");
          setCurrentMenuPage("ForgotPassword");
        });
        message.append(resetLink);
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setStatus("", "error");

        if (password.value.length < 12) {
          setStatus("Use at least 12 characters for your password.", "error");
          password.focus();
          return;
        }
        if (password.value !== confirmPassword.value) {
          setStatus("Passwords don’t match. Please try again.", "error");
          confirmPassword.focus();
          return;
        }

        submit.disabled = true;
        submit.textContent = "Creating Account...";

        try {
          const { data, error } = await supabaseClient.auth.signUp({
            email: email.value.trim(),
            password: password.value,
            options: {
              emailRedirectTo: "https://dalimgari.github.io/dalimgari/#login"
            }
          });

          if (error) {
            const errorText = (error.message || "").toLowerCase();
            if (
              errorText.includes("already registered") ||
              errorText.includes("already exists") ||
              errorText.includes("user already")
            ) {
              showExistingAccountMessage();
            } else {
              const errorText = (error.message || "").toLowerCase();
              if (errorText.includes("rate limit") || errorText.includes("email rate limit")) {
                setStatus("Email limit reached. Please try again after one hour.", "error");
              } else if (errorText.includes("password")) {
                setStatus("Please choose a stronger valid password.", "error");
              } else if (errorText.includes("fetch") || errorText.includes("network")) {
                setStatus("Connection problem. Check your internet and try again.", "error");
              } else {
                setStatus("We couldn’t create your account. Please check your details and try again.", "error");
              }
            }
            submit.disabled = false;
            submit.textContent = "Create Account";
            return;
          }

          // Supabase can return an obfuscated user with no identities when
          // the submitted email already belongs to an account.
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            showExistingAccountMessage();
            submit.disabled = false;
            submit.textContent = "Create Account";
            return;
          }

          if (data.session) {
            setStatus("Your account is ready.", "success");
            renderPage("Profile");
            history.replaceState(null, "", "#profile");
            return;
          }

          setStatus("Check your inbox to confirm your email.", "success");
          form.reset();
          submit.disabled = false;
          submit.textContent = "Create Account";
        } catch (error) {
          setStatus("Connection problem. Please try again.", "error");
          submit.disabled = false;
          submit.textContent = "Create Account";
        }
      });
    }




    function renderForgotPassword() {
      const card = document.createElement("section");
      card.className = "login-form recovery-form";
      card.setAttribute("aria-live", "polite");

      const heading = document.createElement("h1");
      heading.className = "login-title";
      heading.textContent = "Forgot password?";

      const description = document.createElement("p");
      description.className = "recovery-description";
      description.textContent = "Enter the email address linked to your account. If it is registered, a password-reset link will be sent.";

      const form = document.createElement("form");
      const emailLabel = document.createElement("label");
      emailLabel.htmlFor = "recovery-email";
      emailLabel.textContent = "Email Address";
      const email = document.createElement("input");
      email.className = "login-field";
      email.id = "recovery-email";
      email.type = "email";
      email.name = "email";
      email.placeholder = "Email Address";
      email.autocomplete = "email";
      email.required = true;

      const message = document.createElement("p");
      message.className = "login-message";
      message.setAttribute("role", "status");
      message.setAttribute("aria-live", "polite");

      const submit = document.createElement("button");
      submit.className = "login-submit";
      submit.type = "submit";
      submit.textContent = "Check Account";

      const back = document.createElement("a");
      back.className = "create-account";
      back.href = "#login";
      back.textContent = "Back to Login";
      back.addEventListener("click", (event) => {
        event.preventDefault();
        history.pushState(null, "", "#login");
        renderPage("Login");
        setCurrentMenuPage("Login");
      });

      form.append(emailLabel, email, submit);
      card.append(heading, description, form, message, back);
      mainContent.replaceChildren(card);

      const recoveryStorageKey = "dalimgari-password-recovery";
      const setStatus = (text, type) => {
        message.textContent = text;
        message.dataset.type = type;
      };

      const showResetForm = () => {
        heading.textContent = "Reset password";
        description.textContent = "Enter a new password for your account.";
        setCurrentMenuPage("ForgotPassword");
        form.replaceChildren();

        const passwordLabel = document.createElement("label");
        passwordLabel.htmlFor = "new-password";
        passwordLabel.textContent = "New Password";
        const password = document.createElement("input");
        password.className = "login-field";
        password.id = "new-password";
        password.type = "password";
        password.autocomplete = "new-password";
        password.placeholder = "New password (at least 12 characters)";
        password.minLength = 12;
        password.required = true;

        const confirmLabel = document.createElement("label");
        confirmLabel.htmlFor = "confirm-new-password";
        confirmLabel.textContent = "Confirm New Password";
        const confirmPassword = document.createElement("input");
        confirmPassword.className = "login-field";
        confirmPassword.id = "confirm-new-password";
        confirmPassword.type = "password";
        confirmPassword.autocomplete = "new-password";
        confirmPassword.placeholder = "Re-enter new password";
        confirmPassword.minLength = 12;
        confirmPassword.required = true;

        const save = document.createElement("button");
        save.className = "login-submit";
        save.type = "submit";
        save.textContent = "Save New Password";
        form.append(passwordLabel, password, confirmLabel, confirmPassword, save);
        message.textContent = "";
        message.removeAttribute("data-type");

        // The auth client has consumed the recovery credentials; keep only the app route.
        history.replaceState(null, "", window.location.pathname + "#forgot-password");
        form.onsubmit = async (event) => {
          event.preventDefault();
          if (password.value.length < 12) {
            setStatus("Use at least 12 characters for your password.", "error");
            return;
          }
          if (password.value !== confirmPassword.value) {
            setStatus("Passwords don’t match. Please try again.", "error");
            confirmPassword.focus();
            return;
          }
          save.disabled = true;
          save.textContent = "Saving...";
          const { error } = await supabaseClient.auth.updateUser({ password: password.value });
          if (error) {
            setStatus("We couldn’t update your password. Please try again.", "error");
            save.disabled = false;
            save.textContent = "Save New Password";
            return;
          }
          sessionStorage.removeItem(recoveryStorageKey);
          heading.textContent = "Password updated";
          description.textContent = "Your password has been changed successfully. You can now return to the login page.";
          form.replaceChildren();
          message.textContent = "";
          back.textContent = "Return to Login";
          setCurrentMenuPage("ForgotPassword");
        };
      };

      form.addEventListener("submit", async (event) => {
        if (form.dataset.resetMode === "true") return;
        event.preventDefault();
        if (!email.checkValidity()) { email.reportValidity(); return; }
        submit.disabled = true;
        submit.textContent = "Checking...";
        message.textContent = "";
        // Keep the existing redirect URI, which may already be allow-listed in Supabase.
        const redirectTarget = new URL("forgot-password.html", window.location.href);
        redirectTarget.hash = "";
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: redirectTarget.href });
        if (error) setStatus("Couldn’t send the reset email. Please wait a little and try again.", "error");
        else setStatus("If this email is registered, a reset link will arrive shortly. Check your inbox and spam folder.", "success");
        submit.disabled = false;
        submit.textContent = "Check Account";
      });

      const originalShowResetForm = showResetForm;
      // Mark the form so the submit listener does not treat password updates as email requests.
      const safeShowResetForm = () => {
        form.dataset.resetMode = "true";
        originalShowResetForm();
      };
      supabaseClient.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" && routeIsForgotPassword()) safeShowResetForm();
      });

      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hasSavedRecoveryState = sessionStorage.getItem(recoveryStorageKey) === "true";
      const isRecoveryLink = params.has("code") ||
        (hashParams.get("type") === "recovery" && hashParams.has("access_token")) ||
        hasSavedRecoveryState;
      (async () => {
        const { data: currentSession } = await supabaseClient.auth.getSession();
        if (params.has("code")) {
          const { error } = await supabaseClient.auth.exchangeCodeForSession(params.get("code"));
          if (error) {
            sessionStorage.removeItem(recoveryStorageKey);
            setStatus("This reset link has expired. Request a new one.", "error");
            return;
          }
          sessionStorage.setItem(recoveryStorageKey, "true");
          history.replaceState(null, "", window.location.pathname + "#forgot-password");
          safeShowResetForm();
        } else if (hashParams.get("type") === "recovery" && hashParams.has("access_token")) {
          sessionStorage.setItem(recoveryStorageKey, "true");
          safeShowResetForm();
        } else if (hasSavedRecoveryState && currentSession.session) {
          safeShowResetForm();
        } else if (params.has("error") || hashParams.has("error")) {
          sessionStorage.removeItem(recoveryStorageKey);
          setStatus("This password-reset link is invalid or has expired. Request a new reset email.", "error");
        } else if (currentSession.session && !isRecoveryLink) {
          // A signed-in user can still request a reset link, so keep this route open.
        }
      })();
    }

    function routeIsForgotPassword() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      return window.location.hash.toLowerCase() === "#forgot-password" ||
        params.has("code") ||
        (hashParams.get("type") === "recovery" && hashParams.has("access_token")) ||
        sessionStorage.getItem("dalimgari-password-recovery") === "true";
    }

    function setCurrentMenuPage(pageName) {
      const currentPageLabel = document.querySelector("#current-page-label");
      const displayName = pageName === "Home"
        ? (window.DalimgariI18n?.t?.("Home") || "Home")
        : pageName === "Profile" && window.location.hash.toLowerCase() === "#edit-profile"
          ? "Edit Profile"
          : pageName === "CreateAccount"
            ? "Create Account"
            : pageName === "ForgotPassword"
              ? "Forgot Password"
              : pageName;
      if (currentPageLabel) currentPageLabel.textContent = displayName;
      const role = String((activeSession && activeSession.user && activeSession.user.app_metadata && activeSession.user.app_metadata.role) || "").toLowerCase();
      menuLinks.forEach((item) => {
        const isCurrentPage = item.dataset.page === pageName;
        if (isCurrentPage) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
        item.hidden = isCurrentPage || (item.dataset.page === "Dashboard" && role !== "admin");
      });
    }
    async function getCurrentUser() {
      try {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return data.user || null;
      } catch (error) {
        console.error("Could not load the current user:", error);
        return null;
      }
    }
    function metadataValue(user, key) { return (user.user_metadata && user.user_metadata[key]) || ""; }
    const DEFAULT_AVATAR_URL = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#e5e7eb"/><circle cx="50" cy="36" r="18" fill="#9ca3af"/><path d="M16 91c2-20 16-31 34-31s32 11 34 31" fill="#9ca3af"/></svg>');
    function setDefaultAvatar(container) {
      container.replaceChildren();
      const image = document.createElement("img");
      image.src = DEFAULT_AVATAR_URL;
      image.alt = "Default profile avatar";
      container.append(image);
    }

    async function resolveAvatarUrl(user) {
      const avatarUrl = metadataValue(user, "avatar_url");
      if (!avatarUrl.startsWith("data:image/")) return avatarUrl;
      try {
        const response = await fetch(avatarUrl);
        if (!response.ok) throw new Error("Could not read the existing profile picture.");
        const imageBlob = await response.blob();
        const filePath = user.id + "/avatar.jpg";
        const { error: uploadError } = await supabaseClient.storage
          .from("profile-pictures")
          .upload(filePath, imageBlob, { contentType: "image/jpeg", upsert: true, cacheControl: "0" });
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from("profile-pictures").getPublicUrl(filePath);
        const publicUrl = data.publicUrl + "?v=" + Date.now();
        const { error: metadataError } = await supabaseClient.auth.updateUser({ data: { avatar_url: publicUrl } });
        if (metadataError) throw metadataError;
        return publicUrl;
      } catch (error) {
        console.error("Could not move the existing profile picture to Storage:", error);
        return avatarUrl;
      }
    }

    async function loadUserProfile(user) {
      const { data, error } = await supabaseClient.from("profiles")
        .select("id,full_name,phone,date_of_birth,bio")
        .eq("id", user.id).maybeSingle();
      if (error) {
        console.error("Could not load the user record from the profiles table:", error);
        return { id: user.id, full_name: "", phone: "", date_of_birth: null, bio: "" };
      }
      return data || { id: user.id, full_name: "", phone: "", date_of_birth: null, bio: "" };
    }

    async function renderProfile() {
      const user = await getCurrentUser();
      if (!user) { renderPage("Login"); history.replaceState(null, "", "#login"); setCurrentMenuPage("Login"); return; }
      const profile = await loadUserProfile(user);
      const name = profile.full_name || "";
      const role = user.app_metadata && String(user.app_metadata.role || "").toLowerCase() === "admin" ? "ADMIN" : "MEMBER";
      const page = document.createElement("section"); page.className = "profile-page";
      const heading = document.createElement("h1"); heading.className = "profile-heading"; heading.textContent = "My Profile";
      const summary = document.createElement("div"); summary.className = "profile-summary";
      const avatar = document.createElement("div"); avatar.className = "profile-avatar";
      const avatarUrl = await resolveAvatarUrl(user);
      if (avatarUrl) {
        const avatarImage = document.createElement("img");
        avatarImage.src = avatarUrl;
        avatarImage.alt = "Profile picture";
        avatarImage.onerror = () => setDefaultAvatar(avatar);
        avatar.append(avatarImage);
      } else {
        setDefaultAvatar(avatar);
      }
      const identity = document.createElement("div");
      const nameLine = document.createElement("h2"); nameLine.className = "profile-name"; nameLine.append(document.createTextNode(name || "Not added"));
      const badge = document.createElement("span"); badge.className = "role-badge"; badge.textContent = role; nameLine.append(badge);
      const email = document.createElement("p"); email.className = "profile-email"; email.textContent = user.email || "";
      identity.append(nameLine, email);
      summary.append(avatar, identity);
      const info = document.createElement("section"); info.className = "profile-section";
      const infoHeading = document.createElement("h2"); infoHeading.textContent = "Profile Information";
      const details = document.createElement("div"); details.className = "profile-details";
      [["Full Name",name],["Phone Number",profile.phone||"Not added"],["Date of Birth",profile.date_of_birth||"Not added"],["Bio",profile.bio||"No bio yet"]].forEach(([label,value])=>{
        const item=document.createElement("div"), l=document.createElement("p"), v=document.createElement("p");
        l.className="detail-label";l.textContent=label;v.className="detail-value";v.textContent=value;item.append(l,v);details.append(item);
      });
      info.append(infoHeading,details);
      const actions=document.createElement("div");actions.className="profile-actions";
      const edit=document.createElement("button");edit.className="action-button primary";edit.textContent="Edit Profile";edit.type="button";
      edit.addEventListener("click",()=>{renderPage("EditProfile");history.replaceState(null,"","#edit-profile");});
      actions.append(edit);
      page.append(heading,summary,info,actions);mainContent.replaceChildren(page);setCurrentMenuPage("Profile");
    }

    let dashboardScriptPromise = null;
    async function renderDashboard() {
      const loading = document.createElement("section");
      loading.className = "dashboard-loading";
      loading.setAttribute("role", "status");
      loading.textContent = "Loading dashboard…";
      mainContent.replaceChildren(loading);

      window.DalimgariDashboardContext = {
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
        getCurrentUser,
        getRuntimeConfig: () => dalimgariRuntimeConfig
      };

      if (!dashboardScriptPromise) {
        dashboardScriptPromise = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = new URL("dashboard.js", window.location.href).href;
          script.async = true;
          script.onload = () => {
            if (window.DalimgariDashboard &&
                typeof window.DalimgariDashboard.renderDashboard === "function") {
              resolve();
            } else {
              reject(new Error("Dashboard module did not initialize."));
            }
          };
          script.onerror = () => reject(new Error("Could not load the dashboard module."));
          document.head.append(script);
        }).catch(error => {
          dashboardScriptPromise = null;
          throw error;
        });
      }

      try {
        await dashboardScriptPromise;
        await window.DalimgariDashboard.renderDashboard();
      } catch (error) {
        console.error("Could not load the dashboard:", error);
        const notice = document.createElement("section");
        notice.setAttribute("role", "alert");
        notice.className = "dashboard-load-error";
        notice.textContent = "Dashboard could not be loaded. Please refresh and try again.";
        mainContent.replaceChildren(notice);
      }
    }
    async function renderEditProfile() {
      const user=await getCurrentUser();
      if(!user){renderPage("Login");history.replaceState(null,"","#login");return;}
      const profile=await loadUserProfile(user);
      const page=document.createElement("section");page.className="profile-page";
      const heading=document.createElement("h1");heading.className="profile-heading";heading.textContent="Edit Profile";
      const form=document.createElement("form");form.className="edit-profile-form";
      function field(labelText,name,type,value){
        const label=document.createElement("label");label.htmlFor="edit-"+name;label.textContent=labelText;
        let input;if(type==="textarea"){input=document.createElement("textarea");input.rows=4;}else{input=document.createElement("input");input.type=type;}
        input.className="profile-input";input.id="edit-"+name;input.name=name;input.value=value||"";form.append(label,input);return input;
      }
      const avatarSection=document.createElement("section");avatarSection.className="profile-picture-editor";
      const avatarHeading=document.createElement("h2");avatarHeading.textContent="Profile Picture";
      const avatarRow=document.createElement("div");avatarRow.className="profile-picture-row";
      const avatarPreview=document.createElement("div");avatarPreview.className="profile-avatar profile-avatar-large";
      const currentAvatarUrl=await resolveAvatarUrl(user);
      if(currentAvatarUrl){const img=document.createElement("img");img.src=currentAvatarUrl;img.alt="Profile picture";img.onerror=()=>setDefaultAvatar(avatarPreview);avatarPreview.append(img);}
      else{setDefaultAvatar(avatarPreview);}
      const avatarControls=document.createElement("div");avatarControls.className="profile-picture-controls";
      const avatarLabel=document.createElement("label");avatarLabel.htmlFor="edit-profile-picture";avatarLabel.textContent="Change profile picture";
      const avatarInput=document.createElement("input");avatarInput.type="file";avatarInput.id="edit-profile-picture";avatarInput.accept="image/*";
      const avatarStatus=document.createElement("p");avatarStatus.className="profile-picture-status";avatarStatus.setAttribute("role","status");
      avatarControls.append(avatarLabel,avatarInput,avatarStatus);avatarRow.append(avatarPreview,avatarControls);avatarSection.append(avatarHeading,avatarRow);form.append(avatarSection);
      avatarInput.addEventListener("change",async()=>{
        const file=avatarInput.files&&avatarInput.files[0];if(!file)return;
        if(!file.type.startsWith("image/")){avatarStatus.textContent="Please choose an image file.";avatarInput.value="";return;}
        if(file.size>10*1024*1024){avatarStatus.textContent="Image must be 10 MB or smaller.";avatarInput.value="";return;}
        avatarInput.disabled=true;avatarStatus.textContent="Saving profile picture…";let objectUrl="";
        try{
          const image=new Image();objectUrl=URL.createObjectURL(file);
          await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=objectUrl;});
          const side=Math.min(image.naturalWidth,image.naturalHeight);if(!side)throw new Error("Invalid image.");
          const canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;
          const context=canvas.getContext("2d");if(!context)throw new Error("Image processing is unavailable.");
          context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);
          const compressedImage=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.8));
          if(!compressedImage)throw new Error("Could not process the image.");
          const filePath=user.id+"/avatar.jpg";
          const {error:uploadError}=await supabaseClient.storage.from("profile-pictures").upload(filePath,compressedImage,{contentType:"image/jpeg",upsert:true,cacheControl:"0"});
          if(uploadError)throw uploadError;
          const {data:publicUrlData}=supabaseClient.storage.from("profile-pictures").getPublicUrl(filePath);
          const publicUrl=publicUrlData.publicUrl+"?v="+Date.now();
          const result=await supabaseClient.auth.updateUser({data:{avatar_url:publicUrl}});if(result.error)throw result.error;
          avatarPreview.replaceChildren();const img=document.createElement("img");img.src=publicUrl;img.alt="Profile picture";avatarPreview.append(img);
          avatarStatus.textContent="Profile picture saved to Storage.";
        }catch(error){avatarStatus.textContent="Could not update the profile picture. Please try another image.";}
        finally{if(objectUrl)URL.revokeObjectURL(objectUrl);avatarInput.disabled=false;avatarInput.value="";}
      });

      const fullName=field("Full Name","full_name","text",profile.full_name||metadataValue(user,"full_name")||metadataValue(user,"name"));
      field("Phone Number","phone","tel",profile.phone);
      field("Date of Birth","date_of_birth","date",profile.date_of_birth);
      field("Bio","bio","textarea",profile.bio);
      const status=document.createElement("p");status.className="profile-status";status.setAttribute("role","status");
      const actions=document.createElement("div");actions.className="profile-actions";
      const save=document.createElement("button");save.className="action-button primary";save.type="submit";save.textContent="Save Changes";
      const cancel=document.createElement("button");cancel.className="action-button";cancel.type="button";cancel.textContent="Cancel";
      cancel.addEventListener("click",()=>{renderPage("Profile");history.replaceState(null,"","#profile");});
      actions.append(save,cancel);form.append(actions,status);
      form.addEventListener("submit",async(event)=>{
        event.preventDefault();save.disabled=true;save.textContent="Saving...";
        const profileData = {
          id: user.id,
          full_name: fullName.value.trim(),
          phone: form.elements.phone.value.trim() || null,
          date_of_birth: form.elements.date_of_birth.value || null,
          bio: form.elements.bio.value.trim() || null,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabaseClient.from("profiles").upsert(profileData, { onConflict: "id" });
        if(error){status.style.color="#a12622";status.textContent="Could not save your profile to the user table. Please try again.";save.disabled=false;save.textContent="Save Changes";return;}
        renderPage("Profile");history.replaceState(null,"","#profile");
      });
      page.append(heading,form);mainContent.replaceChildren(page);
    }

    // Keep menu actions synchronized with the real Supabase session.
    // Only route to Profile after sign-in when the user is on an auth page.
    // Do not override standalone Profile or Dashboard routes during session events.
    supabaseClient.auth.onAuthStateChange((event, session) => {
      updateAuthMenu(session);
      const recoveryHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const recoveryQuery = new URLSearchParams(window.location.search);
      const currentRoute = window.location.hash.toLowerCase();
      if (session && event === "SIGNED_IN" &&
          (currentRoute === "#login" || currentRoute === "#create-account") &&
          !recoveryQuery.has("code") &&
          !(recoveryHash.get("type") === "recovery" && recoveryHash.has("access_token"))) {
        renderPage("Profile");
        history.replaceState(null, "", "#profile");
        setCurrentMenuPage("Profile");
      }
    });

    (async () => {
      const route = () => {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        if (params.has("code") || params.has("error") ||
            (hashParams.get("type") === "recovery" && (hashParams.has("access_token") || hashParams.has("error")))) {
          return "#forgot-password";
        }
        if (params.has("page") && params.get("page") && !window.location.hash) return "#stored-page";
        return (window.location.hash.split("?")[0].toLowerCase() || "#home");
      };
      const openRoute = (session) => {
        updateAuthMenu(session);
        const currentRoute = route();
        if (currentRoute === "#stored-page") {
          renderStoredPage(new URLSearchParams(window.location.search).get("page"), session);
          setCurrentMenuPage("Home");
        } else if (currentRoute === "#home") {
          renderHome();
          setCurrentMenuPage("Home");
        } else if (currentRoute === "#gallery") {
          const galleryParams=new URLSearchParams(window.location.hash.includes("?")?window.location.hash.split("?").slice(1).join("?"):"");
          renderGalleryPage(galleryParams.get("album"),session);
          setCurrentMenuPage("Gallery");
        } else if (currentRoute === "#profile") {
          if (session) {
            renderPage("Profile");
            setCurrentMenuPage("Profile");
          } else {
            renderPage("Login");
            history.replaceState(null, "", "#login");
            setCurrentMenuPage("Login");
          }
        } else if (currentRoute === "#edit-profile") {
          if (session) {
            renderPage("EditProfile");
            setCurrentMenuPage("Profile");
          } else {
            renderPage("Login");
            history.replaceState(null, "", "#login");
            setCurrentMenuPage("Login");
          }
        } else if (currentRoute === "#forgot-password") {
          renderPage("ForgotPassword");
          setCurrentMenuPage("ForgotPassword");
        } else if (currentRoute === "#login") {
          if (session) {
            renderPage("Profile");
            history.replaceState(null, "", "#profile");
            setCurrentMenuPage("Profile");
          } else {
            renderPage("Login");
            setCurrentMenuPage("Login");
          }
        } else if (currentRoute === "#dashboard" || currentRoute.startsWith("#dashboard-")) {
          if (session) {
            renderPage("Dashboard");
            setCurrentMenuPage("Dashboard");
          } else {
            renderPage("Login");
            history.replaceState(null, "", "#login");
            setCurrentMenuPage("Login");
          }
        } else if (currentRoute === "#create-account" && !session) {
          renderPage("CreateAccount");
          setCurrentMenuPage("CreateAccount");
        } else {
          renderPage("Login");
          history.replaceState(null, "", "#login");
          setCurrentMenuPage("Login");
        }
      };

      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        openRoute(data.session);
      } catch (error) {
        console.error("Could not initialize the page session:", error);
        updateAuthMenu(null);
        const currentRoute = route();
        if (currentRoute === "#login") {
          renderPage("Login");
          setCurrentMenuPage("Login");
        } else if (currentRoute === "#forgot-password" || new URLSearchParams(window.location.search).has("code")) {
          renderPage("ForgotPassword");
          setCurrentMenuPage("ForgotPassword");
        } else if (currentRoute === "#create-account") {
          renderPage("CreateAccount");
          setCurrentMenuPage("CreateAccount");
        } else {
          // Preserve the requested route where possible if session lookup fails.
          mainContent.replaceChildren();
          setCurrentMenuPage("Home");
        }
      }
    })();

    const refreshCurrentRoute = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const currentRoute = params.has("code") ||
          (hashParams.get("type") === "recovery" && hashParams.has("access_token"))
          ? "#forgot-password"
          : (params.has("page") && params.get("page") && !window.location.hash
            ? "#stored-page" : (window.location.hash.split("?")[0].toLowerCase() || "#home"));
        if (currentRoute === "#media-upload") {
          // Backward compatibility: the uploader now lives on Home.
          history.replaceState(null, "", "#home");
          updateAuthMenu(data.session);
          await renderHome();
          setCurrentMenuPage("Home");
        } else if (currentRoute === "#stored-page") {
          updateAuthMenu(data.session);
          await renderStoredPage(params.get("page"), data.session);
          setCurrentMenuPage("Home");
        } else if (currentRoute === "#home") {
          updateAuthMenu(data.session);
          renderHome();
          setCurrentMenuPage("Home");
        } else if (currentRoute === "#gallery") {
          updateAuthMenu(data.session);
          const galleryParams=new URLSearchParams(window.location.hash.includes("?")?window.location.hash.split("?").slice(1).join("?"):"");
          renderGalleryPage(galleryParams.get("album"),data.session);
          setCurrentMenuPage("Gallery");
        } else if (currentRoute === "#forgot-password") {
          updateAuthMenu(data.session);
          renderPage("ForgotPassword");
          setCurrentMenuPage("ForgotPassword");
        } else {
          const session = data.session;
          updateAuthMenu(session);
          if (currentRoute === "#profile" && !session) {
            renderPage("Login"); history.replaceState(null, "", "#login"); setCurrentMenuPage("Login");
          } else if (currentRoute === "#dashboard" || currentRoute.startsWith("#dashboard-")) {
            if (session) { renderPage("Dashboard"); setCurrentMenuPage("Dashboard"); }
            else { renderPage("Login"); history.replaceState(null, "", "#login"); setCurrentMenuPage("Login"); }
          } else if (currentRoute === "#create-account" && !session) {
            renderPage("CreateAccount"); setCurrentMenuPage("CreateAccount");
          } else if (currentRoute === "#login" && session) {
            renderPage("Profile"); history.replaceState(null, "", "#profile"); setCurrentMenuPage("Profile");
          } else if (currentRoute === "#edit-profile" && session) {
            renderPage("EditProfile"); setCurrentMenuPage("Profile");
          } else if (currentRoute === "#login") {
            renderPage("Login"); setCurrentMenuPage("Login");
          } else if (currentRoute === "#create-account") {
            renderPage("Login"); history.replaceState(null, "", "#login"); setCurrentMenuPage("Login");
          } else if (currentRoute === "#profile") {
            renderPage("Profile"); setCurrentMenuPage("Profile");
          } else {
            mainContent.replaceChildren(); history.replaceState(null, "", "#home"); setCurrentMenuPage("Home");
          }
        }
      } catch (error) {
        console.error("Could not restore the current route:", error);
      }
    };
    document.addEventListener("dalimgari:languagechange", async () => {
      const hash=window.location.hash;
      const query=new URLSearchParams(window.location.search);
      const config=await applyDalimgariSiteConfig();
      const siteTitle=localizedSiteTitle(config);
      if(!hash&&query.has("page")) await renderStoredPage(query.get("page"),activeSession);
      else if(!hash||hash==="#home") await renderHome();
      else if(hash.startsWith("#gallery")){const params=new URLSearchParams(hash.includes("?")?hash.split("?").slice(1).join("?"):"");await renderGalleryPage(params.get("album"),activeSession);}
      else if(hash==="#stored-page") await renderStoredPage(new URLSearchParams(window.location.search).get("page"),activeSession);
      const isStoredPage=(!hash&&query.has("page"))||hash==="#stored-page";
      if(!isStoredPage && (!hash||hash==="#home"||hash==="#gallery"||hash.startsWith("#gallery"))) document.title=siteTitle;
      const label=document.querySelector("#current-page-label");
      if(label && !isStoredPage && (hash===""||hash==="#home")) label.textContent=window.DalimgariI18n?.t?.("Home") || "Home";
      if(label && (hash==="#profile"||hash==="#login"||hash==="#dashboard")) {
        const page=hash.slice(1);
        label.textContent=window.DalimgariI18n?.t?.(page.charAt(0).toUpperCase()+page.slice(1)) || page;
      }
    });
    window.addEventListener("hashchange", refreshCurrentRoute);
    window.addEventListener("popstate", refreshCurrentRoute);

    menuLinks.forEach((link) => {
      link.addEventListener("click", async () => {
        const pageName = link.dataset.page;
        try {
          // Home is always directly reachable, regardless of authentication state.
          if (pageName === "Home") {
            renderHome();
            history.replaceState(null, "", "#home");
            setCurrentMenuPage("Home");
          } else if (pageName === "Gallery") {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            const session = data.session || null;
            renderGalleryPage(null, session);
            history.replaceState(null, "", "#gallery");
            setCurrentMenuPage("Gallery");
          } else if (pageName === "Logout") {
            link.disabled = true;
            link.textContent = "Logging out...";
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            updateAuthMenu(null);
            renderPage("Login");
            history.replaceState(null, "", "#login");
            setCurrentMenuPage("Login");
          } else {
            let session = null;
            try {
              const { data, error } = await supabaseClient.auth.getSession();
              if (error) throw error;
              session = data.session;
            } catch (sessionError) {
              console.error("Could not check the session during navigation:", sessionError);
            }
            updateAuthMenu(session);
            const role = String((session && session.user && session.user.app_metadata && session.user.app_metadata.role) || "").toLowerCase();
            if (pageName === "Dashboard" && (!session || role !== "admin")) {
              renderPage(session ? "Profile" : "Login");
              const safePage = session ? "Profile" : "Login";
              history.replaceState(null, "", "#" + safePage.toLowerCase());
              setCurrentMenuPage(safePage);
            } else if (session && (pageName === "Login" || pageName === "CreateAccount")) {
              renderPage("Profile");
              history.replaceState(null, "", "#profile");
              setCurrentMenuPage("Profile");
            } else {
              renderPage(pageName);
              history.replaceState(null, "", pageName === "Home" ? "#home" : "#" + pageName.toLowerCase());
              setCurrentMenuPage(pageName);
            }
          }
        } catch (error) {
          console.error("Menu navigation failed:", error);
          updateAuthMenu(null);
          renderPage("Login");
          history.replaceState(null, "", "#login");
          setCurrentMenuPage("Login");
        } finally {
          link.disabled = false;
          floatingMenu.hidden = true;
          menuButton.setAttribute("aria-expanded", "false");
          menuButton.setAttribute("aria-label", "Open menu");
          if (pageName === "Logout") link.textContent = "Login";
        }
      });
    });