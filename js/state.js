import { STORAGE_KEY, PRESETS, DEFAULT_PRESET } from "./config.js";

/* Which preset the page is using: ?preset=<key> if valid, else the default. */
export function activePresetKey() {
  const key = new URLSearchParams(location.search).get("preset");
  return key && PRESETS[key] ? key : DEFAULT_PRESET;
}

export function presetData(key = activePresetKey()) {
  return structuredClone(PRESETS[key].data);
}

/* A ?preset= link always starts fresh from that preset; otherwise resume the saved draft. */
export function loadState() {
  if (!new URLSearchParams(location.search).has("preset")) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Array.isArray(saved.locs)) return saved;
    } catch (e) {}
  }
  return presetData();
}

export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* Locations with at least a city or a spot filled in. */
export function activeLocs(state) {
  return state.locs.filter(l => (l.city || "").trim() || (l.spot || "").trim());
}

export function rsvpValid(state) {
  return /^https?:\/\/\S+\.\S+/i.test((state.rsvp || "").trim());
}
