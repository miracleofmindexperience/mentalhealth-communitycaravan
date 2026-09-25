/*
 * Draws the flyer onto a canvas. The flyer is built top to bottom from
 * sections (header, tagline, scene + date strip, route cards, closing row);
 * each section is its own function, so one can be changed, reordered or
 * removed without touching the others. Text comes from config.js.
 */
import { COLORS as C, FONTS, FLYER_TEXT as T, MOM_URL, LOGO_SRC } from "./config.js";
import { activeLocs, rsvpValid } from "./state.js";
import { roundRect, spacedWidth, spacedText, wrapText, fitFont, drawQR } from "./lib/canvas.js";

const SERIF = FONTS.serif, SANS = FONTS.sans;

/* Layout sizes, in flyer pixels. */
const L = {
  width: 1080,
  margin: 64,
  bandHeight: 286,
  sceneHeight: 236,
  closingHeight: 104,
  bottomPad: 36,
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
  ctx.save(); roundRect(ctx, cx + 16, cy + 16, 160, 160, 16); ctx.clip();
  ctx.drawImage(logo, cx + 16, cy + 16, 160, 160); ctx.restore();
  drawQR(ctx, MOM_URL, cx + 188, cy + 16, 160);
  fitFont(ctx, T.appCaption, "700", 21, SANS, 336, 14);
  ctx.fillStyle = C.forest; ctx.textAlign = "center";
  ctx.fillText(T.appCaption, cx + 182, cy + 214);
  ctx.textAlign = "left";
}

function drawTagline(ctx, y) {
  ctx.font = "italic 600 36px " + SERIF; ctx.fillStyle = C.navy;
  ctx.fillText(T.tagline, L.margin, y + 34);
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

  const sub = T.routesSummary(activeLocs(state).length, (state.area || "").trim());
  const fs = fitFont(ctx, sub, "400", 26, SANS, M + CW - 28 - x, 16);
  ctx.font = "400 " + fs + "px " + SANS; ctx.fillStyle = C.subtle;
  ctx.fillText(sub, x, mid);
}

/* Measures route cards: 1–3 per row, 2×2 for four. */
function layoutCards(ctx, locs, W) {
  const n = Math.max(locs.length, 1), cols = n === 4 ? 2 : Math.min(n, 3), gap = L.cardGap;
  const cw = (W - gap * (cols - 1)) / cols;
  const rows = [];
  ctx.font = "700 22px " + SANS;
  locs.forEach((l, i) => {
    const r = Math.floor(i / cols);
    rows[r] = rows[r] || [];
    rows[r].push({ l, lines: wrapText(ctx, (l.spot || "").trim() || T.spotPlaceholder, cw - 40) });
  });
  const heights = rows.map(row => 16 + 40 + 10 + Math.max(...row.map(c => c.lines.length)) * 27 + 8 + 20 + 18);
  return { cw, gap, rows, heights, total: heights.reduce((a, b) => a + b, 0) + gap * (rows.length - 1) };
}

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

  let lf = 15; ctx.font = "700 15px " + SANS;
  while (spacedWidth(ctx, T.routeFooter, 1) > w - 36 && lf > 11) { lf--; ctx.font = "700 " + lf + "px " + SANS; }
  ctx.fillStyle = C.muted;
  spacedText(ctx, T.routeFooter, x0 + 18, y + 66 + card.lines.length * 27 + 8, 1);
}

function drawRouteCards(ctx, layout, y) {
  layout.rows.forEach((row, ri) => {
    const h = layout.heights[ri];
    row.forEach((card, ci) => drawRouteCard(ctx, card, L.margin + ci * (layout.cw + layout.gap), y, layout.cw, h));
    y += h + layout.gap;
  });
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
    drawQR(ctx, state.rsvp.trim(), qx + 7, y + 7, size - 14);
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
  const cards = layoutCards(ctx, locs, CW);

  // vertical positions of each section
  const yTagline = L.bandHeight + 16;
  const yScene = yTagline + 44 + 14;
  const yCards = yScene + L.sceneHeight + 14;
  const yClosing = yCards + cards.total + 14;
  const height = yClosing + L.closingHeight + L.bottomPad;

  canvas.width = L.width; canvas.height = height;
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = C.cream; ctx.fillRect(0, 0, L.width, height);

  drawHeader(ctx);
  drawTagline(ctx, yTagline);
  drawScene(ctx, state, yScene);
  drawRouteCards(ctx, cards, yCards);
  drawClosing(ctx, state, yClosing);
}
