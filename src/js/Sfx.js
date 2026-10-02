import { Storage } from "./Storage";

// Procedural sound effects built straight on the WebAudio graph — no audio
// files to load, ship or license. One Sfx instance per scene; reads the
// persisted mute preference from Storage.
export class Sfx {
    constructor(scene) {
        this.scene = scene;
        this.ctx = scene.sound && scene.sound.context ? scene.sound.context : null;
        this.muted = Storage.getMuted();
        // Browsers start the AudioContext suspended until a user gesture.
        if (this.ctx && scene.input) {
            scene.input.once("pointerdown", () => this.resume());
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    }

    toggleMute() {
        this.muted = !this.muted;
        Storage.setMuted(this.muted);
        return this.muted;
    }

    // One enveloped oscillator blip. `end` sweeps the frequency for whooshes.
    tone({ freq = 440, end = null, dur = 0.12, type = "sine", gain = 0.16, when = 0 }) {
        if (!this.ctx || this.muted) return;
        try {
            const t0 = this.ctx.currentTime + when;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t0);
            if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), t0 + dur);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            osc.connect(g).connect(this.ctx.destination);
            osc.start(t0);
            osc.stop(t0 + dur + 0.05);
        } catch (e) { /* audio must never break gameplay */ }
    }

    noise({ dur = 0.18, gain = 0.12, when = 0, freq = 1200 }) {
        if (!this.ctx || this.muted) return;
        try {
            const t0 = this.ctx.currentTime + when;
            const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
            const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const filter = this.ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = freq;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(gain, t0);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            src.connect(filter).connect(g).connect(this.ctx.destination);
            src.start(t0);
        } catch (e) { /* ignore */ }
    }

    click()  { this.tone({ freq: 660, end: 880, dur: 0.07, type: "triangle", gain: 0.12 }); }
    hover()  { this.tone({ freq: 520, dur: 0.04, type: "sine", gain: 0.05 }); }
    spawn()  { this.tone({ freq: 320, end: 620, dur: 0.12, type: "sine", gain: 0.14 }); }
    drop()   { this.tone({ freq: 240, end: 160, dur: 0.09, type: "sine", gain: 0.1 }); }
    bond()   {
        this.tone({ freq: 523, dur: 0.1, type: "triangle", gain: 0.15 });
        this.tone({ freq: 784, dur: 0.14, type: "sine", gain: 0.13, when: 0.06 });
        this.noise({ dur: 0.1, gain: 0.05, freq: 2400 });
    }
    break()  { this.tone({ freq: 300, end: 110, dur: 0.16, type: "sawtooth", gain: 0.08 }); this.noise({ dur: 0.12, gain: 0.08, freq: 700 }); }
    deny()   { this.tone({ freq: 180, end: 140, dur: 0.12, type: "square", gain: 0.06 }); }
    delete() { this.noise({ dur: 0.14, gain: 0.07, freq: 500 }); }
    star(i)  { this.tone({ freq: 880 + i * 220, dur: 0.12, type: "triangle", gain: 0.14 }); }
    win()    {
        [523, 659, 784, 1047].forEach((f, i) =>
            this.tone({ freq: f, dur: 0.22, type: "triangle", gain: 0.14, when: i * 0.11 }));
        this.tone({ freq: 1568, dur: 0.4, type: "sine", gain: 0.08, when: 0.44 });
    }
}
