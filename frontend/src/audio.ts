/**
 * Web Audio API synthesizer for tactile Mahjong tile sound effects.
 * Requires zero external audio files and triggers with zero latency.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /** Satisfying wooden / bone Mahjong tile click sound */
  public playTileClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /** Optimal decision celebratory chime */
  public playSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const now = this.ctx!.currentTime + i * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    });
  }

  /** Suboptimal warning tone */
  public playWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /** Suboptimal / incorrect answer tone */
  public playSuboptimal() {
    this.playWarning();
  }

  /** General error tone */
  public playError() {
    this.playWarning();
  }

  /** Grand victory / Agari fanfare */
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Celebratory ascending fanfare with chords
    const chordSeq = [
      { notes: [523.25, 659.25, 783.99], time: 0.0, dur: 0.18 },       // C major
      { notes: [587.33, 739.99, 880.00], time: 0.18, dur: 0.18 },      // D major
      { notes: [659.25, 830.61, 987.77], time: 0.36, dur: 0.22 },      // E major
      { notes: [783.99, 1046.50, 1318.51], time: 0.58, dur: 0.6 }     // C high major fanfare
    ];

    chordSeq.forEach(({ notes, time, dur }) => {
      notes.forEach((freq) => {
        const now = this.ctx!.currentTime + time;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + dur + 0.02);
      });
    });
  }
}

export const sound = new SoundEngine();
