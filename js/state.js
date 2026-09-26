import { STORAGE_KEY, PRESETS, DEFAULT_PRESET, ROUTE_INFO, DEFAULT_ROUTE_INFO, ROUTE_TYPES, FLYER_TEXT } from "./config.js";

/* Which preset the page is using: ?preset=<key> if valid, else the default. */
export function activePresetKey() {
  const key = new URLSearchParams(location.search).get("preset");
  return key && PRESETS[key] ? key : DEFAULT_PRESET;
}

export function presetData(key = activePresetKey()) {
  return normalize(structuredClone(PRESETS[key].data));
}

/* Fills in fields missing from older saved drafts or presets.
   Drafts saved before route types existed were all loops. */
function normalize(s) {
  s.locs = s.locs.map(l => ({
    city: l.city || "",
    spot: l.spot || "",
    type: ROUTE_TYPES[l.type] ? l.type : "loop",
    end: l.end || ""
  }));
  if (!ROUTE_INFO[s.routeInfo]) s.routeInfo = DEFAULT_ROUTE_INFO;
  if (typeof s.strip !== "string") s.strip = null; // null = automatic text
  return s;
}

/* A ?preset= link always starts fresh from that preset; otherwise resume the saved draft. */
export function loadState() {
  if (!new URLSearchParams(location.search).has("preset")) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.locs)) return normalize(saved);
    } catch (e) {}
  }
  return presetData();
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* Locations with at least a city or a spot filled in. */
export function activeLocs(state) {
  return state.locs.filter(l => (l.city || "").trim() || (l.spot || "").trim() || (l.end || "").trim());
}

export function allLoops(locs) {
  return locs.length > 0 && locs.every(l => l.type === "loop");
}

/* The line next to the date on the flyer, worked out from the routes and area. */
export function autoStripText(state) {
  const locs = activeLocs(state);
  return FLYER_TEXT.routesSummary(locs.length, (state.area || "").trim(), allLoops(locs));
}

/* What the flyer shows next to the date: the coordinator's own text if they
   typed one (empty = nothing), otherwise the automatic text. */
export function stripText(state) {
  return state.strip === null ? autoStripText(state) : state.strip.trim();
}

/* The RSVP link as a full URL, or "" if it doesn't look like a link.
   "https://" is added when missing, so "forms.gle/abc" works too. */
export function rsvpUrl(state) {
  let v = (state.rsvp || "").trim();
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) v = "https://" + v.replace(/^\/+/, "");
  // host with a dot and a letter TLD (e.g. forms.gle), then an optional path
  return /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i.test(v) ? v : "";
}

export function rsvpValid(state) {
  return rsvpUrl(state) !== "";
}
