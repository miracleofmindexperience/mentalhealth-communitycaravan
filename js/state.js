import { STORAGE_KEY, PRESETS, DEFAULT_PRESET, ROUTE_INFO, DEFAULT_ROUTE_INFO, ROUTE_TYPES, FLYER_TEXT, DEFAULT_MATERIALS, OLD_DEFAULT_MATERIALS, RSVP_TYPES, DEFAULT_RSVP_TYPE } from "./config.js";

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
  s.locs = s.locs.map(newLoc);
  if (!ROUTE_INFO[s.routeInfo]) s.routeInfo = DEFAULT_ROUTE_INFO;
  const str = v => typeof v === "string" ? v : "";
  s.routeInfoText = str(s.routeInfoText);
  s.note = str(s.note);
  s.contact = str(s.contact);
  if (!RSVP_TYPES[s.rsvpType]) s.rsvpType = DEFAULT_RSVP_TYPE; // drafts from before phone RSVP used a form
  s.rsvpPhone = str(s.rsvpPhone);
  if (typeof s.materials !== "string" || OLD_DEFAULT_MATERIALS.includes(s.materials.trim())) s.materials = DEFAULT_MATERIALS;
  if (typeof s.strip !== "string") s.strip = null;     // null = automatic text
  if (typeof s.message !== "string") s.message = null; // null = built from the form
  return s;
}

/* A location with every field present. */
export function newLoc(l = {}) {
  return {
    city: l.city || "",
    spot: l.spot || "",
    type: ROUTE_TYPES[l.type] ? l.type : "loop",
    end: l.end || "",
    address: l.address || "",   // message only
    ownWhen: !!l.ownWhen,       // true = its own date/time below
    date: l.date || "",
    time: l.time || ""
  };
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

/* Date and time for one location: its own if set, otherwise the main ones. */
export function locWhen(state, l) {
  const own = l.ownWhen;
  return {
    date: ((own && l.date.trim()) || state.date || "").trim(),
    time: ((own && l.time.trim()) || state.time || "").trim()
  };
}

/* True when the locations don't all share the same date and time. */
export function hasMultipleWhens(state) {
  const keys = activeLocs(state).map(l => { const w = locWhen(state, l); return w.date + "|" + w.time; });
  return new Set(keys).size > 1;
}

/* Date and time for the flyer's date strip. When locations differ, lists
   every date ("Sat, Oct 10, 17 & 24" if they share a prefix) and keeps the
   time only if it's the same everywhere. */
export function stripWhen(state) {
  if (!hasMultipleWhens(state)) return { date: (state.date || "").trim(), time: (state.time || "").trim() };
  const whens = activeLocs(state).map(l => locWhen(state, l));
  const uniq = list => [...new Set(list.filter(Boolean))];
  const dates = uniq(whens.map(w => w.date)), times = uniq(whens.map(w => w.time));
  return { date: compactDates(dates), time: times.length === 1 ? times[0] : "" };
}

function joinList(items) {
  return items.length <= 1 ? items.join("") : items.slice(0, -1).join(", ") + " & " + items[items.length - 1];
}

/* ["Sat, Oct 10", "Sat, Oct 17"] -> "Sat, Oct 10 & 17"; otherwise joined with " · ". */
function compactDates(dates) {
  const parts = dates.map(d => d.match(/^(.*?)(\d{1,2})$/));
  if (parts.length > 1 && parts.every(p => p && p[1] === parts[0][1])) return parts[0][1] + joinList(parts.map(p => p[2]));
  return dates.join(" · ");
}

/* True when route instructions and the (unchanged) materials note both happen
   at the meetup point, so the flyer and message say them in one line. */
export function meetupWithMaterials(state) {
  return state.routeInfo === "meetup" && state.materials.trim() === DEFAULT_MATERIALS;
}

/* The "route instructions will be shared…" sentence ("" if left blank). */
export function routeInfoText(state) {
  const opt = ROUTE_INFO[state.routeInfo];
  return (opt.text === null ? state.routeInfoText : opt.text).trim();
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

/* The RSVP phone number as typed ("" if blank). */
export function rsvpPhone(state) {
  return (state.rsvpPhone || "").trim();
}

/* A phone number has 10 to 15 digits, whatever the separators. */
export function rsvpPhoneValid(state) {
  const digits = rsvpPhone(state).replace(/\D/g, "").length;
  return digits >= 10 && digits <= 15;
}
