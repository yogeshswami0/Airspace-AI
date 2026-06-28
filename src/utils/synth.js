class SynthController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.humOsc = null;
    this.humGain = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopFocusHum();
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playClick() {
    if (this.muted) return;
    this.init();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playTriage() {
    if (this.muted) return;
    this.init();

    const duration = 1.0;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + duration * 0.8);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + duration);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playSuccess() {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [523.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      
      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.32);
    });
  }

  playAlarm() {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    const duration = 0.5;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.setValueAtTime(440, t + 0.15);
    osc.frequency.setValueAtTime(660, t + 0.3);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.setValueAtTime(0.08, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(t + duration);
  }

  playTimerFinish() {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const startTime = t + i * 0.25;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(1760, startTime + 0.1);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    }
  }

  startFocusHum() {
    if (this.muted) return;
    this.init();
    if (this.humOsc) return;

    try {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      
      this.humOsc.type = "triangle";
      this.humOsc.frequency.setValueAtTime(110, this.ctx.currentTime); // Low A2 hum
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(130, this.ctx.currentTime);

      this.humGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      this.humOsc.start();
    } catch (e) {
      console.warn("Could not start focus hum", e);
    }
  }

  stopFocusHum() {
    try {
      if (this.humOsc) {
        this.humOsc.stop();
        this.humOsc.disconnect();
        this.humOsc = null;
      }
      if (this.humGain) {
        this.humGain.disconnect();
        this.humGain = null;
      }
    } catch (e) {
      console.warn("Could not stop focus hum", e);
    }
  }
}

export const synth = new SynthController();
