/*
 * All editable content lives here: event wording, flyer text, colors,
 * limits and the example presets. Change this file for a new event,
 * a new city or a new year; the rest of the code reads from it.
 */

export const MOM_URL = "https://miracleofmind.org";
export const LOGO_SRC = "assets/mom-logo.png";

/* Where each user's in-progress draft is saved in their browser.
   Bump the version if the saved data shape changes. */
export const STORAGE_KEY = "caravan-flyer-draft-v1";

export const MAX_LOCATIONS = 4;

/* Colors used on the flyer image (the page UI colors are in css/styles.css). */
export const COLORS = {
  accent: "#B8561B",
  navy: "#1E2A44",
  forest: "#26402E",
  gold: "#E4B978",
  cream: "#F6F1E7",
  white: "#FFFFFF",
  muted: "#6A7390",
  body: "#3A4460",
  divider: "#5A6690",
  subtle: "#D6DAE6",
  cardBorder: "#E4DCCB",
  logoTile: "#000000",
  dash: "#B9BFCC"
};

export const FONTS = {
  serif: '"Fraunces", Georgia, serif',
  sans: '"DM Sans", system-ui, sans-serif',
  /* Preloaded before drawing so the canvas never renders with fallback fonts. */
  preload: ["700 84px Fraunces", "italic 600 36px Fraunces", "700 22px 'DM Sans'", "400 22px 'DM Sans'"]
};

/* Every piece of text printed on the flyer image. */
export const FLYER_TEXT = {
  badge: "WORLD MENTAL HEALTH DAY",
  titleLine1: "Community",
  titleLine2: "Caravan",
  appCaption: "Free 7-min meditation app · Scan",
  tagline: "Let’s drive the conversation.",
  description: "A silent group drive in our own cars, with mental-wellness signs and Miracle of Mind QR codes. No honking, no speeches. Just quiet, visible support.",
  startHeader: "START",
  finishHeader: "FINISH",
  loopFinish: "Back to start",
  routeFooter: "START & FINISH · LOOP DRIVE",  // bottom of each loop card
  finishLater: "Shared with route instructions",
  cityPlaceholder: "City",
  spotPlaceholder: "Meeting spot",
  safety: "Safety first: follow all traffic laws, drive at the pace of traffic, and no honking or sudden stops.",
  closingHeadline: "Open to all. Everyone’s welcome!",
  closingSub: "Bring your family and friends - and your car.",
  rsvpTitle: "RSVP",
  rsvpSub: "Scan to sign up",
  rsvpEmpty: ["Add form", "link"],
  /* Subtitle in the date strip. n = number of locations, area = area name,
     allLoops = every route ends where it starts. */
  routesSummary: (n, area, allLoops) => {
    const where = area ? (n <= 1 ? " in " : " across ") + area : "";
    if (n <= 1) return (allLoops ? "Loop drive" : "Caravan drive") + where;
    return n + (allLoops ? " loop routes" : " routes") + where;
  }
};

/* The WhatsApp message. Lines with *stars* render bold in WhatsApp. */
export const MESSAGE_TEXT = {
  title: "🚗 *Community Caravan for World Mental Health Day*",
  intro: "A silent group drive in our own cars, with mental-wellness signs and QR codes for *Miracle of Mind*, a free 7-minute meditation app. No honking, no speeches. Just quiet, visible support for mental well-being.",
  locationsHeader: n => n > 1 ? "📍 *Routes:*" : "📍 *Route:*",
  loopSuffix: " (loop, back to start)",
  finishLater: "finish shared with route instructions",
  routeInfoIcon: "🧭 ",
  safety: "🚦 *Safety first:* follow all traffic laws, drive at the pace of traffic, and no honking or sudden stops.",
  closing: "🙏 Open to all. Bring family & friends!",
  rsvpLabel: "✅ RSVP: ",
  rsvpMissing: "[GOOGLE FORM LINK]"
};

/* "When are route instructions shared?" choices. `text` is printed on the
   flyer and in the message. */
export const ROUTE_INFO = {
  meetup: { label: "At the meetup point", text: "Route instructions will be shared at the meetup point." },
  before: { label: "Before the event", text: "Route instructions will be shared before the event." },
  both: { label: "Before the event and at the meetup point", text: "Route instructions will be shared before the event and again at the meetup point." }
};
export const DEFAULT_ROUTE_INFO = "meetup";

/* Route types for each location. */
export const ROUTE_TYPES = { oneway: "Start → finish", loop: "Loop (back to start)" };
export const NEW_LOCATION_TYPE = "oneway";

export const DOWNLOAD_PREFIX = "caravan-flyer-";

/*
 * Ready-made examples. Add a new city by adding an entry here.
 * Open the page with ?preset=<key> (e.g. ?preset=atlanta) to start from
 * that preset; DEFAULT_PRESET is used otherwise.
 */
export const PRESETS = {
  atlanta: {
    label: "Atlanta",
    data: {
      date: "Sat, Oct 10",
      time: "12 – 1 PM",
      note: "right after Satsang",
      area: "metro Atlanta",
      rsvp: "",
      routeInfo: "meetup",
      locs: [
        { city: "Cumming", spot: "Midway Park Community Building", type: "loop" },
        { city: "Atlanta", spot: "Sheraton Atlanta Perimeter North", type: "loop" },
        { city: "Duluth", spot: "W.P. Jones Memorial Park", type: "loop" }
      ]
    }
  }
};

export const DEFAULT_PRESET = "atlanta";
