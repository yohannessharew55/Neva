// Web Audio API acoustic engine for iOS 16+ & Web
// High-fidelity synthesized meditation bells, Tibetan singing bowls, zen gongs, and ambient audio

export type StartSoundType = 'none' | 'gentle_bell' | 'tibetan_bowl' | 'zen_gong' | 'crystal_chime';
export type AlarmSoundType = 'none' | 'tibetan_bowl' | 'temple_bell' | 'zen_gong' | 'sacred_chimes' | 'digital_alert' | 'gentle_harp';
export type AmbienceType = 'none' | 'alpha432' | 'rain' | 'forest_stream' | 'white_noise';
export type TouchSoundType = 'pencil' | 'pop' | 'click' | 'chime' | 'wood' | 'none';

export interface FocusSoundSettings {
  startSound: StartSoundType;
  alarmSound: AlarmSoundType;
  ambience: AmbienceType;
  masterVolume: number; // 0.0 to 1.0
  ambienceVolume: number; // 0.0 to 1.0
  vibrationEnabled: boolean;
  // Tactile touch feedback settings
  touchSoundType: TouchSoundType;
  touchSoundVolume: number; // 0.0 to 1.0
  touchSoundEnabled: boolean;
}

export const DEFAULT_SOUND_SETTINGS: FocusSoundSettings = {
  startSound: 'gentle_bell',
  alarmSound: 'tibetan_bowl',
  ambience: 'none',
  masterVolume: 0.8,
  ambienceVolume: 0.4,
  vibrationEnabled: true,
  touchSoundType: 'pencil',
  touchSoundVolume: 0.7,
  touchSoundEnabled: true,
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambienceSource: AudioNode | null = null;
  private ambienceGain: GainNode | null = null;
  private currentAmbienceType: AmbienceType = 'none';

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      console.warn('AudioContext initialization error', e);
      return null;
    }
  }

  // Load sound settings from localStorage
  getSettings(): FocusSoundSettings {
    try {
      const saved = localStorage.getItem('livotion_focus_sound_settings_v1');
      if (saved) return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SOUND_SETTINGS;
  }

  saveSettings(settings: FocusSoundSettings): void {
    try {
      localStorage.setItem('livotion_focus_sound_settings_v1', JSON.stringify(settings));
    } catch (e) {}
  }

  // Play Tibetan Singing Bowl (Warm multi-harmonic resonance)
  playTibetanBowl(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume * 0.7, now);
      master.connect(ctx.destination);

      // Fundamental and spiritual harmonic partials
      const partials = [
        { freq: 216, gain: 0.8, decay: 4.5 },
        { freq: 594, gain: 0.35, decay: 3.5 },
        { freq: 1188, gain: 0.15, decay: 2.2 },
        { freq: 1782, gain: 0.05, decay: 1.5 }
      ];

      partials.forEach(p => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);

        // subtle wobble / shimmer
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(4.5, now);
        lfoGain.gain.setValueAtTime(1.5, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + p.decay);

        g.gain.setValueAtTime(p.gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(g);
        g.connect(master);

        osc.start(now);
        osc.stop(now + p.decay);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  // Play Zen Bronze Gong
  playZenGong(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume * 0.8, now);
      master.connect(ctx.destination);

      const partials = [
        { freq: 115, gain: 0.9, decay: 5.0 },
        { freq: 278, gain: 0.4, decay: 4.0 },
        { freq: 442, gain: 0.25, decay: 3.0 },
        { freq: 720, gain: 0.1, decay: 2.0 }
      ];

      partials.forEach(p => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.freq, now);

        g.gain.setValueAtTime(p.gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(g);
        g.connect(master);

        osc.start(now);
        osc.stop(now + p.decay);
      });
    } catch (e) {}
  }

  // Play Temple Bell (Clear high overtone bell)
  playTempleBell(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume * 0.7, now);
      master.connect(ctx.destination);

      const partials = [
        { freq: 528, gain: 0.8, decay: 3.8 },
        { freq: 1056, gain: 0.4, decay: 2.5 },
        { freq: 2112, gain: 0.15, decay: 1.8 }
      ];

      partials.forEach(p => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);

        g.gain.setValueAtTime(p.gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(g);
        g.connect(master);

        osc.start(now);
        osc.stop(now + p.decay);
      });
    } catch (e) {}
  }

  // Play Gentle Bell (Calming start chime)
  playGentleBell(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.2);
    } catch (e) {}
  }

  // Play Crystal Chime (Sparkling uplifting start)
  playCrystalChime(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.8);
      });
    } catch (e) {}
  }

  // Play Sacred Chimes
  playSacredChimes(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch (e) {}
  }

  // Play Gentle Harp
  playGentleHarp(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const chord = [329.63, 392.00, 493.88, 587.33, 659.25]; // E minor 9
      chord.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.8);
      });
    } catch (e) {}
  }

  // Play Uplifting Melodic Chime & Ambient Harp Music Effect for Block Timer Start
  playBlockTimerStartMusic(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const baseNow = ctx.currentTime;

      // Master gain node
      const master = ctx.createGain();
      master.gain.setValueAtTime(volume * 0.8, baseNow);
      master.connect(ctx.destination);

      // 1. Resonant Warm Solfeggio & Harmonic Ambient Pad (Swells smoothly under chord)
      const dronePartials = [
        { freq: 432.0, gain: 0.26, decay: 3.4 }, // A4 432Hz Solfeggio / Natural tuning
        { freq: 528.0, gain: 0.22, decay: 3.2 }, // C5 528Hz Solfeggio transformation tone
        { freq: 216.0, gain: 0.22, decay: 3.8 }  // Sub-octave warm acoustic body
      ];

      dronePartials.forEach((p) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, baseNow);

        // Subtle warm LFO shimmer
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(4.2, baseNow);
        lfoGain.gain.setValueAtTime(1.2, baseNow);
        lfo.connect(osc.frequency);
        lfo.start(baseNow);
        lfo.stop(baseNow + p.decay);

        g.gain.setValueAtTime(0.001, baseNow);
        g.gain.linearRampToValueAtTime(p.gain, baseNow + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, baseNow + p.decay);

        osc.connect(g);
        g.connect(master);

        osc.start(baseNow);
        osc.stop(baseNow + p.decay);
      });

      // 2. Sparkling Celestial Music Arpeggio (Dmaj9 / Golden Flow Chord)
      // D4, A4, D5, F#5, A5, E6 (pure harmonic sequence)
      const melodyNotes = [
        { freq: 293.66, delay: 0.00, gain: 0.38, decay: 2.6 }, // D4
        { freq: 440.00, delay: 0.08, gain: 0.35, decay: 2.5 }, // A4
        { freq: 587.33, delay: 0.16, gain: 0.38, decay: 2.8 }, // D5
        { freq: 739.99, delay: 0.24, gain: 0.36, decay: 3.0 }, // F#5
        { freq: 880.00, delay: 0.32, gain: 0.32, decay: 3.2 }, // A5
        { freq: 1318.51, delay: 0.42, gain: 0.26, decay: 3.5 } // E6
      ];

      melodyNotes.forEach((n) => {
        const noteTime = baseNow + n.delay;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        // Harmonically rich acoustic chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, noteTime);

        g.gain.setValueAtTime(0.001, noteTime);
        g.gain.linearRampToValueAtTime(n.gain, noteTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, noteTime + n.decay);

        osc.connect(g);
        g.connect(master);

        osc.start(noteTime);
        osc.stop(noteTime + n.decay);
      });
    } catch (e) {
      console.warn('Block timer start music error', e);
    }
  }

  // Play Modern Digital Alert
  playDigitalAlert(volume = 0.8): void {
    if (volume <= 0) return;
    try {
      const ctx = this.getAudioContext();
      [0, 0.16].forEach((delay) => {
        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);

        gain.gain.setValueAtTime(volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      });
    } catch (e) {}
  }

  // High-fidelity tactile touch feedback sounds
  playPencilRaw(vol = 0.7): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(vol * 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playPop(vol = 0.7): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(1250, now + 0.03);
      gain.gain.setValueAtTime(vol * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playClick(vol = 0.7): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(2400, now);
      osc2.frequency.setValueAtTime(3600, now);
      gain.gain.setValueAtTime(vol * 0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.025);
      osc2.stop(now + 0.025);
    } catch (e) {}
  }

  playChime(vol = 0.7): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [1318.5, 1975.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        gain.gain.setValueAtTime(vol * 0.08, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + 0.22);
      });
    } catch (e) {}
  }

  playWood(vol = 0.7): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.05);
      gain.gain.setValueAtTime(vol * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // Unified Touch / Tap sound dispatcher
  playTouchSound(customType?: TouchSoundType, customVol?: number): void {
    const settings = this.getSettings();
    if (settings.touchSoundEnabled === false) return;

    const type = customType || settings.touchSoundType || 'pencil';
    if (type === 'none') return;

    const baseVol = customVol !== undefined ? customVol : (settings.touchSoundVolume ?? 0.7);
    const effectiveVol = Math.max(0, Math.min(1, baseVol * (settings.masterVolume ?? 0.8)));
    if (effectiveVol <= 0) return;

    // Haptic tick if enabled
    if (settings.vibrationEnabled !== false && typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(8); } catch {}
    }

    switch (type) {
      case 'pop':
        this.playPop(effectiveVol);
        break;
      case 'click':
        this.playClick(effectiveVol);
        break;
      case 'chime':
        this.playChime(effectiveVol);
        break;
      case 'wood':
        this.playWood(effectiveVol);
        break;
      case 'pencil':
      default:
        this.playPencilRaw(effectiveVol);
        break;
    }
  }

  // Backward-compatible playPencil now routes through playTouchSound!
  playPencil(): void {
    this.playTouchSound();
  }

  // Play Focus Start Sound based on profile
  playStartSound(type?: StartSoundType, customVol?: number): void {
    const settings = this.getSettings();
    const sound = type || settings.startSound;
    const vol = customVol !== undefined ? customVol : settings.masterVolume;

    switch (sound) {
      case 'gentle_bell':
        this.playBlockTimerStartMusic(vol);
        break;
      case 'tibetan_bowl':
        this.playTibetanBowl(vol);
        break;
      case 'zen_gong':
        this.playZenGong(vol);
        break;
      case 'crystal_chime':
        this.playCrystalChime(vol);
        break;
      case 'none':
      default:
        this.playBlockTimerStartMusic(vol);
        break;
    }
  }

  // Play Focus Alarm / Finish Sound based on profile
  playAlarmSound(type?: AlarmSoundType, customVol?: number): void {
    const settings = this.getSettings();
    const sound = type || settings.alarmSound;
    const vol = customVol !== undefined ? customVol : settings.masterVolume;

    switch (sound) {
      case 'tibetan_bowl':
        this.playTibetanBowl(vol);
        break;
      case 'temple_bell':
        this.playTempleBell(vol);
        break;
      case 'zen_gong':
        this.playZenGong(vol);
        break;
      case 'sacred_chimes':
        this.playSacredChimes(vol);
        break;
      case 'gentle_harp':
        this.playGentleHarp(vol);
        break;
      case 'digital_alert':
        this.playDigitalAlert(vol);
        break;
      case 'none':
      default:
        break;
    }
  }

  // General playSound method supporting all profile names and sound types
  playSound(profile?: string, customVol?: number): void {
    try {
      if (!profile) {
        this.playStartSound();
        return;
      }
      const clean = String(profile).trim().toLowerCase();
      const settings = this.getSettings();
      const vol = customVol !== undefined ? customVol : settings.masterVolume;

      switch (clean) {
        case 'chime_meditation':
        case 'crystal_chime':
          this.playCrystalChime(vol);
          break;
        case 'solfeggio_432':
        case 'timer_start':
        case 'block_start':
        case 'block_timer':
          this.playBlockTimerStartMusic(vol);
          break;
        case 'sacred_chimes':
        case 'alpha432':
          this.playSacredChimes(vol);
          break;
        case 'tibetan_bowl':
          this.playTibetanBowl(vol);
          break;
        case 'zen_gong':
          this.playZenGong(vol);
          break;
        case 'temple_bell':
          this.playTempleBell(vol);
          break;
        case 'gentle_bell':
          this.playGentleBell(vol);
          break;
        case 'gentle_harp':
          this.playGentleHarp(vol);
          break;
        case 'digital_alert':
          this.playDigitalAlert(vol);
          break;
        case 'pencil':
          this.playPencil();
          break;
        default:
          this.playGentleBell(vol);
          break;
      }
    } catch (e) {
      console.warn('playSound safe error caught', e);
    }
  }

  // Alias for playAlarmSound
  playAlarm(type?: AlarmSoundType | string, customVol?: number): void {
    try {
      this.playAlarmSound(type as AlarmSoundType, customVol);
    } catch (e) {
      console.warn('playAlarm safe error caught', e);
    }
  }

  // Background Ambience Synthesizer (Rain, 432Hz Alpha, Forest, White Noise)
  startAmbience(type?: AmbienceType, customVol?: number): void {
    this.stopAmbience();

    const settings = this.getSettings();
    const ambience = type || settings.ambience;
    if (ambience === 'none') return;

    try {
      const ctx = this.getAudioContext();
      const vol = (customVol !== undefined ? customVol : settings.ambienceVolume) * settings.masterVolume;

      this.ambienceGain = ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(Math.max(0.001, vol * 0.4), ctx.currentTime);
      this.ambienceGain.connect(ctx.destination);
      this.currentAmbienceType = ambience;

      if (ambience === 'alpha432') {
        // Binaural Meditative 432Hz with 10Hz alpha difference
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        oscLeft.type = 'sine';
        oscRight.type = 'sine';
        oscLeft.frequency.setValueAtTime(432, ctx.currentTime);
        oscRight.frequency.setValueAtTime(442, ctx.currentTime); // 10Hz alpha wave difference

        const merger = ctx.createChannelMerger(2);
        oscLeft.connect(merger, 0, 0);
        oscRight.connect(merger, 0, 1);
        merger.connect(this.ambienceGain);

        oscLeft.start();
        oscRight.start();
        this.ambienceSource = oscLeft; // reference for stopping
      } else {
        // Noise buffer generator for Rain / Stream / White Noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (ambience === 'rain') {
            // Brown noise (gentle rain)
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
          } else if (ambience === 'forest_stream') {
            // Pinkish filtered noise
            output[i] = (lastOut + 0.05 * white) / 1.05;
            lastOut = output[i];
            output[i] *= 2.5;
          } else {
            // Smooth white noise
            output[i] = white * 0.3;
          }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (ambience === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
        } else if (ambience === 'forest_stream') {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, ctx.currentTime);
          filter.Q.setValueAtTime(1.0, ctx.currentTime);
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1500, ctx.currentTime);
        }

        whiteNoise.connect(filter);
        filter.connect(this.ambienceGain);
        whiteNoise.start();
        this.ambienceSource = whiteNoise;
      }
    } catch (e) {
      console.warn('Ambience start error', e);
    }
  }

  stopAmbience(): void {
    if (this.ambienceSource) {
      try {
        (this.ambienceSource as any).stop?.();
        this.ambienceSource.disconnect();
      } catch (e) {}
      this.ambienceSource = null;
    }
    if (this.ambienceGain) {
      try {
        this.ambienceGain.disconnect();
      } catch (e) {}
      this.ambienceGain = null;
    }
    this.currentAmbienceType = 'none';
  }

  isAmbiencePlaying(): boolean {
    return this.ambienceSource !== null;
  }
}

const baseSoundEngine = new SoundEngine();

// Bulletproof Proxy: Guarantees any existing or future audio call will never throw "xxx is not a function"
export const soundEngine: SoundEngine & { [key: string]: any } = new Proxy(baseSoundEngine as any, {
  get(target, prop, receiver) {
    if (prop in target) {
      const val = (target as any)[prop];
      if (typeof val === 'function') {
        return (...args: any[]) => {
          try {
            return val.apply(target, args);
          } catch (err) {
            console.warn(`soundEngine.${String(prop)} error caught safely:`, err);
          }
        };
      }
      return val;
    }
    // Safe fallback for any missing method: prevents "soundEngine.xxx is not a function"
    return (...args: any[]) => {
      console.warn(`soundEngine.${String(prop)} called but not defined on instance, handled gracefully`, args);
      if (String(prop).toLowerCase().includes('alarm')) {
        try { target.playAlarmSound(); } catch {}
      } else {
        try { target.playStartSound(); } catch {}
      }
    };
  }
});
