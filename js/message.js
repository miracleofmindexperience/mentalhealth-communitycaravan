import { MESSAGE_TEXT as T } from "./config.js";
import { activeLocs, allLoops, rsvpUrl, locWhen, hasMultipleWhens, routeInfoText, meetupWithMaterials } from "./state.js";

const INDENT = "   ";

function whenText(w, note) {
  return [w.date && "📅 *" + w.date + "*", w.time && "⏰ *" + w.time + "*"].filter(Boolean).join(" | ")
    + (note ? ", " + note : "");
}

/* One route: "• *City:* start → finish", then its own date (when locations
   differ) and its address on indented lines. */
function routeLines(state, l, multi, note, loopsInHeader) {
  const city = l.city.trim(), start = l.spot.trim();
  const route = l.type === "loop"
    ? start + (loopsInHeader ? "" : T.loopSuffix)
    : start + " → " + (l.end.trim() || T.finishLater);
  const lines = ["• " + (city ? "*" + city + ":* " : "") + route.trim()];
  if (multi) lines.push(INDENT + whenText(locWhen(state, l), note));
  if (l.address.trim()) lines.push(INDENT + "📌 " + l.address.trim());
  return lines;
}

/* Builds the WhatsApp message from the form. Blank optional fields are left
   out. Lines are grouped into blocks with one blank line between blocks:
   intro, when and routes, practical notes, sign-off. */
export function buildMessage(state) {
  const locs = activeLocs(state);
  const note = state.note.trim();
  const multi = hasMultipleWhens(state);

  const intro = [T.title, T.intro];

  const routes = [];
  if (!multi) routes.push(whenText({ date: (state.date || "").trim(), time: (state.time || "").trim() }, note));
  const loops = allLoops(locs); // every route is a loop: say it once in the header
  routes.push(T.locationsHeader(locs.length, loops));
  locs.forEach(l => routes.push(...routeLines(state, l, multi, note, loops)));

  const notes = [T.safetyLabel + T.safetyPoints.join(T.separator)];
  const info = routeInfoText(state), materials = state.materials.trim();
  if (meetupWithMaterials(state)) {
    notes.push(T.meetupAndMaterials); // both happen at the meetup point: one line
  } else {
    if (info) notes.push(T.routeInfoIcon + info);
    if (materials) notes.push(T.materialsIcon + materials);
  }

  const signOff = [T.closing, T.rsvpLabel + (rsvpUrl(state) || T.rsvpMissing)];
  if (state.contact.trim()) signOff.push(T.contactLabel + state.contact.trim());

  return [intro, routes, notes, signOff].map(block => block.join("\n")).join("\n\n");
}
