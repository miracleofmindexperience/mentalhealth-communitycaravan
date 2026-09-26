import { MESSAGE_TEXT as T } from "./config.js";
import { activeLocs, rsvpUrl, locWhen, hasMultipleWhens, routeInfoText } from "./state.js";

const INDENT = "   ";

function whenText(w, note) {
  return [w.date && "📅 *" + w.date + "*", w.time && "⏰ *" + w.time + "*"].filter(Boolean).join(" | ")
    + (note ? ", " + note : "");
}

/* One route: "• *City:* start → finish", then its own date (when locations
   differ) and its address on indented lines. */
function routeLines(state, l, multi, note) {
  const city = l.city.trim(), start = l.spot.trim();
  const route = l.type === "loop"
    ? start + T.loopSuffix
    : start + " → " + (l.end.trim() || T.finishLater);
  const lines = ["• " + (city ? "*" + city + ":* " : "") + route.trim()];
  if (multi) lines.push(INDENT + whenText(locWhen(state, l), note));
  if (l.address.trim()) lines.push(INDENT + "📌 " + l.address.trim());
  return lines;
}

/* Builds the WhatsApp message from the form. Blank optional fields are left out. */
export function buildMessage(state) {
  const locs = activeLocs(state);
  const note = state.note.trim();
  const multi = hasMultipleWhens(state);
  const lines = [T.title, T.intro];
  if (!multi) lines.push(whenText({ date: (state.date || "").trim(), time: (state.time || "").trim() }, note));
  lines.push(T.locationsHeader(locs.length));
  locs.forEach(l => lines.push(...routeLines(state, l, multi, note)));

  const info = routeInfoText(state);
  if (info) lines.push(T.routeInfoIcon + info);
  lines.push(T.safetyLabel + T.safetyPoints.join(T.separator));
  if (state.materials.trim()) lines.push(T.materialsIcon + state.materials.trim());
  lines.push(T.closing);
  lines.push(T.rsvpLabel + (rsvpUrl(state) || T.rsvpMissing));
  if (state.contact.trim()) lines.push(T.contactLabel + state.contact.trim());
  return lines.join("\n");
}
