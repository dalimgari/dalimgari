import { supabase } from "../lib/supabaseClient";

function getVisitorId() {
  const key = "dalimgari_visitor_id";
  let value = localStorage.getItem(key);

  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
    return { value, returning: false };
  }

  return { value, returning: true };
}

function detectDevice() {
  const width = window.innerWidth;

  if (width <= 767) return "Mobile";
  if (width <= 1024) return "Tablet";
  return "Desktop";
}

function detectBrowser() {
  const agent = navigator.userAgent;

  if (agent.includes("Edg/")) return "Edge";
  if (agent.includes("OPR/")) return "Opera";
  if (agent.includes("Chrome/")) return "Chrome";
  if (agent.includes("Firefox/")) return "Firefox";
  if (agent.includes("Safari/")) return "Safari";

  return "Other";
}

function detectOperatingSystem() {
  const agent = navigator.userAgent;

  if (/Android/i.test(agent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(agent)) return "iOS";
  if (/Windows/i.test(agent)) return "Windows";
  if (/Mac OS/i.test(agent)) return "macOS";
  if (/Linux/i.test(agent)) return "Linux";

  return "Other";
}

let trackedThisLoad = false;

export async function trackVisit(userId = null) {
  if (trackedThisLoad) return;

  trackedThisLoad = true;

  try {
    const visitor = getVisitorId();

    await supabase.from("UserInformation").insert({
      visitor_id: visitor.value,
      user_id: userId,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      device_type: detectDevice(),
      browser: detectBrowser(),
      operating_system: detectOperatingSystem(),
      language: navigator.language || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      screen_width: window.screen.width || null,
      screen_height: window.screen.height || null,
      is_returning: visitor.returning
    });
  } catch {
    return;
  }
}
