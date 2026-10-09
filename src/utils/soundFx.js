// Web Audio API Synthesizer for Clinical Audio-Haptic Feedback
// Zero external asset dependencies, works instantly in all modern browsers

class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  vibrate(ms = 35) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Silently catch unsupported or permission-blocked vibration
      }
    }
  }

  playTap() {
    if (this.muted) return;
    this.init();
    this.vibrate(20);
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Audio playTap failed', e);
    }
  }

  playLockoutSuccess() {
    if (this.muted) return;
    this.init();
    this.vibrate([40, 30, 60]);
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Dual harmonic chime (880Hz -> 1320Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.00, now + 0.08); // A5

      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio success failed', e);
    }
  }

  playWarning() {
    if (this.muted) return;
    this.init();
    this.vibrate([80, 50, 80]);
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio warning failed', e);
    }
  }

  playDischargeAlert() {
    if (this.muted) return;
    this.init();
    this.vibrate([100, 50, 100, 50, 120]);
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  }
}

export const soundFx = new SoundController();
