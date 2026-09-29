/*
 * Draws the flyer onto a canvas. The flyer is built top to bottom from
 * sections (header, tagline + description, scene + date strip, route table
 * or loop cards, route-instructions line, closing row, safety footer);
 * each section is its own function, so one can be changed, reordered or
 * removed without touching the others. Text comes from config.js.
 */
import { COLORS as C, FONTS, FLYER_TEXT as T, MOM_URL, LOGO_SRC } from "./config.js";
import { activeLocs, allLoops, rsvpValid, rsvpUrl, stripText, stripWhen, locWhen, hasMultipleWhens, routeInfoText, meetupWithMaterials } from "./state.js";
import { roundRect, spacedWidth, spacedText, wrapText, fitFont, drawQR } from "./lib/canvas.js";

const SERIF = FONTS.serif, SANS = FONTS.sans;

/* Layout sizes, in flyer pixels. */
const L = {
  width: 1080,
  margin: 64,
  bandHeight: 286,
  sceneHeight: 236,
  closingHeight: 104,
  bottomPad: 22,
  cardGap: 16
};

/* ---------- illustration shapes (scene artwork) ---------- */
const P = s => new Path2D(s);
const HILLS = [
  ["#E2EADC", P("M0,120 C120,90 240,80 360,100 C500,124 600,70 760,60 C880,52 980,80 1080,96 L1080,232 L0,232 Z")],
  ["#CBDAC3", P("M0,168 C160,140 300,150 440,160 C600,172 720,130 880,132 C960,133 1030,146 1080,152 L1080,232 L0,232 Z")]
];
const FRONT = P("M0,206 C200,190 380,198 560,204 C760,210 920,196 1080,200 L1080,232 L0,232 Z");
const CAB = P("M24,20 L40,4 Q42,2 46,2 H84 Q88,2 90,4 L106,20 Z");
const WIN1 = P("M44,8 H62 V19 H33 Z"), WIN2 = P("M67,8 H84 L96,19 H67 Z");
const FLAG = P("M74,-30 L100,-23 L74,-15 Z");
const LOOP_ARC = P("M20,6 A14,14 0 1 1 7.9,13"), LOOP_HEAD = P("M3.5,14.5 L8.5,8.5 L12,15.5 Z");

const TREES = [[150, 132, 18], [178, 140, 13], [1002, 122, 20], [480, 146, 14]];
const TRUNKS = [[150, 148, 166], [178, 152, 166], [1002, 140, 160], [480, 158, 170]];
const CARS = [
  { x: 96, body: "#2F6B5E", win: "#E8EEF5", plate: C.white, hub: C.navy },
  { x: 336, body: C.gold, win: "#E8EEF5", plate: C.white, hub: C.navy },
  { x: 576, body: C.navy, win: "#E8EEF5", plate: C.white, hub: "#0F1628" },
  { x: 816, body: C.white, win: "#C9D3E2", plate: C.accent, hub: C.navy }
];

/* ---------- setup ---------- */
const logo = new Image();
// onload (not decode(), which pauses while the page is in a background tab)
const logoReady = new Promise(r => { logo.onload = r; logo.onerror = r; });
logo.src = LOGO_SRC;

/* ---------- sections ---------- */
function drawHeader(ctx) {
  const M = L.margin, W = L.width;
  ctx.fillStyle = C.forest;
  ctx.fillRect(0, 0, W, L.bandHeight);

  // badge pill (optional)
  if (T.badge) {
    const bs = T.badgeSize, sp = bs * 0.15, h = bs * 2, padX = bs * 0.9;
    ctx.font = "700 " + bs + "px " + SANS;
    const pw = spacedWidth(ctx, T.badge, sp) + padX * 2;
    ctx.fillStyle = C.accent; roundRect(ctx, M, 36, pw, h, h / 2); ctx.fill();
    ctx.fillStyle = C.white; ctx.textBaseline = "middle";
    spacedText(ctx, T.badge, M + padX, 36 + h / 2 + 1, sp);
    ctx.textBaseline = "alphabetic";
  }

  // title lines (shrunk if one is too wide for the space left of the app card)
  const maxW = W - M - 364 - M - 24;
  T.titleLines.forEach(l => {
    fitFont(ctx, l.text, "700", l.size, SERIF, maxW, 40);
    ctx.fillStyle = C[l.color]; ctx.fillText(l.text, M - 2, l.y);
  });

  // app card: logo + QR to the app
  const cx = W - M - 364, cy = 28;
  ctx.fillStyle = C.white; roundRect(ctx, cx, cy, 364, 230, 24); ctx.fill();
  ctx.fillStyle = C.logoTile; roundRect(ctx, cx + 16, cy + 16, 160, 160, 16); ctx.fill();
  drawContained(ctx, logo, cx + 16 + 14, cy + 16 + 14, 132, 132);
  drawQR(ctx, MOM_URL, cx + 188, cy + 16, 160);
  fitFont(ctx, T.appCaption, "700", 21, SANS, 336, 14);
  ctx.fillStyle = C.forest; ctx.textAlign = "center";
  ctx.fillText(T.appCaption, cx + 182, cy + 214);
  ctx.textAlign = "left";
}

/* Draws an image scaled to fit inside the box, centered, without distortion. */
function drawContained(ctx, img, x, y, w, h) {
  if (!img.naturalWidth) return;
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * k, ih = img.naturalHeight * k;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

/* Tagline plus the "what is a caravan" description. Returns its height. */
function measureIntro(ctx) {
  ctx.font = "400 22px " + SANS;
  return 44 + 8 + wrapText(ctx, T.description, L.width - L.margin * 2).length * 30;
}

function drawIntro(ctx, y) {
  ctx.textBaseline = "alphabetic";
  ctx.font = "italic 600 36px " + SERIF; ctx.fillStyle = C.navy;
  ctx.fillText(T.tagline, L.margin, y + 34);
  ctx.font = "400 22px " + SANS; ctx.fillStyle = C.body;
  wrapText(ctx, T.description, L.width - L.margin * 2)
    .forEach((line, i) => ctx.fillText(line, L.margin, y + 44 + 8 + 22 + i * 30));
}

function drawCar(ctx, { x, body, win, plate, hub }) {
  ctx.save(); ctx.translate(x, 186);
  ctx.strokeStyle = C.navy; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(74, 4); ctx.lineTo(74, -30); ctx.stroke();
  ctx.fillStyle = C.accent; ctx.fill(FLAG);
  ctx.fillStyle = body; ctx.fill(CAB);
  ctx.fillStyle = win; ctx.fill(WIN1); ctx.fill(WIN2);
  ctx.fillStyle = body; roundRect(ctx, 4, 18, 124, 26, 11); ctx.fill();
  ctx.fillStyle = plate; roundRect(ctx, 50, 24, 30, 12, 2); ctx.fill();
  [32, 100].forEach(cx => {
    ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(cx, 44, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.subtle; ctx.beginPath(); ctx.arc(cx, 44, 4, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

/* Sun, hills, trees, road and cars in scene coordinates (1080 wide; road
   from y 232 to 280). Shared by the flyer and the form header. */
function drawLandscape(ctx) {
  ctx.fillStyle = "#F2C98A"; ctx.beginPath(); ctx.arc(900, 140, 28, 0, Math.PI * 2); ctx.fill();
  HILLS.forEach(([c, p]) => { ctx.fillStyle = c; ctx.fill(p); });
  ctx.fillStyle = "#93AD88";
  TREES.forEach(([x, ty, r]) => { ctx.beginPath(); ctx.arc(x, ty, r, 0, Math.PI * 2); ctx.fill(); });
  ctx.strokeStyle = "#6E8C64"; ctx.lineWidth = 3; ctx.lineCap = "round";
  TRUNKS.forEach(([x, a, b]) => { ctx.beginPath(); ctx.moveTo(x, a); ctx.lineTo(x, b); ctx.stroke(); });
  ctx.fillStyle = "#AFC4A5"; ctx.fill(FRONT);
  ctx.fillStyle = C.navy; ctx.fillRect(0, 232, L.width, 48);
  ctx.strokeStyle = "rgba(246,241,231,0.7)"; ctx.setLineDash([22, 18]);
  ctx.beginPath(); ctx.moveTo(0, 258); ctx.lineTo(L.width, 258); ctx.stroke(); ctx.setLineDash([]);
  CARS.forEach(car => drawCar(ctx, car));
}

/* Landscape with cars, plus the navy date strip across its bottom. */
function drawScene(ctx, state, y) {
  const M = L.margin, CW = L.width - M * 2, H = L.sceneHeight;
  ctx.save(); roundRect(ctx, M, y, CW, H, 22); ctx.clip();
  ctx.fillStyle = "#EEF3E9"; ctx.fillRect(M, y, CW, H);
  ctx.save(); ctx.translate(0, y - 110); drawLandscape(ctx); ctx.restore();

  drawDateStrip(ctx, state, y + 170, H - 170); // still inside the rounded clip
  ctx.restore();
}

function drawDateStrip(ctx, state, y, h) {
  const M = L.margin, CW = L.width - M * 2;
  ctx.fillStyle = C.navy; ctx.fillRect(M, y, CW, h);
  const mid = y + 4 + 24;
  let x = M + 28;
  ctx.textBaseline = "middle";
  ctx.font = "700 36px " + SERIF;

  // date | time | strip text, with a divider between whichever are present
  const when = stripWhen(state);
  const parts = [when.date, when.time].filter(Boolean);
  const sub = stripText(state);
  let first = true;
  const divider = () => {
    if (first) { first = false; return; }
    x += 20; ctx.fillStyle = C.divider; ctx.fillRect(x, mid - 20, 2, 40); x += 22;
  };
  parts.forEach(part => {
    divider();
    fitFont(ctx, part, "700", 36, SERIF, CW * 0.6, 22); // long date lists shrink
    ctx.fillStyle = C.cream; ctx.fillText(part, x, mid);
    x += ctx.measureText(part).width;
  });

  if (sub) {
    divider();
    const fs = fitFont(ctx, sub, "400", 26, SANS, M + CW - 28 - x, 16);
    ctx.font = "400 " + fs + "px " + SANS; ctx.fillStyle = C.subtle;
    ctx.fillText(sub, x, mid);
  }
}

/*
 * Route table: one row per location with the city, start spot, a dashed
 * connector with a car, and the finish (a place, "back to start" for loops,
 * or "shared with route instructions" when left blank).
 */
const RT = { pad: 28, gap: 18, connector: 96, icon: 30, header: 38, rowPad: 22, maxFont: 22, minFont: 17 };

function finishText(l) {
  if (l.type === "loop") return { text: T.loopFinish, muted: true };
  const end = (l.end || "").trim();
  return end ? { text: end, muted: false } : { text: T.finishLater, muted: true };
}

/* whens: each location's { date, time } when they differ, otherwise null. */
function layoutRoutes(ctx, locs, W, whens) {
  const inner = W - RT.pad * 2;
  ctx.font = "700 18px " + SANS;
  const cities = locs.map(l => ((l.city || "").trim() || T.cityPlaceholder).toUpperCase());
  const cityW = Math.min(160, Math.max(90, ...cities.map(c => spacedWidth(ctx, c, 2))));
  const avail = inner - cityW - RT.connector - RT.gap * 2 - RT.icon * 2; // room for start + finish text
  const items = locs.map((l, i) => ({ city: cities[i], start: (l.spot || "").trim() || T.spotPlaceholder, finish: finishText(l), loop: l.type === "loop", when: whens && whens[i] }));

  // One font size for the whole table: the largest where the longest start and
  // longest finish fit side by side on one line. Below the minimum, text wraps.
  let size = RT.maxFont, startW, finishW;
  const widest = key => Math.max(...items.map(it => ctx.measureText(key === "start" ? it.start : it.finish.text).width));
  for (;;) {
    ctx.font = "700 " + size + "px " + SANS;
    startW = widest("start"); finishW = widest("finish");
    if (startW + finishW <= avail || size <= RT.minFont) break;
    size--;
  }
  let startTextW;
  if (startW + finishW <= avail) startTextW = startW + (avail - startW - finishW) / 2; // share the slack
  else startTextW = Math.min(startW, Math.max(avail / 2, avail - finishW)); // wrap the longer side
  const finishTextW = avail - startTextW;
  const colW = startTextW + RT.icon;

  const lineH = size + 7;
  const rows = items.map(it => {
    const startLines = wrapText(ctx, it.start, startTextW), finishLines = wrapText(ctx, it.finish.text, finishTextW);
    const textH = Math.max(startLines.length, finishLines.length) * lineH;
    const cityH = it.when ? lineH + 40 : 0; // city plus its date and time lines
    return { ...it, startLines, finishLines, h: Math.max(textH, cityH) + RT.rowPad };
  });
  const cols = { city: RT.pad, start: RT.pad + cityW + RT.gap };
  cols.connector = cols.start + colW;
  cols.finish = cols.connector + RT.connector + RT.gap;
  const total = RT.pad - 8 + RT.header + rows.reduce((a, r) => a + r.h, 0) + RT.pad - 14;
  return { rows, cols, cityW, size, lineH, total };
}

function drawMiniCar(ctx, cx, cy) {
  ctx.fillStyle = C.accent;
  ctx.beginPath(); ctx.moveTo(cx - 10, cy - 4); ctx.lineTo(cx - 6, cy - 11); ctx.lineTo(cx + 6, cy - 11); ctx.lineTo(cx + 10, cy - 4); ctx.closePath(); ctx.fill();
  roundRect(ctx, cx - 17, cy - 5, 34, 11, 4); ctx.fill();
  ctx.fillStyle = C.navy;
  [-9, 9].forEach(dx => { ctx.beginPath(); ctx.arc(cx + dx, cy + 6, 3.5, 0, Math.PI * 2); ctx.fill(); });
}

function drawFlag(ctx, x, cy) {
  ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, cy - 9); ctx.lineTo(x, cy + 10); ctx.stroke();
  ctx.fillStyle = C.accent;
  ctx.beginPath(); ctx.moveTo(x, cy - 10); ctx.lineTo(x + 13, cy - 5); ctx.lineTo(x, cy); ctx.closePath(); ctx.fill();
}

function drawStartDot(ctx, x, cy) {
  ctx.strokeStyle = C.navy; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x + 7, cy, 6.5, 0, Math.PI * 2); ctx.stroke();
}

function drawRoutes(ctx, layout, y) {
  const M = L.margin, W = L.width - M * 2, { rows, cols, size, lineH } = layout;
  ctx.fillStyle = C.white; roundRect(ctx, M, y, W, layout.total, 18); ctx.fill();
  ctx.strokeStyle = C.cardBorder; ctx.lineWidth = 2; roundRect(ctx, M + 1, y + 1, W - 2, layout.total - 2, 17); ctx.stroke();

  // column headers
  ctx.textBaseline = "middle"; ctx.font = "700 14px " + SANS; ctx.fillStyle = C.muted;
  const yh = y + RT.pad - 8 + 12;
  spacedText(ctx, T.startHeader, M + cols.start, yh, 2);
  spacedText(ctx, T.finishHeader, M + cols.finish, yh, 2);

  let ry = y + RT.pad - 8 + RT.header;
  rows.forEach(r => {
    const mid = ry + lineH / 2;
    // city
    ctx.textBaseline = "middle"; ctx.fillStyle = C.accent;
    let cfs = 18, sp = 2;
    ctx.font = "700 18px " + SANS;
    while (spacedWidth(ctx, r.city, sp) > layout.cityW && cfs > 11) { cfs--; sp = cfs < 15 ? 1 : 2; ctx.font = "700 " + cfs + "px " + SANS; }
    spacedText(ctx, r.city, M + cols.city, mid, sp);
    if (r.when) {
      ctx.textBaseline = "top"; ctx.fillStyle = C.body;
      [r.when.date, r.when.time].filter(Boolean).forEach((t, i) => {
        fitFont(ctx, t, "600", 15, SANS, layout.cityW, 11);
        ctx.fillText(t, M + cols.city, mid + lineH / 2 + 4 + i * 19);
      });
      ctx.textBaseline = "middle";
    }
    // start
    drawStartDot(ctx, M + cols.start, mid);
    ctx.font = "700 " + size + "px " + SANS; ctx.fillStyle = C.navy;
    r.startLines.forEach((ln, i) => ctx.fillText(ln, M + cols.start + RT.icon, mid + i * lineH));
    // connector
    const cx = M + cols.connector + RT.gap + RT.connector / 2 - RT.gap / 2;
    ctx.strokeStyle = C.dash; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(M + cols.connector + 6, mid); ctx.lineTo(cx - 24, mid);
    ctx.moveTo(cx + 24, mid); ctx.lineTo(M + cols.finish - 10, mid);
    ctx.stroke(); ctx.setLineDash([]);
    drawMiniCar(ctx, cx, mid);
    // finish
    if (r.loop) {
      ctx.save(); ctx.translate(M + cols.finish - 6, mid - 8); ctx.scale(0.8, 0.8);
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.stroke(LOOP_ARC);
      ctx.fillStyle = C.accent; ctx.fill(LOOP_HEAD); ctx.restore();
    } else {
      drawFlag(ctx, M + cols.finish + 3, mid);
    }
    ctx.font = (r.finish.muted ? "500 " : "700 ") + size + "px " + SANS;
    ctx.fillStyle = r.finish.muted ? C.muted : C.navy;
    r.finishLines.forEach((ln, i) => ctx.fillText(ln, M + cols.finish + RT.icon, mid + i * lineH));
    ry += r.h;
  });
  ctx.textBaseline = "alphabetic";
}

/*
 * Loop cards: used instead of the route table when every route is a loop.
 * 1 to 3 cards per row, 2×2 for four.
 */
function layoutCards(ctx, locs, W, whens) {
  const n = Math.max(locs.length, 1), cols = n === 4 ? 2 : Math.min(n, 3), gap = L.cardGap;
  const cw = (W - gap * (cols - 1)) / cols;
  const rows = [];
  ctx.font = "700 22px " + SANS;
  locs.forEach((l, i) => {
    const r = Math.floor(i / cols);
    rows[r] = rows[r] || [];
    const when = whens && [whens[i].date, whens[i].time].filter(Boolean).join(" · ");
    rows[r].push({ l, when, lines: wrapText(ctx, (l.spot || "").trim() || T.spotPlaceholder, cw - 40) });
  });
  const whenH = whens ? CARD_WHEN_H : 0;
  const heights = rows.map(row => 16 + 40 + 10 + Math.max(...row.map(c => c.lines.length)) * 27 + whenH + 8 + 20 + 18);
  return { cw, gap, rows, heights, total: heights.reduce((a, b) => a + b, 0) + gap * (rows.length - 1) };
}

const CARD_WHEN_H = 26; // date line on each card when locations differ

function drawLoopIcon(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = C.accent; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.stroke(LOOP_ARC);
  ctx.fillStyle = C.accent; ctx.fill(LOOP_HEAD);
  ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(20, 6, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(20, 6, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawRouteCard(ctx, card, x0, y, w, h) {
  ctx.fillStyle = C.white; roundRect(ctx, x0, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = C.cardBorder; ctx.lineWidth = 2; roundRect(ctx, x0 + 1, y + 1, w - 2, h - 2, 17); ctx.stroke();
  drawLoopIcon(ctx, x0 + 18, y + 16);

  ctx.textBaseline = "middle"; ctx.fillStyle = C.accent;
  const city = ((card.l.city || "").trim() || T.cityPlaceholder).toUpperCase();
  const cfs = fitFont(ctx, city, "700", 20, SANS, w - 18 - 50 - 18 - city.length * 2, 13);
  ctx.font = "700 " + cfs + "px " + SANS;
  spacedText(ctx, city, x0 + 68, y + 36, 2);

  ctx.textBaseline = "top"; ctx.font = "700 22px " + SANS; ctx.fillStyle = C.navy;
  card.lines.forEach((ln, i) => ctx.fillText(ln, x0 + 18, y + 66 + i * 27));
  let yFoot = y + 66 + card.lines.length * 27 + 8;
  if (card.when) {
    fitFont(ctx, card.when, "600", 17, SANS, w - 36, 12); ctx.fillStyle = C.body;
    ctx.fillText(card.when, x0 + 18, yFoot - 2);
    yFoot += CARD_WHEN_H;
  }

  let lf = 15; ctx.font = "700 15px " + SANS;
  while (spacedWidth(ctx, T.routeFooter, 1) > w - 36 && lf > 11) { lf--; ctx.font = "700 " + lf + "px " + SANS; }
  ctx.fillStyle = C.muted;
  spacedText(ctx, T.routeFooter, x0 + 18, yFoot, 1);
}

function drawRouteCards(ctx, layout, y) {
  layout.rows.forEach((row, ri) => {
    const h = layout.heights[ri];
    row.forEach((card, ci) => drawRouteCard(ctx, card, L.margin + ci * (layout.cw + layout.gap), y, layout.cw, h));
    y += h + layout.gap;
  });
}

/* "Route instructions will be shared…" line under the route table. */
function drawRouteInfo(ctx, text, y) {
  ctx.textBaseline = "middle";
  drawFlag(ctx, L.margin + 6, y + 14);
  fitFont(ctx, text, "700", 21, SANS, L.width - L.margin * 2 - 30, 15);
  ctx.fillStyle = C.navy; ctx.fillText(text, L.margin + 30, y + 14);
  ctx.textBaseline = "alphabetic";
}

/* Safety line across the bottom, with a shield icon. Returns its height. */
const SAFETY_INDENT = 28; // room for the icon
const SHIELD = P("M9,0 L18,3.5 V9 C18,14.5 14,18.5 9,20 C4,18.5 0,14.5 0,9 V3.5 Z");

function measureSafety(ctx) {
  ctx.font = "400 17px " + SANS;
  return 14 + wrapText(ctx, T.safety, L.width - L.margin * 2 - SAFETY_INDENT).length * 24;
}

function drawShield(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = C.forest; ctx.fill(SHIELD);
  ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(5, 10); ctx.lineTo(8, 13); ctx.lineTo(13, 7); ctx.stroke();
  ctx.restore();
}

function drawSafety(ctx, y) {
  const M = L.margin;
  ctx.fillStyle = C.cardBorder; ctx.fillRect(M, y, L.width - M * 2, 2);
  drawShield(ctx, M, y + 12);
  ctx.textBaseline = "top"; ctx.font = "400 17px " + SANS; ctx.fillStyle = C.body;
  wrapText(ctx, T.safety, L.width - M * 2 - SAFETY_INDENT)
    .forEach((ln, i) => ctx.fillText(ln, M + SAFETY_INDENT, y + 12 + i * 24));
  ctx.textBaseline = "alphabetic";
}

/* "Open to all" text on the left, RSVP label + QR on the right. */
function drawClosing(ctx, state, y) {
  const M = L.margin, size = L.closingHeight, valid = rsvpValid(state);
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = "700 26px " + SANS; ctx.fillStyle = C.navy; ctx.fillText(T.closingHeadline, M, y + 36);
  ctx.font = "400 22px " + SANS; ctx.fillStyle = C.body; ctx.fillText(T.closingSub, M, y + 70);

  const qx = L.width - M - size;
  ctx.fillStyle = C.white; roundRect(ctx, qx, y, size, size, 10); ctx.fill();
  if (valid) {
    drawQR(ctx, rsvpUrl(state), qx + 7, y + 7, size - 14);
  } else {
    ctx.font = "700 13px " + SANS; ctx.fillStyle = C.muted; ctx.textAlign = "center";
    T.rsvpEmpty.forEach((line, i) => ctx.fillText(line, qx + size / 2, y + 44 + i * 18));
    ctx.textAlign = "left";
  }
  ctx.strokeStyle = C.accent; ctx.lineWidth = 3;
  if (!valid) ctx.setLineDash([8, 6]);
  roundRect(ctx, qx + 1.5, y + 1.5, size - 3, size - 3, 9); ctx.stroke(); ctx.setLineDash([]);

  ctx.textAlign = "right";
  ctx.font = "700 36px " + SERIF; ctx.fillStyle = C.accent; ctx.fillText(T.rsvpTitle, qx - 16, y + 40);
  ctx.font = "400 17px " + SANS; ctx.fillStyle = C.body; ctx.fillText(T.rsvpSub, qx - 16, y + 72);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

/* ---------- main ---------- */
export async function drawFlyer(canvas, state) {
  await logoReady;
  const ctx = canvas.getContext("2d");
  const M = L.margin, CW = L.width - M * 2;
  const locs = activeLocs(state).length ? activeLocs(state) : [{ city: "", spot: "" }];
  // All loops: loop cards. Any start → finish route: the route table.
  const loopsOnly = allLoops(locs);
  // When locations are on different dates, each route shows its own date and time.
  const whens = hasMultipleWhens(state) ? locs.map(l => locWhen(state, l)) : null;
  const routes = loopsOnly ? layoutCards(ctx, locs, CW, whens) : layoutRoutes(ctx, locs, CW, whens);
  const info = meetupWithMaterials(state) ? T.meetupAndMaterials : routeInfoText(state); // "" = no line

  // vertical positions of each section
  const yIntro = L.bandHeight + 16;
  const yScene = yIntro + measureIntro(ctx) + 16;
  const yRoutes = yScene + L.sceneHeight + 14;
  const yRouteInfo = yRoutes + routes.total + 12;
  const yClosing = yRouteInfo + (info ? 28 + 4 : 0);
  const ySafety = yClosing + L.closingHeight + 14;
  const height = ySafety + measureSafety(ctx) + L.bottomPad;

  canvas.width = L.width; canvas.height = height;
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = C.cream; ctx.fillRect(0, 0, L.width, height);

  drawHeader(ctx);
  drawIntro(ctx, yIntro);
  drawScene(ctx, state, yScene);
  if (loopsOnly) drawRouteCards(ctx, routes, yRoutes);
  else drawRoutes(ctx, routes, yRoutes);
  if (info) drawRouteInfo(ctx, info, yRouteInfo);
  drawClosing(ctx, state, yClosing);
  drawSafety(ctx, ySafety);
}

/*
 * Google Form header: a 1600x400 banner (the 4:1 shape Forms uses) with the
 * flyer's title band on top and the landscape with cars along the bottom.
 * Kept generic (no date or places) so any city can use it.
 */
export const BANNER = { width: 1600, height: 400, sceneTop: 150 }; // sceneTop: scene y where the crop starts

export async function drawBanner(canvas) {
  await logoReady;
  const ctx = canvas.getContext("2d");
  const W = BANNER.width, H = BANNER.height, M = 64;
  const scale = W / L.width;                                // landscape stretched to full width
  const sceneH = (280 - BANNER.sceneTop) * scale;           // visible part of the landscape
  const bandH = H - sceneH;
  canvas.width = W; canvas.height = H;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  // landscape along the bottom
  ctx.fillStyle = "#EEF3E9"; ctx.fillRect(0, bandH, W, sceneH);
  ctx.save(); ctx.beginPath(); ctx.rect(0, bandH, W, sceneH); ctx.clip();
  ctx.translate(0, bandH); ctx.scale(scale, scale); ctx.translate(0, -BANNER.sceneTop);
  drawLandscape(ctx);
  ctx.restore();

  // title band
  ctx.fillStyle = C.forest; ctx.fillRect(0, 0, W, bandH);
  const tile = bandH - 40;
  if (T.badge) {
    ctx.font = "700 18px " + SANS;
    const pw = spacedWidth(ctx, T.badge, 3) + 32;
    ctx.fillStyle = C.accent; roundRect(ctx, M, 26, pw, 34, 17); ctx.fill();
    ctx.fillStyle = C.white; ctx.textBaseline = "middle";
    spacedText(ctx, T.badge, M + 16, 44, 3);
    ctx.textBaseline = "alphabetic";
  }
  // the title lines on one line, each in its own color, shrunk to fit
  const titleY = T.badge ? 128 : 112, maxW = W - M - tile - M - 40;
  const words = T.titleLines.map(l => l.text);
  let size = 72;
  const width = () => { ctx.font = "700 " + size + "px " + SERIF; return ctx.measureText(words.join(" ")).width; };
  while (width() > maxW && size > 36) size--;
  let x = M - 2;
  T.titleLines.forEach((l, i) => {
    const t = (i ? " " : "") + l.text;
    ctx.fillStyle = C[l.color]; ctx.fillText(t, x, titleY); x += ctx.measureText(t).width;
  });
  ctx.font = "italic 600 30px " + SERIF; ctx.fillStyle = C.cream;
  ctx.fillText(T.tagline, M, titleY + 44);

  // Miracle of Mind logo tile, top right
  ctx.fillStyle = C.logoTile; roundRect(ctx, W - M - tile, 20, tile, tile, 16); ctx.fill();
  drawContained(ctx, logo, W - M - tile + 12, 32, tile - 24, tile - 24);
}
