import { MESSAGE_TEXT as T, ROUTE_INFO } from "./config.js";
import { activeLocs, rsvpUrl } from "./state.js";

function routeLine(l) {
  const city = l.city.trim(), start = l.spot.trim();
  let route;
  if (l.type === "loop") route = start + T.loopSuffix;
  else route = start + " → " + (l.end.trim() || T.finishLater);
  return "• " + [city, route.trim()].filter(Boolean).join(": ");
}

/* Builds the WhatsApp message text from the current state. */
export function buildMessage(state) {
  const locs = activeLocs(state);
  const note = (state.note || "").trim();
  const when = "📅 *" + (state.date || "").trim() + "* | ⏰ *" + (state.time || "").trim() + "*" + (note ? ", " + note : "");
  const lines = [T.title, T.intro, when, T.locationsHeader(locs.length)];
  locs.forEach(l => lines.push(routeLine(l)));
  lines.push(T.routeInfoIcon + ROUTE_INFO[state.routeInfo].text);
  lines.push(T.safety);
  lines.push(T.closing);
  lines.push(T.rsvpLabel + (rsvpUrl(state) || T.rsvpMissing));
  return lines.join("\n");
}
