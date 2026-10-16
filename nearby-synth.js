// Nearby synth — the prototype's artists are fictional, so each track plays a
// short sketch generated in the browser (Web Audio), styled after its genre.
// Usage: NearbySynth.play(track, onEnd) · NearbySynth.stop() · NearbySynth.progress()
(function () {
  const SNIPPET = 20; // seconds

  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10],
    phrygdom: [0, 1, 4, 5, 7, 8, 10], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10]
  };

  // 16-step patterns: x = hit, o = soft hit, f = fifth (bass), . = rest
  const PRESETS = {
    electronic: { bpm: 124, root: 57, scale: "minor", chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]],
      kick: "x...x...x...x...", clap: "....x.......x...", hat: "..x...x...x...x.",
      bass: { pat: "..x...x...x...x.", wave: "sawtooth" }, keys: { inst: "pad" }, lead: { inst: "arp", wave: "square" } },
    flamenco: { bpm: 108, root: 52, scale: "phrygdom", chords: [[5, 8, 12], [3, 7, 10], [1, 5, 8], [0, 4, 7]],
      clap: "x..x..x.x.x.x...",
      bass: { pat: "x.......x.......", wave: "triangle" }, keys: { inst: "strum", pat: "x..x..x.x.x..x.." },
      lead: { inst: "melody", pat: "..x.x..x.xx.x...", wave: "triangle", pluck: true } },
    indie: { bpm: 118, root: 50, scale: "penta", chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],
      kick: "x.......x.x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.",
      bass: { pat: "x.x.x.x.x.x.x.x.", wave: "sawtooth" }, keys: { inst: "strum", pat: "x.x.x.x.x.x.x.x.", soft: true },
      lead: { inst: "melody", pat: "x...x..x..x.x...", wave: "triangle" } },
    pop: { bpm: 104, root: 53, scale: "penta", chords: [[9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14]],
      kick: "x...x...x...x...", clap: "....x.......x...", hat: "..x...x...x...x.",
      bass: { pat: "x..x..x.x..x..x.", wave: "sawtooth" }, keys: { inst: "pad" },
      lead: { inst: "melody", pat: "x.x...x.x.x.....", wave: "square" } },
    country: { bpm: 100, root: 55, scale: "penta", chords: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]],
      kick: "x.......x.......", snare: "....o.......o...",
      bass: { pat: "x...f...x...f...", wave: "triangle" }, keys: { inst: "stab", pat: "..x...x...x...x." },
      lead: { inst: "melody", pat: "..x.x...x..x.x..", wave: "square", pluck: true } },
    americana: { bpm: 92, root: 50, scale: "penta", chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [0, 4, 7]],
      kick: "x.......x.......", snare: "....o.......o...",
      bass: { pat: "x...f...x...f...", wave: "triangle" }, keys: { inst: "strum", pat: "x...x.x.x...x.x.", soft: true },
      lead: { inst: "melody", pat: "x.....x...x.....", wave: "triangle", pluck: true } },
    bluegrass: { bpm: 140, root: 55, scale: "major", chords: [[0, 4, 7], [0, 4, 7], [5, 9, 12], [7, 11, 14]],
      snare: "..o...o...o...o.",
      bass: { pat: "x...f...x...f...", wave: "triangle" }, keys: { inst: "roll" } },
    folk: { bpm: 78, root: 52, scale: "major", chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],
      shaker: "..o...o...o...o.",
      bass: { pat: "x.......x.......", wave: "sine" }, keys: { inst: "fingerpick" },
      lead: { inst: "melody", pat: "x.......x...x...", wave: "triangle" } },
    citypop: { bpm: 108, root: 53, scale: "major", chords: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]],
      kick: "x.....x...x.....", snare: "....x.......x...", hat: "oooooooooooooooo",
      bass: { pat: "x..x.x..x.xx.x..", wave: "sawtooth" }, keys: { inst: "epiano", pat: "x.....x...x....." },
      lead: { inst: "melody", pat: "..x.x..xx...x.x.", wave: "square" } },
    jrock: { bpm: 150, root: 52, scale: "minpenta", chords: [[0, 7, 12], [8, 15, 20], [3, 10, 15], [10, 17, 22]],
      kick: "x.x...x.x.x...x.", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.",
      bass: { pat: "x.x.x.x.x.x.x.x.", wave: "sawtooth" }, keys: { inst: "power", pat: "x.x.x.x.x.x.x.x." },
      lead: { inst: "melody", pat: "x..x..x.x...x...", wave: "square" } },
    hiphop: { bpm: 88, root: 48, scale: "minpenta", swing: 0.18, chords: [[0, 3, 7, 10], [8, 12, 15], [5, 8, 12], [7, 10, 14]],
      kick: "x......x..x.....", snare: "....x.......x...", hat: "x.x.x.x.x.x.x.x.",
      bass: { pat: "x......x..x.....", wave: "sine", sub: true }, keys: { inst: "epiano", pat: "x.......x......." },
      lead: { inst: "melody", pat: "x.......x.x.....", wave: "triangle" } },
    afrobeats: { bpm: 104, root: 54, scale: "penta", chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],
      kick: "x.....x...x.....", clap: "....x.......x...", rim: "..x..x....x..x..", shaker: "oooooooooooooooo",
      bass: { pat: "x..x..x...x.x...", wave: "sine", sub: true }, keys: { inst: "stab", pat: "x.x..x.x.x..x.x.", high: true },
      lead: { inst: "melody", pat: "x...x.x...x.....", wave: "triangle" } },
    amapiano: { bpm: 112, root: 50, scale: "minor", chords: [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [7, 10, 14, 17]],
      kick: "x.......x.......", clap: "....o.......o...", shaker: "oooooooooooooooo",
      logdrum: "x..x...x..x.x...", keys: { inst: "epiano", pat: "x.....x.....x..." } },
    rnb: { bpm: 76, root: 51, scale: "major", swing: 0.12, chords: [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [5, 9, 12, 16]],
      kick: "x......x.x......", snare: "....x.......x...", hat: "o.o.o.o.o.o.o.o.",
      bass: { pat: "x......x.x......", wave: "sine", sub: true }, keys: { inst: "pad" },
      lead: { inst: "melody", pat: "x...x.x.....x...", wave: "triangle" } }
  };

  let ctx = null, master = null, noise = null, current = null;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.55;
    master.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // ---- instruments ---------------------------------------------------------
  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function osc(out, t, type, f, peak, attack, decay, filterHz) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    let node = o;
    if (filterHz) { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = filterHz; o.connect(lp); node = lp; }
    node.connect(g); g.connect(out); env(g, t, peak, attack, decay);
    o.start(t); o.stop(t + attack + decay + 0.05);
    return o;
  }
  function burst(out, t, type, hz, q, peak, decay) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = hz; f.Q.value = q;
    s.connect(f); f.connect(g); g.connect(out); env(g, t, peak, 0.002, decay);
    s.start(t, Math.random() * 0.5); s.stop(t + decay + 0.05);
  }
  const I = {
    kick(out, t, v) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
      o.connect(g); g.connect(out); env(g, t, 0.95 * v, 0.003, 0.34); o.start(t); o.stop(t + 0.4);
    },
    snare(out, t, v) { burst(out, t, "bandpass", 1900, 0.7, 0.45 * v, 0.17); osc(out, t, "triangle", 185, 0.25 * v, 0.002, 0.08); },
    clap(out, t, v) { [0, 0.011, 0.022].forEach((dt) => burst(out, t + dt, "bandpass", 1300, 1.2, 0.4 * v, 0.12)); },
    hat(out, t, v) { burst(out, t, "highpass", 8000, 0.6, 0.16 * v, 0.045); },
    shaker(out, t, v) { burst(out, t, "bandpass", 6500, 1.5, 0.14 * v, 0.06); },
    rim(out, t, v) { osc(out, t, "square", 1750, 0.12 * v, 0.001, 0.03, 3000); },
    logdrum(out, t, f, v) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
      const ws = ctx.createWaveShaper(); ws.curve = curve(2.5);
      o.connect(ws); ws.connect(g); g.connect(out); env(g, t, 0.7 * v, 0.004, 0.5); o.start(t); o.stop(t + 0.6);
    },
    bass(out, t, f, dur, wave, v) { osc(out, t, wave, f, 0.42 * v, 0.008, dur, wave === "sine" ? null : 520); },
    pluck(out, t, f, v, bright, decay) {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = f;
      lp.type = "lowpass"; lp.frequency.setValueAtTime(f * (bright || 6), t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.25);
      o.connect(lp); lp.connect(g); g.connect(out); env(g, t, 0.16 * v, 0.002, decay || 0.5);
      o.start(t); o.stop(t + (decay || 0.5) + 0.05);
    },
    pad(out, t, freqs, dur, v) {
      freqs.forEach((f) => [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = f; o.detune.value = cents;
        lp.type = "lowpass"; lp.frequency.value = 1100;
        o.connect(lp); lp.connect(g); g.connect(out);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035 * v, t + 0.35);
        g.gain.setValueAtTime(0.035 * v, t + dur - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.start(t); o.stop(t + dur + 0.05);
      }));
    },
    epiano(out, t, f, v, decay) { osc(out, t, "sine", f, 0.14 * v, 0.004, decay || 1.1); osc(out, t, "sine", f * 2, 0.04 * v, 0.002, 0.3); },
    power(out, t, freqs, dur, v) {
      freqs.forEach((f) => {
        const o = ctx.createOscillator(), ws = ctx.createWaveShaper(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = f; ws.curve = curve(8); lp.type = "lowpass"; lp.frequency.value = 2600;
        o.connect(ws); ws.connect(lp); lp.connect(g); g.connect(out); env(g, t, 0.07 * v, 0.004, dur);
        o.start(t); o.stop(t + dur + 0.05);
      });
    },
    lead(out, t, f, dur, wave, v) { osc(out, t, wave, f, 0.09 * v, 0.01, dur, 2400); }
  };
  function curve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / n) * 2 - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
    return c;
  }

  // ---- arrangement ---------------------------------------------------------
  function rng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }
  const hit = (pat, s) => (pat ? pat[s] : ".");

  function schedule(out, track, t0) {
    const genre = Object.entries(track.g).sort((a, b) => b[1] - a[1])[0][0];
    const P = PRESETS[genre] || PRESETS.pop;
    const rand = rng(track.id + track.title);
    const root = P.root + Math.floor(rand() * 5) - 2;
    const step = 60 / P.bpm / 4;
    const barLen = step * 16;
    const bars = Math.ceil(SNIPPET / barLen);
    const scale = SCALES[P.scale];
    const rot = Math.floor(rand() * P.chords.length);
    let melodyDeg = 2;

    for (let b = 0; b < bars; b++) {
      const chord = P.chords[(b + rot) % P.chords.length];
      const barT = t0 + b * barLen;
      if (P.keys && P.keys.inst === "pad") I.pad(out, barT, chord.map((n) => mtof(root + n)), barLen, 1);
      for (let s = 0; s < 16; s++) {
        let t = barT + s * step + (s % 2 ? (P.swing || 0) * step : 0);
        if (t - t0 > SNIPPET - 0.2) break;
        const v = (c) => (c === "o" ? 0.45 : 1);
        ["kick", "snare", "clap", "hat", "shaker", "rim"].forEach((d) => { const c = hit(P[d], s); if (c !== ".") I[d](out, t, v(c)); });
        if (P.logdrum && hit(P.logdrum, s) !== ".") I.logdrum(out, t, mtof(root - 12 + chord[s % 3 === 0 ? 0 : Math.min(1, chord.length - 1)]), 1);

        if (P.bass) {
          const c = hit(P.bass.pat, s);
          if (c !== ".") {
            const n = root - 12 + chord[0] + (c === "f" ? 7 : 0) - (P.bass.sub ? 12 : 0);
            I.bass(out, t, mtof(n), step * 1.7, P.bass.wave, 1);
          }
        }

        const K = P.keys || {};
        const tones = chord.map((n) => root + n);
        if (K.inst === "strum" && hit(K.pat, s) === "x") tones.forEach((m, i) => I.pluck(out, t + i * 0.014, mtof(m), K.soft ? 0.6 : 0.9, K.soft ? 4 : 8, 0.45));
        if (K.inst === "stab" && hit(K.pat, s) === "x") tones.forEach((m) => I.pluck(out, t, mtof(m + (K.high ? 12 : 0)), 0.7, 5, 0.18));
        if (K.inst === "epiano" && hit(K.pat, s) === "x") tones.forEach((m) => I.epiano(out, t, mtof(m), 0.9, 1.1));
        if (K.inst === "power" && hit(K.pat, s) === "x") I.power(out, t, tones.slice(0, 3).map(mtof), step * 1.6, 1);
        if (K.inst === "fingerpick" && s % 2 === 0) { const order = [0, 2, 1, 2]; I.pluck(out, t, mtof(tones[order[(s / 2) % 4] % tones.length] + (s % 8 === 0 ? 0 : 12)), 0.7, 3.5, 0.9); }
        if (K.inst === "roll") { const roll = [0, 1, 2, 1]; I.pluck(out, t, mtof(tones[roll[s % 4]] + 12 + (s % 8 >= 4 ? 12 : 0)), 0.65, 9, 0.22); }

        const L = P.lead;
        if (L && L.inst === "arp") I.lead(out, t, mtof(tones[s % tones.length] + 12), step * 0.9, L.wave, 0.55);
        if (L && L.inst === "melody" && hit(L.pat, s) === "x") {
          melodyDeg = Math.max(0, Math.min(scale.length * 2 - 1, melodyDeg + Math.floor(rand() * 5) - 2));
          const m = root + 12 + scale[melodyDeg % scale.length] + 12 * Math.floor(melodyDeg / scale.length);
          if (L.pluck) I.pluck(out, t, mtof(m), 0.8, 6, 0.4); else I.lead(out, t, mtof(m), step * 1.8, L.wave, 1);
        }
      }
    }
  }

  function stop() {
    if (!current) return;
    const { gain, timer } = current;
    clearTimeout(timer);
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.12);
    setTimeout(() => gain.disconnect(), 200);
    current = null;
  }

  function play(track, onEnd) {
    init();
    if (ctx.state === "suspended") ctx.resume();
    stop();
    const gain = ctx.createGain();
    gain.connect(master);
    const t0 = ctx.currentTime + 0.06;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(1, t0 + 0.08);
    gain.gain.setValueAtTime(1, t0 + SNIPPET - 1.5);
    gain.gain.linearRampToValueAtTime(0, t0 + SNIPPET);
    schedule(gain, track, t0);
    const id = track.id;
    current = { id, gain, t0, timer: setTimeout(() => { if (current && current.id === id) { current = null; if (onEnd) onEnd(); } }, (SNIPPET + 0.1) * 1000) };
  }

  window.NearbySynth = {
    play, stop, SNIPPET,
    playing: () => (current ? current.id : null),
    progress: () => (current && ctx ? Math.max(0, Math.min(1, (ctx.currentTime - current.t0) / SNIPPET)) : 0)
  };
})();
