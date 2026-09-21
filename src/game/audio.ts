export class SoftAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private started = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    const master = this.master;
    const ctx = this.ctx;
    if (!master || !ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(muted ? 0 : 0.22, ctx.currentTime, 0.04);
  }

  unlock(): void {
    if (this.started) {
      void this.ctx?.resume();
      return;
    }
    this.started = true;
    const ctx = new AudioContext();
    this.ctx = ctx;
    void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.22;
    master.connect(ctx.destination);
    this.master = master;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) void this.ctx?.resume();
    });
  }

  chime(): void {
    this.bell([659.25, 987.77], 0.55, 0.11);
  }

  hum(): void {
    this.bell([392, 523.25, 659.25], 0.85, 0.08);
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private bell(freqs: number[], dur: number, peak: number): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    for (let i = 0; i < freqs.length; i += 1) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freqs[i];
      const start = now + i * 0.05;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak / freqs.length, start + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      osc.onended = () => {
        osc.disconnect();
        g.disconnect();
      };
    }
  }
}
