/**
 * Dominators Audio Service
 * Generates procedural UI sounds using Web Audio API
 */

class AudioService {
  private context: AudioContext | null = null;

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  /**
   * Play a professional, ultra-subtle "muted tap" for outgoing messages
   */
  playOutgoing() {
    this.initContext();
    if (!this.context) return;

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Play a professional, soft "glass chime" for incoming messages
   */
  playIncoming() {
    this.initContext();
    if (!this.context) return;

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private thinkingOsc: OscillatorNode | null = null;
  private thinkingGain: GainNode | null = null;

  /**
   * Start a professional, ultra-subtle "breathing" hum for thinking state
   */
  startThinking() {
    this.initContext();
    if (!this.context || this.thinkingOsc) return;

    const now = this.context.currentTime;
    this.thinkingOsc = this.context.createOscillator();
    this.thinkingGain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    this.thinkingOsc.type = 'sine';
    this.thinkingOsc.frequency.setValueAtTime(80, now); // Very low frequency

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    // Subtle LFO for breathing effect
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    lfo.frequency.setValueAtTime(0.4, now); // Very slow pulse
    lfoGain.gain.setValueAtTime(0.002, now);
    
    lfo.connect(lfoGain);
    lfoGain.connect(this.thinkingGain.gain);

    this.thinkingGain.gain.setValueAtTime(0.005, now); // Extremely low volume

    this.thinkingOsc.connect(filter);
    filter.connect(this.thinkingGain);
    this.thinkingGain.connect(this.context.destination);

    lfo.start(now);
    this.thinkingOsc.start(now);
  }

  /**
   * Stop the thinking hum
   */
  stopThinking() {
    if (this.thinkingOsc && this.context) {
      this.thinkingGain?.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
      this.thinkingOsc.stop(this.context.currentTime + 0.2);
      this.thinkingOsc = null;
      this.thinkingGain = null;
    }
  }
}

export const auraAudio = new AudioService();
