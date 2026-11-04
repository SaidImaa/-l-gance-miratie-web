/**
 * Ambiance sonore générée en temps réel (aucun fichier audio) :
 * vent du désert, bourdon grave en ré, et carillons sur la gamme orientale Hijaz.
 * Désactivée par défaut, activée par le visiteur.
 */
const HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33]; // ré mi♭ fa♯ sol la si♭ do ré

export function createAmbience(button) {
  let ctx = null;
  let master = null;
  let on = false;
  let lastChime = 0;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);

    // vent : bruit filtré, filtre qui respire
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      b = 0.98 * b + 0.02 * (Math.random() * 2 - 1);
      data[i] = b * 6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 500;
    band.Q.value = 0.8;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 320;
    lfo.connect(lfoGain).connect(band.frequency);
    noise.connect(band).connect(windGain).connect(master);
    noise.start();
    lfo.start();

    // bourdon
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 700;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05;
    [73.42, 110, 146.83, 220.4].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.value = [1, 0.5, 0.35, 0.12][i];
      o.connect(g).connect(low);
      o.start();
    });
    const trem = ctx.createOscillator();
    trem.frequency.value = 0.12;
    const tremGain = ctx.createGain();
    tremGain.gain.value = 0.02;
    trem.connect(tremGain).connect(droneGain.gain);
    trem.start();
    low.connect(droneGain).connect(master);
  }

  function chime(index) {
    if (!on || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastChime < 0.08) return;
    lastChime = now;
    const f = HIJAZ[((index % HIJAZ.length) + HIJAZ.length) % HIJAZ.length] * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.06, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * m;
      const og = ctx.createGain();
      og.gain.value = [1, 0.3, 0.1][i];
      o.connect(og).connect(g);
      o.start(now);
      o.stop(now + 2.3);
    });
    g.connect(master);
  }

  function set(state) {
    on = state;
    if (on && !ctx) build();
    if (!ctx) return;
    if (on) ctx.resume();
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, now + (on ? 2.5 : 0.8));
    button?.classList.toggle('is-on', on);
    button?.setAttribute('aria-pressed', String(on));
  }

  button?.addEventListener('click', () => set(!on));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (on) ctx.resume();
  });

  return { chime, set, get on() { return on; } };
}
