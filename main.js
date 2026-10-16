// ---- Current year ----------------------------------------------------
document.querySelectorAll("[data-year]").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// ---- Theme toggle ----------------------------------------------------
// Follows the OS setting until the visitor picks one; the choice is remembered.
(function () {
  const root = document.documentElement;
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const current = () => root.dataset.theme || (dark.matches ? "dark" : "light");
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    const label = () => btn.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode");
    label();
    btn.addEventListener("click", function () {
      root.dataset.theme = current() === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
      label();
    });
    dark.addEventListener("change", label);
  });
})();

// ---- Scroll reveal -------------------------------------------------
(function () {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) { io.observe(el); });
})();

// ---- Case studies: reading progress under the header -------------------
(function () {
  const bar = document.querySelector(".read-bar");
  if (!bar) return;
  const update = function () {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--read", (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0).toFixed(2) + "%");
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// ---- Home: scroll story ------------------------------------------------
// Each .pin chapter gets --p (0→1) as its sticky stage scrolls past.
(function () {
  if (!document.body.classList.contains("story")) return;
  const root = document.documentElement;
  const pins = Array.from(document.querySelectorAll(".pin"));
  const rail = Array.from(document.querySelectorAll(".s-rail a"));
  const fill = document.querySelector(".s-rail__fill");
  const workPin = document.querySelector(".work-pin");
  const track = document.getElementById("track");
  const stacked = window.matchMedia("(max-width: 860px), (max-height: 560px)");
  const narrow = window.matchMedia("(max-width: 860px)");
  const still = () => root.classList.contains("no-motion");
  const clamp = (x) => Math.max(0, Math.min(1, x));

  // horizontal gallery: the pin is as tall as the distance the track travels
  function sizeWork() {
    if (!workPin || !track) return;
    if (still() || stacked.matches) { workPin.style.height = ""; track.style.removeProperty("--shift"); return; }
    const shift = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.setProperty("--shift", shift + "px");
    workPin.style.height = (window.innerHeight + shift) + "px";
  }

  function progress(pin) {
    const total = pin.offsetHeight - window.innerHeight;
    if (total <= 0) return 1;
    return clamp(-pin.getBoundingClientRect().top / total);
  }

  function frame() {
    const mid = window.innerHeight / 2;
    let here = 0;
    pins.forEach(function (pin, i) {
      const p = progress(pin);
      pin.style.setProperty("--p", p.toFixed(4));
      const steps = Number(pin.dataset.steps || 0);
      if (steps) {
        const el = pin.querySelector("[data-step]");
        const s = String(Math.min(steps - 1, Math.floor(p * steps * 0.999)));
        if (el && el.dataset.step !== s) el.dataset.step = s;
      }
      if (pin.getBoundingClientRect().top <= mid) here = i;
    });
    const p = progress(pins[here]);
    const frac = pins.length > 1 ? clamp((here + (here === pins.length - 1 ? 0 : p)) / (pins.length - 1)) : 0;
    if (fill) fill.style.width = narrow.matches ? (frac * 100).toFixed(2) + "%" : "calc((100% - 0.9rem) * " + frac.toFixed(4) + ")";
    rail.forEach(function (a, i) {
      a.classList.toggle("is-done", i < here);
      a.classList.toggle("is-here", i === here);
      if (i === here) a.setAttribute("aria-current", "step"); else a.removeAttribute("aria-current");
    });
  }
  const onScroll = frame;   // five pins: cheap enough to run on every scroll event

  // jump to where a chapter "lands" (e.g. the split panel already slid in)
  function land(id, smooth) {
    const pin = document.getElementById(id);
    if (!pin) return false;
    const total = Math.max(0, pin.offsetHeight - window.innerHeight);
    const y = pin.offsetTop + total * Number(still() ? 0 : (pin.dataset.land || 0));
    window.scrollTo({ top: y, behavior: smooth && !still() ? "smooth" : "auto" });
    return true;
  }
  document.addEventListener("click", function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (document.getElementById(id) && document.getElementById(id).classList.contains("pin")) {
      e.preventDefault();
      land(id, true);
      history.replaceState(null, "", id === "top" ? location.pathname : "#" + id);
    }
  });

  sizeWork();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { sizeWork(); onScroll(); });
  stacked.addEventListener("change", function () { sizeWork(); onScroll(); });
  window.addEventListener("load", function () {
    sizeWork();
    if (location.hash) land(location.hash.slice(1), false);
    frame();
  });
  frame();
})();

// ---- Home: taste × city blend (mini version of the Nearby prototype) ----
(function () {
  const input = document.getElementById("blend");
  const list = document.getElementById("blend-list");
  if (!input || !list) return;
  // taste = match to a listener who likes indie & electronic; city = Barcelona's local popularity
  const TRACKS = [
    { t: "Pulse Theory", a: "Kilowatt", tag: "Your taste", taste: 0.95, city: 0, art: ["#00b4d8", "#03045e"], e: "🔊" },
    { t: "Northern Lights", a: "Glass Harbour", tag: "Your taste", taste: 0.9, city: 0, art: ["#4d6a8a", "#1e2b3a"], e: "🌌" },
    { t: "Cala Nocturna", a: "Nit Elèctrica", tag: "Local", taste: 0.72, city: 0.97, art: ["#8a2be2", "#c724b1"], e: "🎧" },
    { t: "Ona Sintètica", a: "Rosa Vent", tag: "Local · small act", taste: 0.78, city: 0.55, art: ["#b0306b", "#4d0f2e"], e: "🌊" },
    { t: "Duende Digital", a: "Flama Roja", tag: "Local", taste: 0.5, city: 0.93, art: ["#e2725b", "#a13d2c"], e: "🎸" },
    { t: "Verano Infinito", a: "Lía Mar", tag: "Local", taste: 0.4, city: 1, art: ["#f2a541", "#c45b1d"], e: "☀️" }
  ];
  list.innerHTML = TRACKS.map(function (x, i) {
    return '<li style="--r:' + i + '"><span class="rk"></span><span class="art" style="background:linear-gradient(145deg,' + x.art[0] + "," + x.art[1] + ')">' + x.e +
      '</span><span class="t"><b>' + x.t + "</b><span>" + x.a + " · " + x.tag + "</span></span></li>";
  }).join("");
  const rows = Array.from(list.children);
  const q = document.getElementById("blend-q");
  function update() {
    const w = Number(input.value) / 100;
    const order = TRACKS.map(function (x, i) { return { i: i, s: (1 - w) * x.taste + w * x.city }; })
      .sort(function (a, b) { return b.s - a.s; });
    order.forEach(function (o, rank) {
      rows[o.i].style.setProperty("--r", rank);
      rows[o.i].querySelector(".rk").textContent = rank + 1;
    });
    if (q) q.innerHTML = "<b>" + Math.round((1 - w) * 100) + "%</b> your taste · <b>" + Math.round(w * 100) + "%</b> the city";
  }
  input.addEventListener("input", update);
  update();
})();
