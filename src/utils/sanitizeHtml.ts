const ALLOWED_TAGS = new Set([
  "A", "B", "BLOCKQUOTE", "BR", "CAPTION", "CODE", "DD", "DEL", "DETAILS",
  "DIV", "DL", "DT", "EM", "FIGCAPTION", "FIGURE", "H1", "H2", "H3", "H4",
  "HR", "I", "IMG", "LI", "OL", "P", "PRE", "S", "SMALL", "SPAN", "STRONG",
  "SUB", "SUMMARY", "SUP", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD",
  "TR", "U", "UL",
]);
const DROP_CONTENT_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "MATH",
  "TEMPLATE",
]);
const GLOBAL_ATTRIBUTES = new Set(["class", "title", "lang", "dir"]);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "width", "height", "loading"]),
  TD: new Set(["colspan", "rowspan", "headers"]),
  TH: new Set(["colspan", "rowspan", "scope", "headers"]),
  OL: new Set(["start", "reversed", "type"]),
  LI: new Set(["value"]),
};

/** Sanitizes public custom-page HTML before it is inserted into the DOM. */
export function sanitizeHtml(input: string): string {
  const document = new DOMParser().parseFromString(input, "text/html");
  const clean = (parent: Node) => {
    for (const node of Array.from(parent.childNodes)) {
      if (!(node instanceof Element)) continue;
      if (DROP_CONTENT_TAGS.has(node.tagName)) {
        node.remove();
        continue;
      }
      clean(node);
      if (!ALLOWED_TAGS.has(node.tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
        continue;
      }
      for (const attribute of Array.from(node.attributes)) {
        const name = attribute.name.toLowerCase();
        const allowed = GLOBAL_ATTRIBUTES.has(name) || TAG_ATTRIBUTES[node.tagName]?.has(name);
        if (!allowed || name.startsWith("on") || name === "style" || name === "srcdoc") {
          node.removeAttribute(attribute.name);
          continue;
        }
        if (name === "href" || name === "src") {
          const value = attribute.value.trim();
          if (
            !value ||
            value.startsWith("//") ||
            /^(?:javascript|data|vbscript|file):/i.test(value) ||
            !/^(?:https?:|mailto:|tel:|\/|#|\.?\.?\/)/i.test(value)
          ) {
            node.removeAttribute(attribute.name);
          }
        }
      }
      if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      }
      if (node.tagName === "IMG") {
        node.setAttribute("loading", "lazy");
        node.setAttribute("decoding", "async");
      }
    }
  };
  clean(document.body);
  return document.body.innerHTML;
}
