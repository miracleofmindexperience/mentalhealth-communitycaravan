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
  /* Title in the green band: an optional orange badge ("" = none) and the
     title lines (size in px, y = baseline, color: "white" or "gold"). */
  badge: "",
  badgeSize: 20,           // badge text size in px (the pill grows with it)
  titleLines: [
    { text: "World Mental", size: 66, y: 104, color: "white" },
    { text: "Health Day", size: 66, y: 176, color: "white" },
    { text: "Caravan", size: 88, y: 258, color: "gold" }
  ],
  appCaption: "Free 7-min meditation app · Scan",
  tagline: "Let’s drive the conversation.",
  description: "Join us for a silent group drive in our own cars to raise awareness about mental well-being and share Miracle of Mind, a free app. No honking, no speeches. Just quiet, visible support.",
  startHeader: "START",
  finishHeader: "FINISH",
  loopFinish: "Back to start",
  routeFooter: "START & FINISH · LOOP DRIVE",  // bottom of each loop card
  finishLater: "Shared with route instructions",
  cityPlaceholder: "City",
  spotPlaceholder: "Meeting spot",
  /* Route-instructions line when materials are also handed out at the meetup point. */
  meetupAndMaterials: "Route instructions and caravan materials will be provided at the meetup point.",
  safety: "Safety first: follow all traffic laws, drive at the pace of traffic, and no honking or sudden stops.",
  closingHeadline: "Open to all. Everyone’s welcome!",
  closingSub: "Bring your family, your friends and your car.",
  rsvpTitle: "RSVP",
  rsvpSub: "Scan to sign up",
  rsvpEmpty: ["Add form", "link"],
  rsvpPhoneSub: "Call or text",
  rsvpPhoneEmpty: "Add phone number",
  rsvpEmailSub: "Email",
  rsvpEmailEmpty: "Add email address",
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
  title: "🚗 *World Mental Health Day Caravan*",
  intro: "Join us for a silent group drive in our own cars to raise awareness about mental well-being & share *Miracle of Mind*, a free 7-minute meditation app. No honking, no speeches. Just quiet, visible support. 🧘",
  /* When every route is a loop, the header says so once and the lines skip loopSuffix. */
  locationsHeader: (n, allLoops) => "📍 *" + (n > 1 ? "Routes" : "Route") + (allLoops ? " (Loop, back to start)" : "") + ":*",
  loopSuffix: " (loop, back to start)",
  finishLater: "finish shared with route instructions",
  routeInfoIcon: "🧭 ",
  /* Safety points are joined on one line with the separator. */
  safetyLabel: "⚠️ *Safety guidelines:* ",
  safetyPoints: [
    "Follow all traffic rules.",
    "Drive at the pace of traffic, no honking or sudden stops."
  ],
  separator: " ",
  materialsIcon: "🚩 ",
  /* Replaces the route-instructions and materials lines when instructions are
     shared at the meetup point and the materials note hasn't been changed. */
  meetupAndMaterials: "🚩 Route instructions and caravan materials such as magnets and flags will be provided at the meetup point.",
  closing: "🙏 *Open to all. Bring family & friends!*",
  rsvpLabel: "✅ RSVP: ",
  rsvpMissing: "[GOOGLE FORM LINK]",
  rsvpPhoneLabel: "✅ RSVP: call or text ",
  rsvpPhoneMissing: "[PHONE NUMBER]",
  rsvpEmailLabel: "✅ RSVP: email ",
  rsvpEmailMissing: "[EMAIL ADDRESS]",
  contactLabel: "📩 Questions? Contact "
};

/* Starting text for the message's materials note. Coordinators can edit or clear it. */
export const DEFAULT_MATERIALS = "Caravan materials such as magnets and flags will be provided.";
/* Earlier default wordings: drafts still holding one are moved to the current default. */
export const OLD_DEFAULT_MATERIALS = ["Caravan materials such as magnets, stickers or flags will be provided."];

/* "When are route instructions shared?" choices. `text` is printed on the
   flyer and in the message. */
export const ROUTE_INFO = {
  meetup: { label: "At the meetup point", text: "Route instructions will be shared at the meetup point." },
  before: { label: "Before the event", text: "Route instructions will be shared before the event." },
  both: { label: "Before the event and at the meetup point", text: "Route instructions will be shared before the event and again at the meetup point." },
  custom: { label: "Other (type your own)", text: null } // uses the coordinator's wording
};
export const DEFAULT_ROUTE_INFO = "meetup";

/* How people RSVP: a Google Form (QR code on the flyer), or a phone number
   or email address for cities without a form. */
export const RSVP_TYPES = { form: "Google Form link (QR code)", phone: "Phone number (call or text)", email: "Email address" };
export const DEFAULT_RSVP_TYPE = "form";

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
      time: "12 to 1 PM",
      note: "right after Satsang",
      area: "metro Atlanta",
      rsvp: "https://forms.gle/MaXY43U9rMwD1NfK7",
      routeInfo: "meetup",
      contact: "",
      locs: [
        { city: "Cumming", spot: "Midway Park Community Building", type: "loop" },
        { city: "Atlanta", spot: "Sheraton Atlanta Perimeter North", type: "loop" },
        { city: "Duluth", spot: "W.P. Jones Memorial Park", type: "loop" }
      ]
    }
  }
};

export const DEFAULT_PRESET = "atlanta";
