/* Wires the two sections together: the flyer form and preview, then the
   WhatsApp message (built from the flyer inputs plus message-only fields). */
import { MAX_LOCATIONS, PRESETS, FONTS, DOWNLOAD_PREFIX, ROUTE_INFO, ROUTE_TYPES, NEW_LOCATION_TYPE, RSVP_TYPES } from "./config.js";
import { loadState, saveState, presetData, activePresetKey, activeLocs, rsvpValid, rsvpPhone, rsvpPhoneValid, rsvpEmail, rsvpEmailValid, autoStripText, newLoc } from "./state.js";
import { buildMessage } from "./message.js";
import { drawFlyer, drawBanner } from "./flyer.js";

const $ = id => document.getElementById(id);
const canvas = $("cv");
let state = loadState();

/* Simple fields: input id -> state key. */
const FIELDS = {
  // flyer
  "f-date": "date", "f-time": "time", "f-area": "area",
  "f-rsvp-type": "rsvpType", "f-rsvp": "rsvp", "f-rsvp-phone": "rsvpPhone", "f-rsvp-email": "rsvpEmail",
  "f-route-info": "routeInfo", "f-route-info-text": "routeInfoText",
  // message only
  "f-note": "note", "f-materials": "materials", "f-contact": "contact"
};

function fillOptions(select, options) {
  select.innerHTML = "";
  Object.entries(options).forEach(([value, label]) => select.add(new Option(label, value)));
}

/* ---------- form ---------- */
function fillForm() {
  Object.entries(FIELDS).forEach(([id, key]) => { $(id).value = state[key] || ""; });
  renderLocs();
  updateStrip();
  updateRouteInfo();
  updateRsvpType();
}

/* Shows the field for the chosen RSVP type, and the form header only for a form. */
function updateRsvpType() {
  const t = state.rsvpType;
  $("rsvp-form-wrap").hidden = t !== "form";
  $("rsvp-phone-wrap").hidden = t !== "phone";
  $("rsvp-email-wrap").hidden = t !== "email";
  $("banner-frame").hidden = t !== "form";
}

function updateRouteInfo() {
  $("route-info-text-wrap").hidden = state.routeInfo !== "custom";
}

/* Strip text: shows the automatic text (kept in sync with the routes) until
   the coordinator types their own. */
function updateStrip() {
  const auto = state.strip === null;
  if (auto) $("f-strip").value = autoStripText(state);
  $("strip-auto").hidden = auto;
}
$("f-strip").addEventListener("input", e => { state.strip = e.target.value; changed(); });
$("strip-auto").addEventListener("click", () => { state.strip = null; changed(); });

function renderLocs() {
  const box = $("locs");
  box.innerHTML = "";
  state.locs.forEach((l, i) => {
    const row = $("loc-template").content.firstElementChild.cloneNode(true);
    row.dataset.type = l.type;
    row.dataset.own = l.ownWhen;
    fillOptions(row.querySelector("select"), ROUTE_TYPES);
    row.querySelectorAll("[data-field]").forEach(el => {
      const key = el.dataset.field, box = el.type === "checkbox";
      el.id = "loc-" + key + "-" + i;
      el.closest("label").htmlFor = el.id;
      if (box) el.checked = l[key]; else el.value = l[key];
      el.addEventListener(el.tagName === "SELECT" || box ? "change" : "input", () => {
        state.locs[i][key] = box ? el.checked : el.value;
        if (key === "type") row.dataset.type = el.value;
        if (key === "ownWhen") {
          row.dataset.own = el.checked;
          // start from the main date/time so there's something to edit
          if (el.checked && !l.date && !l.time) { l.date = state.date; l.time = state.time; renderLocs(); }
        }
        if (key === "city") updateAddressLabels();
        changed();
      });
    });
    const rm = row.querySelector("button");
    rm.setAttribute("aria-label", "Remove location " + (i + 1));
    rm.disabled = state.locs.length <= 1;
    rm.addEventListener("click", () => { state.locs.splice(i, 1); renderLocs(); changed(); });
    box.appendChild(row);
  });
  $("add-loc").disabled = state.locs.length >= MAX_LOCATIONS;
  renderAddresses();
}

/* Message section: one address field per location. */
function renderAddresses() {
  const box = $("addresses");
  box.innerHTML = "";
  state.locs.forEach((l, i) => {
    const label = $("address-template").content.firstElementChild.cloneNode(true);
    const input = label.querySelector("input");
    input.id = "loc-address-" + i; label.htmlFor = input.id;
    input.value = l.address;
    input.addEventListener("input", () => { state.locs[i].address = input.value; changed(); });
    box.appendChild(label);
  });
  updateAddressLabels();
}

function updateAddressLabels() {
  $("addresses").querySelectorAll("label").forEach((label, i) => {
    const city = state.locs[i].city.trim();
    label.firstChild.textContent = (city ? city + " address" : "Location " + (i + 1) + " address");
  });
}

Object.entries(FIELDS).forEach(([id, key]) => {
  $(id).addEventListener("input", e => { state[key] = e.target.value; changed(); });
});

$("add-loc").addEventListener("click", () => {
  if (state.locs.length >= MAX_LOCATIONS) return;
  state.locs.push(newLoc({ type: NEW_LOCATION_TYPE }));
  renderLocs(); changed();
  $("loc-city-" + (state.locs.length - 1))?.focus();
});

$("reset").addEventListener("click", () => { state = presetData(); fillForm(); changed(); });
["flyer-form", "msg-form"].forEach(id => $(id).addEventListener("submit", e => e.preventDefault()));

/* ---------- updates ---------- */
let drawTimer = null;
function changed() {
  saveState(state);
  updateStrip();
  updateRouteInfo();
  updateRsvpType();
  updateMessage();
  updateWarn();
  clearTimeout(drawTimer);
  drawTimer = setTimeout(render, 120);
}

async function render() {
  await drawFlyer(canvas, state);
  $("out").src = canvas.toDataURL("image/png");
}

/* The message follows the form until it's edited by hand. */
function updateMessage() {
  const auto = state.message === null;
  const text = auto ? buildMessage(state) : state.message;
  if ($("msg").value !== text) $("msg").value = text; // don't reset the cursor while typing
  $("msg-edited").hidden = auto;
}
$("msg").addEventListener("input", e => { state.message = e.target.value; changed(); });
$("msg-rebuild").addEventListener("click", () => { state.message = null; changed(); });

function updateWarn() {
  const w = $("rsvp-warn"), v = (state.rsvp || "").trim();
  if (state.rsvpType === "phone") {
    if (!rsvpPhone(state)) { w.textContent = "No phone number yet. The flyer shows an empty RSVP box until you add one."; w.hidden = false; }
    else if (!rsvpPhoneValid(state)) { w.textContent = "This doesn't look like a phone number. Include the area code, e.g. 404-555-0123"; w.hidden = false; }
    else w.hidden = true;
    return;
  }
  if (state.rsvpType === "email") {
    if (!rsvpEmail(state)) { w.textContent = "No email address yet. The flyer shows an empty RSVP box until you add one."; w.hidden = false; }
    else if (!rsvpEmailValid(state)) { w.textContent = "This doesn't look like an email address, e.g. name@example.org"; w.hidden = false; }
    else w.hidden = true;
    return;
  }
  if (!v) { w.textContent = "No form link yet. The flyer shows an empty RSVP box until you add one."; w.hidden = false; }
  else if (!rsvpValid(state)) { w.textContent = "This doesn't look like a link. Paste the form link, e.g. forms.gle/abc123"; w.hidden = false; }
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
function downloadCanvas(cv, filename, st) {
  cv.toBlob(blob => {
    if (!blob) { st.textContent = "Couldn't create the image. Right-click or long-press the preview and choose Save image."; return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    st.textContent = "Downloaded. On a phone, you can also long-press the preview to save it.";
  }, "image/png");
}

$("dl").addEventListener("click", async () => {
  await render();
  const slug = (activeLocs(state)[0]?.city || "city").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "city";
  downloadCanvas(canvas, DOWNLOAD_PREFIX + slug + ".png", $("dl-status"));
});

/* Form header: the same for every city, so it's drawn once (after fonts load). */
const bannerCanvas = document.createElement("canvas");
async function renderBanner() {
  await drawBanner(bannerCanvas);
  $("banner-out").src = bannerCanvas.toDataURL("image/png");
}
$("dl-banner").addEventListener("click", async () => {
  await renderBanner();
  downloadCanvas(bannerCanvas, "caravan-form-header.png", $("banner-status"));
});

/* ---------- start ---------- */
$("reset").textContent = "Reset to the " + PRESETS[activePresetKey()].label + " example";
$("max-locs").textContent = MAX_LOCATIONS;
fillOptions($("f-rsvp-type"), RSVP_TYPES);
fillOptions($("f-route-info"), Object.fromEntries(Object.entries(ROUTE_INFO).map(([k, v]) => [k, v.label])));
fillForm(); updateMessage(); updateWarn();
render();
Promise.all(FONTS.preload.map(f => document.fonts.load(f)))
  .catch(() => {})
  .then(() => document.fonts.ready)
  .then(() => { render(); renderBanner(); }, () => { render(); renderBanner(); });
