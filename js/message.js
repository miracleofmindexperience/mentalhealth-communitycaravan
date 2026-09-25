import { MESSAGE_TEXT as T } from "./config.js";
import { activeLocs, rsvpValid } from "./state.js";

/* Builds the WhatsApp message text from the current state. */
export function buildMessage(state) {
  const locs = activeLocs(state);
  const note = (state.note || "").trim();
  const when = "📅 *" + (state.date || "").trim() + "* | ⏰ *" + (state.time || "").trim() + "*" + (note ? ", " + note : "");
  const lines = [T.title, T.intro, when, T.locationsHeader(locs.length)];
  locs.forEach(l => lines.push("• " + [l.city.trim(), l.spot.trim()].filter(Boolean).join(": ")));
  lines.push(T.closing);
  lines.push(T.rsvpLabel + (rsvpValid(state) ? state.rsvp.trim() : T.rsvpMissing));
  return lines.join("\n");
}
