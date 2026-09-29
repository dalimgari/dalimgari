import { supabase } from "./supabaseClient";

function getDeviceType() {
  const width = window.innerWidth;

  if (width <= 767) return "mobile";
  if (width <= 1023) return "tablet";
  return "desktop";
}

function getBrowser() {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Safari/")) return "Safari";

  return "Unknown";
}

function getOperatingSystem() {
  const userAgent = navigator.userAgent;

  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";

  return "Unknown";
}

function getVisitorId() {
  const key = "dalimgari_visitor_id";
  let visitorId = localStorage.getItem(key);

  if (!visitorId) {
    visitorId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(key, visitorId);
  }

  return visitorId;
}

export async function trackVisit(pagePath = window.location.pathname) {
  try {
    const visitorId = getVisitorId();

    const { data: existingVisits } = await supabase
      .from("UserInformation")
      .select("id")
      .eq("record_type", "visit")
      .eq("visitor_id", visitorId)
      .limit(1);

    const isReturning = Boolean(existingVisits?.length);

    const { error } = await supabase
      .from("UserInformation")
      .insert({
        record_type: "visit",
        user_id: null,
        visitor_id: visitorId,
        page_path: pagePath,
        referrer: document.referrer || null,
        device_type: getDeviceType(),
        browser: getBrowser(),
        operating_system: getOperatingSystem(),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        is_returning: isReturning
      });

    if (error) {
      console.error("Visitor analytics error:", error.message);
    }
  } catch (error) {
    console.error("Visitor analytics error:", error);
  }
}
