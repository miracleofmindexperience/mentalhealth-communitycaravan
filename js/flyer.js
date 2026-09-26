/*
 * Draws the flyer onto a canvas. The flyer is built top to bottom from
 * sections (header, tagline + description, scene + date strip, route table,
 * route-instructions line, closing row, safety footer);
 * each section is its own function, so one can be changed, reordered or
 * removed without touching the others. Text comes from config.js.
 */
import { COLORS as C, FONTS, FLYER_TEXT as T, MOM_URL, LOGO_SRC, ROUTE_INFO } from "./config.js";
import { activeLocs, allLoops, rsvpValid, rsvpUrl } from "./state.js";
import { roundRect, spacedWidth, spacedText, wrapText, fitFont, drawQR } from "./lib/canvas.js";

const SERIF = FONTS.serif, SANS = FONTS.sans;

/* Layout sizes, in flyer pixels. */
const L = {
  width: 1080,
  margin: 64,
  bandHeight: 286,
  sceneHeight: 236,
  closingHeight: 104,
  bottomPad: 30
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
logo.src = LOGO_SRC;
const logoReady = logo.decode
  ? logo.decode().catch(() => {})
  : new Promise(r => { logo.onload = r; logo.onerror = r; });

/* ---------- sections ---------- */
function drawHeader(ctx) {
  const M = L.margin, W = L.width;
  ctx.fillStyle = C.forest;
  ctx.fillRect(0, 0, W, L.bandHeight);

  // badge pill
  ctx.font = "700 20px " + SANS;
  const pw = spacedWidth(ctx, T.badge, 3) + 36;
  ctx.fillStyle = C.accent; roundRect(ctx, M, 36, pw, 40, 20); ctx.fill();
  ctx.fillStyle = C.white; ctx.textBaseline = "middle";
  spacedText(ctx, T.badge, M + 18, 57, 3);
  ctx.textBaseline = "alphabetic";

  // title
  ctx.font = "700 84px " + SERIF;
  ctx.fillStyle = C.white; ctx.fillText(T.titleLine1, M - 2, 158);
  ctx.fillStyle = C.gold; ctx.fillText(T.titleLine2, M - 2, 240);

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

/* Landscape with cars, plus the navy date strip across its bottom. */
function drawScene(ctx, state, y) {
  const M = L.margin, CW = L.width - M * 2, H = L.sceneHeight;
  ctx.save(); roundRect(ctx, M, y, CW, H, 22); ctx.clip();
  ctx.fillStyle = "#EEF3E9"; ctx.fillRect(M, y, CW, H);

  ctx.save(); ctx.translate(0, y - 110);
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
  ctx.restore();

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

  const divider = () => {
    x += 20; ctx.fillStyle = C.divider; ctx.fillRect(x, mid - 20, 2, 40); x += 22;
  };
  [(state.date || "").trim(), (state.time || "").trim()].filter(Boolean).forEach(part => {
    ctx.fillStyle = C.cream; ctx.fillText(part, x, mid);
    x += ctx.measureText(part).width;
    divider();
  });

  const locs = activeLocs(state);
  const sub = T.routesSummary(locs.length, (state.area || "").trim(), allLoops(locs));
  const fs = fitFont(ctx, sub, "400", 26, SANS, M + CW - 28 - x, 16);
  ctx.font = "400 " + fs + "px " + SANS; ctx.fillStyle = C.subtle;
  ctx.fillText(sub, x, mid);
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

function layoutRoutes(ctx, locs, W) {
  const inner = W - RT.pad * 2;
  ctx.font = "700 18px " + SANS;
  const cities = locs.map(l => ((l.city || "").trim() || T.cityPlaceholder).toUpperCase());
  const cityW = Math.min(160, Math.max(90, ...cities.map(c => spacedWidth(ctx, c, 2))));
  const avail = inner - cityW - RT.connector - RT.gap * 2 - RT.icon * 2; // room for start + finish text
  const items = locs.map((l, i) => ({ city: cities[i], start: (l.spot || "").trim() || T.spotPlaceholder, finish: finishText(l), loop: l.type === "loop" }));

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
    return { ...it, startLines, finishLines, h: Math.max(startLines.length, finishLines.length) * lineH + RT.rowPad };
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

/* "Route instructions will be shared…" line under the route table. */
function drawRouteInfo(ctx, state, y) {
  const text = ROUTE_INFO[state.routeInfo].text;
  ctx.textBaseline = "middle";
  drawFlag(ctx, L.margin + 6, y + 17);
  fitFont(ctx, text, "700", 21, SANS, L.width - L.margin * 2 - 30, 15);
  ctx.fillStyle = C.navy; ctx.fillText(text, L.margin + 30, y + 17);
  ctx.textBaseline = "alphabetic";
}

/* Safety line across the bottom. Returns its height. */
function measureSafety(ctx) {
  ctx.font = "400 17px " + SANS;
  return 18 + wrapText(ctx, T.safety, L.width - L.margin * 2).length * 24;
}

function drawSafety(ctx, y) {
  const M = L.margin;
  ctx.fillStyle = C.cardBorder; ctx.fillRect(M, y, L.width - M * 2, 2);
  ctx.textBaseline = "top"; ctx.font = "400 17px " + SANS; ctx.fillStyle = C.body;
  wrapText(ctx, T.safety, L.width - M * 2).forEach((ln, i) => ctx.fillText(ln, M, y + 16 + i * 24));
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
  const routes = layoutRoutes(ctx, locs, CW);

  // vertical positions of each section
  const yIntro = L.bandHeight + 16;
  const yScene = yIntro + measureIntro(ctx) + 16;
  const yRoutes = yScene + L.sceneHeight + 14;
  const yRouteInfo = yRoutes + routes.total + 12;
  const yClosing = yRouteInfo + 34 + 18;
  const ySafety = yClosing + L.closingHeight + 22;
  const height = ySafety + measureSafety(ctx) + L.bottomPad;

  canvas.width = L.width; canvas.height = height;
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = C.cream; ctx.fillRect(0, 0, L.width, height);

  drawHeader(ctx);
  drawIntro(ctx, yIntro);
  drawScene(ctx, state, yScene);
  drawRoutes(ctx, routes, yRoutes);
  drawRouteInfo(ctx, state, yRouteInfo);
  drawClosing(ctx, state, yClosing);
  drawSafety(ctx, ySafety);
}
