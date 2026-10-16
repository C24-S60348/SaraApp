// Small sound-effect synth (no audio files needed). Used by the games.
// SFX.play("pop", 3) plays a sound; SFX.bindButton(btn) makes a mute button.
const SFX = (() => {
  let ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem("saraapp-muted") === "1"; } catch (e) { /* ignore */ }

  function ac() {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ f = 440, to = null, t = 0.15, type = "sine", vol = 0.2, at = 0 }) {
    const c = ac(); if (!c || muted) return;
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + t);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + t + 0.03);
  }

  function noise({ t = 0.2, vol = 0.2, from = 3000, to = 400, at = 0 }) {
    const c = ac(); if (!c || muted) return;
    const t0 = c.currentTime + at, len = Math.floor(c.sampleRate * t);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const flt = c.createBiquadFilter(); flt.type = "bandpass"; flt.Q.value = 1.2;
    flt.frequency.setValueAtTime(from, t0); flt.frequency.exponentialRampToValueAtTime(to, t0 + t);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
    s.connect(flt); flt.connect(g); g.connect(master);
    s.start(t0);
  }

  const note = n => 261.63 * Math.pow(2, n / 12); // n semitones above middle C

  const lib = {
    click: () => tone({ f: 700, to: 900, t: 0.07, type: "triangle", vol: 0.15 }),
    swap: () => tone({ f: 320, to: 560, t: 0.1, type: "sine", vol: 0.18 }),
    nope: () => { tone({ f: 170, t: 0.12, type: "square", vol: 0.1 }); tone({ f: 130, t: 0.16, type: "square", vol: 0.1, at: 0.1 }); },
    pop: (n = 0) => {
      const f = note(7 + Math.min(n, 10) * 2);
      tone({ f, to: f * 1.6, t: 0.13, type: "sine", vol: 0.22 });
      tone({ f: f * 2, t: 0.08, type: "triangle", vol: 0.08, at: 0.02 });
      noise({ t: 0.08, vol: 0.08, from: 5000, to: 2000 });
    },
    combo: (n = 1) => [0, 4, 7, 12].forEach((s, i) => tone({ f: note(s + 12 + n), t: 0.14, type: "triangle", vol: 0.14, at: i * 0.055 })),
    shoot: () => { noise({ t: 0.12, vol: 0.12, from: 4500, to: 900 }); tone({ f: 620, to: 180, t: 0.12, type: "triangle", vol: 0.12 }); },
    thud: () => tone({ f: 190, to: 70, t: 0.11, type: "sine", vol: 0.28 }),
    swapColor: () => { tone({ f: 880, t: 0.05, type: "square", vol: 0.07 }); tone({ f: 1180, t: 0.06, type: "square", vol: 0.07, at: 0.05 }); },
    hit: () => { noise({ t: 0.25, vol: 0.28, from: 1800, to: 120 }); tone({ f: 240, to: 50, t: 0.28, type: "sawtooth", vol: 0.2 }); },
    whoosh: () => noise({ t: 0.7, vol: 0.2, from: 300, to: 4200 }),
    intro: () => { noise({ t: 0.8, vol: 0.18, from: 250, to: 4500 }); [0, 7, 12].forEach((s, i) => tone({ f: note(s), t: 0.5, type: "triangle", vol: 0.1, at: 0.5 + i * 0.02 })); },
    go: () => { tone({ f: note(12), t: 0.35, type: "square", vol: 0.1 }); tone({ f: note(19), t: 0.4, type: "triangle", vol: 0.15, at: 0.08 }); noise({ t: 0.3, vol: 0.12, from: 800, to: 6000 }); },
    rewind: () => { tone({ f: 900, to: 220, t: 0.45, type: "triangle", vol: 0.16 }); noise({ t: 0.45, vol: 0.1, from: 4200, to: 400 }); tone({ f: 660, t: 0.12, type: "sine", vol: 0.12, at: 0.45 }); },
    danger: () => tone({ f: 110, to: 90, t: 0.18, type: "sawtooth", vol: 0.16 }),
    win: () => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone({ f: note(s), t: 0.3, type: "triangle", vol: 0.16, at: i * 0.1 })),
    lose: () => [7, 4, 0, -5].forEach((s, i) => tone({ f: note(s), t: 0.4, type: "sawtooth", vol: 0.12, at: i * 0.2 }))
  };

  const api = {
    play(name, arg) { try { lib[name] && lib[name](arg); } catch (e) { /* audio blocked: ignore */ } },
    unlock: ac,
    isMuted: () => muted,
    toggle() {
      muted = !muted;
      try { localStorage.setItem("saraapp-muted", muted ? "1" : "0"); } catch (e) { /* ignore */ }
      return muted;
    },
    bindButton(btn) {
      const label = () => { btn.textContent = muted ? "Sound: Off" : "Sound: On"; };
      label();
      btn.addEventListener("click", () => { api.toggle(); label(); api.play("click"); });
    }
  };
  // browsers only allow audio after a tap / key press
  ["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, () => ac(), { once: true }));
  return api;
})();
