// Soft sound effects made in code (no audio files). Turn off in Settings.
const Sound = (() => {
  let ctx = null, master = null;
  const on = () => !Store.data || Store.data.settings.sound !== false;

  function ac() {
    if (!ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ctx = new A();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(f, { to = null, t = 0.18, type = "sine", vol = 0.12, at = 0 } = {}) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + t * 0.8);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + t + 0.05);
  }

  const lib = {
    tap: () => tone(880, { t: 0.06, type: "triangle", vol: 0.06 }),
    drop: () => { tone(520, { to: 1150, t: 0.16, vol: 0.14 }); tone(1300, { to: 900, t: 0.1, vol: 0.05, at: 0.1 }); },
    check: () => { tone(660, { t: 0.14, type: "triangle", vol: 0.09 }); tone(990, { t: 0.22, type: "sine", vol: 0.09, at: 0.08 }); },
    uncheck: () => tone(520, { to: 400, t: 0.12, type: "triangle", vol: 0.06 }),
    goal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { t: 0.4, type: "sine", vol: 0.1, at: i * 0.11 })),
    save: () => tone(740, { t: 0.1, type: "sine", vol: 0.06 }),
    remind: () => { tone(784, { t: 0.5, vol: 0.08 }); tone(1175, { t: 0.7, vol: 0.06, at: 0.25 }); },
    warn: () => { tone(440, { t: 0.2, type: "triangle", vol: 0.08 }); tone(370, { t: 0.3, type: "triangle", vol: 0.08, at: 0.18 }); },
    undo: () => tone(600, { to: 380, t: 0.15, type: "sine", vol: 0.07 })
  };

  ["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, () => { if (on()) ac(); }, { once: true }));
  return { play(name) { if (!on()) return; try { lib[name] && lib[name](); } catch (e) { /* audio blocked */ } } };
})();
