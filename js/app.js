/* Wires the form, the live flyer preview, the message box and the buttons together. */
import { MAX_LOCATIONS, PRESETS, FONTS, DOWNLOAD_PREFIX } from "./config.js";
import { loadState, saveState, presetData, activePresetKey, activeLocs, rsvpValid } from "./state.js";
import { buildMessage } from "./message.js";
import { drawFlyer } from "./flyer.js";

const $ = id => document.getElementById(id);
const canvas = $("cv");
let state = loadState();

/* Simple text fields: input id -> state key. */
const FIELDS = { "f-date": "date", "f-time": "time", "f-note": "note", "f-area": "area", "f-rsvp": "rsvp" };

/* ---------- form ---------- */
function fillForm() {
  Object.entries(FIELDS).forEach(([id, key]) => { $(id).value = state[key] || ""; });
  renderLocs();
}

function renderLocs() {
  const box = $("locs");
  box.innerHTML = "";
  state.locs.forEach((l, i) => {
    const row = $("loc-template").content.firstElementChild.cloneNode(true);
    const [cityLabel, spotLabel] = row.querySelectorAll("label");
    const [c, s] = row.querySelectorAll("input");
    c.id = "loc-city-" + i; cityLabel.htmlFor = c.id;
    s.id = "loc-spot-" + i; spotLabel.htmlFor = s.id;
    c.value = l.city; s.value = l.spot;
    c.addEventListener("input", () => { state.locs[i].city = c.value; changed(); });
    s.addEventListener("input", () => { state.locs[i].spot = s.value; changed(); });
    const rm = row.querySelector("button");
    rm.setAttribute("aria-label", "Remove location " + (i + 1));
    rm.disabled = state.locs.length <= 1;
    rm.addEventListener("click", () => { state.locs.splice(i, 1); renderLocs(); changed(); });
    box.appendChild(row);
  });
  $("add-loc").disabled = state.locs.length >= MAX_LOCATIONS;
}

Object.entries(FIELDS).forEach(([id, key]) => {
  $(id).addEventListener("input", e => { state[key] = e.target.value; changed(); });
});

$("add-loc").addEventListener("click", () => {
  if (state.locs.length >= MAX_LOCATIONS) return;
  state.locs.push({ city: "", spot: "" });
  renderLocs(); changed();
  $("loc-city-" + (state.locs.length - 1))?.focus();
});

$("reset").addEventListener("click", () => { state = presetData(); fillForm(); changed(); });
$("form").addEventListener("submit", e => e.preventDefault());

/* ---------- updates ---------- */
let drawTimer = null;
function changed() {
  saveState(state);
  updateMessage();
  updateWarn();
  clearTimeout(drawTimer);
  drawTimer = setTimeout(render, 120);
}

async function render() {
  await drawFlyer(canvas, state);
  $("out").src = canvas.toDataURL("image/png");
}

function updateMessage() { $("msg").value = buildMessage(state); }

function updateWarn() {
  const w = $("rsvp-warn"), v = (state.rsvp || "").trim();
  if (!v) { w.textContent = "No form link yet. The flyer shows an empty RSVP box until you add one."; w.hidden = false; }
  else if (!rsvpValid(state)) { w.textContent = "This doesn't look like a full link. It should start with https://"; w.hidden = false; }
  else w.hidden = true;
}

/* ---------- copy ---------- */
$("copy").addEventListener("click", () => {
  const ta = $("msg"), st = $("copy-status");
  const fallback = () => { ta.focus(); ta.select(); st.textContent = "Text selected. Press Ctrl+C or ⌘C to copy."; };
  try { navigator.clipboard.writeText(ta.value).then(() => { st.textContent = "Copied."; }, fallback); }
  catch (e) { fallback(); }
});

/* ---------- download ---------- */
$("dl").addEventListener("click", async () => {
  const st = $("dl-status");
  await render();
  const slug = (activeLocs(state)[0]?.city || "city").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "city";
  canvas.toBlob(blob => {
    if (!blob) { st.textContent = "Couldn't create the image. Right-click or long-press the preview and choose Save image."; return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = DOWNLOAD_PREFIX + slug + ".png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    st.textContent = "Downloaded. On a phone, you can also long-press the preview to save it.";
  }, "image/png");
});

/* ---------- start ---------- */
$("reset").textContent = "Reset to the " + PRESETS[activePresetKey()].label + " example";
$("max-locs").textContent = MAX_LOCATIONS;
fillForm(); updateMessage(); updateWarn();
render();
Promise.all(FONTS.preload.map(f => document.fonts.load(f)))
  .catch(() => {})
  .then(() => document.fonts.ready)
  .then(render, render);
