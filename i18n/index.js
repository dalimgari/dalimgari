/* Lightweight legacy-app i18n runtime. User-managed content is deliberately excluded. */
(() => {
  "use strict";
  const STORAGE_KEY = "dalimgari-language";
  const supported = new Set(["bn", "en"]);
  const originalText = new WeakMap();
  const lastRenderedText = new WeakMap();
  const originalAttrs = new WeakMap();
  const excluded = "script,style,textarea,[contenteditable='true'],.stored-html-page,.home-content-card,[data-user-content]";
  const getDictionary = lang => lang === "en" ? (window.DG_I18N_EN || {}) : (window.DG_I18N_BN || {});
  const normalize = value => String(value || "").replace(/\s+/g, " ").trim();
  let language = "bn";
  function translate(value) {
    const dict = getDictionary(language);
    const source = String(value ?? "");
    const key = normalize(source);
    if (!Object.prototype.hasOwnProperty.call(dict, key)) return value;
        const leading = source.match(/^\s*/)?.[0] || "";
        const trailing = source.match(/\s*$/)?.[0] || "";
    return leading + dict[key] + trailing;
  }
  function eligible(node) {
    const parent = node.parentElement;
    return parent && !parent.closest(excluded);
  }
  function apply(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!eligible(node) || !normalize(node.nodeValue)) continue;
      if (!originalText.has(node) || (lastRenderedText.has(node) && node.nodeValue !== lastRenderedText.get(node))) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      const translated = translate(source);
      if (node.nodeValue !== translated) node.nodeValue = translated;
      lastRenderedText.set(node, translated);
    }
    const elements = root.nodeType === 1 ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
    for (const el of elements) {
      if (el.matches(excluded) || el.closest(excluded)) continue;
      for (const attr of ["placeholder", "title", "aria-label", "aria-description"]) {
        if (!el.hasAttribute(attr)) continue;
        let map = originalAttrs.get(el);
        if (!map) { map = {}; originalAttrs.set(el, map); }
        if (!(attr in map)) map[attr] = el.getAttribute(attr);
        const translated = translate(map[attr]);
        if (el.getAttribute(attr) !== translated) el.setAttribute(attr, translated);
      }
    }
  }
  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !eligible(node) || !normalize(node.nodeValue)) return;
    if (!originalText.has(node) || (lastRenderedText.has(node) && node.nodeValue !== lastRenderedText.get(node))) {
      originalText.set(node, node.nodeValue);
    }
    const translated = translate(originalText.get(node));
    if (node.nodeValue !== translated) node.nodeValue = translated;
    lastRenderedText.set(node, translated);
  }

  function setLanguage(next) {
    language = supported.has(next) ? next : "bn";
    try { localStorage.setItem(STORAGE_KEY, language); } catch (_) {}
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    apply();
    const selector = document.querySelector("#language-switcher");
    if (selector) {
      selector.setAttribute("aria-label", language === "bn" ? "Switch language to English" : "Switch language to Bengali");
      selector.setAttribute("title", language === "bn" ? "Switch to English" : "Switch to Bengali");
    }
    document.dispatchEvent(new CustomEvent("dalimgari:languagechange", { detail: { language } }));
  }
  function init() {
    let stored = "bn";
    try { stored = localStorage.getItem(STORAGE_KEY) || "bn"; } catch (_) {}
    const selector = document.querySelector("#language-switcher");
    if (selector) selector.addEventListener("click", () => setLanguage(language === "bn" ? "en" : "bn"));
    setLanguage(stored);
    const pendingRoots = new Set();
    const pendingTextNodes = new Set();
    let flushScheduled = false;

    const flushPendingTranslations = () => {
      flushScheduled = false;
      const roots = Array.from(pendingRoots);
      const textNodes = Array.from(pendingTextNodes);
      pendingRoots.clear();
      pendingTextNodes.clear();

      // A parent root already covers all of its descendants; avoid walking the same
      // subtree repeatedly when frameworks append a parent and its children together.
      const uniqueRoots = roots.filter((root, index) =>
        root.isConnected && !roots.some((other, otherIndex) =>
          index !== otherIndex && other.isConnected && other !== root &&
          typeof other.contains === "function" && other.contains(root)
        )
      );
      for (const root of uniqueRoots) apply(root);
      for (const node of textNodes) {
        if (node.isConnected && !uniqueRoots.some(root => root === node.parentElement || root.contains(node))) {
          translateTextNode(node);
        }
      }
    };

    const scheduleTranslationFlush = () => {
      if (flushScheduled) return;
      flushScheduled = true;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(flushPendingTranslations);
      } else {
        window.setTimeout(flushPendingTranslations, 0);
      }
    };

    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "childList") {
          for (const node of record.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) pendingRoots.add(node);
            else if (node.nodeType === Node.TEXT_NODE) pendingTextNodes.add(node);
          }
        } else if (record.type === "characterData") {
          pendingTextNodes.add(record.target);
        }
      }
      if (pendingRoots.size || pendingTextNodes.size) scheduleTranslationFlush();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  window.DalimgariI18n = { setLanguage, getLanguage: () => language, t: translate, apply };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();