// Web Audio API acoustic engine with clean studio-grade audio assets for iOS, Android & Web
// Pristine sampled bells, singing bowls, zen gongs, tactile clicks, and loopable ambient soundscapes.
// Routed through a hardware dynamics compressor limiter with smooth ramps to eliminate mobile speaker crackle.

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

const SOUND_FILES: Record<string, string> = {
  // Meditation instruments & alarms
  tibetan_bowl: '/sounds/tibetan_bowl.wav',
  zen_gong: '/sounds/zen_gong.wav',
  temple_bell: '/sounds/temple_bell.wav',
  gentle_bell: '/sounds/gentle_bell.wav',
  crystal_chime: '/sounds/crystal_chime.wav',
  sacred_chimes: '/sounds/sacred_chimes.wav',
  gentle_harp: '/sounds/gentle_harp.wav',
  digital_alert: '/sounds/digital_alert.wav',
  timer_start_music: '/sounds/timer_start_music.wav',

  // Tactile touch clicks
  touch_pencil: '/sounds/touch_pencil.wav',
  touch_pop: '/sounds/touch_pop.wav',
  touch_click: '/sounds/touch_click.wav',
  touch_chime: '/sounds/touch_chime.wav',
  touch_wood: '/sounds/touch_wood.wav',

  // Ambience loops
  ambience_432hz: '/sounds/ambience_432hz.wav',
  ambience_rain: '/sounds/ambience_rain.wav',
  ambience_stream: '/sounds/ambience_stream.wav',
  ambience_whitenoise: '/sounds/ambience_whitenoise.wav',
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private currentAmbienceType: AmbienceType = 'none';

  private bufferCache: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer | null>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      const warmUp = () => {
        try {
          this.getAudioContext();
          this.preloadCommonSounds();
        } catch {}
        window.removeEventListener('pointerdown', warmUp);
        window.removeEventListener('touchstart', warmUp);
        window.removeEventListener('click', warmUp);
      };
      window.addEventListener('pointerdown', warmUp, { once: true, passive: true });
      window.addEventListener('touchstart', warmUp, { once: true, passive: true });
      window.addEventListener('click', warmUp, { once: true, passive: true });
    }
  }

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

  // Master brickwall limiter: prevents mobile DAC clipping & crackling
  private getLimiter(ctx: AudioContext): DynamicsCompressorNode {
    if (!this.limiter || this.limiter.context !== ctx) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-2.0, ctx.currentTime);
      comp.knee.setValueAtTime(0.0, ctx.currentTime);
      comp.ratio.setValueAtTime(20.0, ctx.currentTime);
      comp.attack.setValueAtTime(0.003, ctx.currentTime);
      comp.release.setValueAtTime(0.05, ctx.currentTime);
      comp.connect(ctx.destination);
      this.limiter = comp;
    }
    return this.limiter;
  }

  // Pre-load common sounds into memory for zero latency
  public preloadCommonSounds(): void {
    const keys = [
      'touch_pencil',
      'touch_pop',
      'touch_click',
      'touch_wood',
      'touch_chime',
      'gentle_bell',
      'tibetan_bowl',
      'timer_start_music'
    ];
    for (const key of keys) {
      this.loadAudio(key).catch(() => {});
    }
  }

  // Fetch, decode, and cache an audio file into an AudioBuffer
  public async loadAudio(soundKey: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(soundKey)) {
      return this.bufferCache.get(soundKey)!;
    }
    if (this.loadingPromises.has(soundKey)) {
      return this.loadingPromises.get(soundKey)!;
    }

    const url = SOUND_FILES[soundKey];
    if (!url) return null;

    const promise = (async () => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return null;

        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.bufferCache.set(soundKey, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn(`Failed to load audio file for ${soundKey}`, err);
        return null;
      } finally {
        this.loadingPromises.delete(soundKey);
      }
    })();

    this.loadingPromises.set(soundKey, promise);
    return promise;
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

  // Clean studio sound file playback through limiter
  public async playSoundFile(soundKey: string, volume = 0.8, loop = false): Promise<AudioBufferSourceNode | null> {
    if (volume <= 0) return null;
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      const buffer = await this.loadAudio(soundKey);
      if (!buffer) {
        this.playFallbackBeep(volume);
        return null;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      // Gentle 2ms micro-ramp to eliminate any DC pop
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(Math.min(1.0, Math.max(0.001, volume)), now + 0.003);

      source.connect(gain);
      gain.connect(this.getLimiter(ctx));

      source.start(now);
      return source;
    } catch (err) {
      console.warn('playSoundFile error', err);
      return null;
    }
  }

  // Safe minimal fallback if audio files are ever unreachable
  private playFallbackBeep(volume = 0.5): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.getLimiter(ctx));
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  // 1. Tibetan Singing Bowl
  playTibetanBowl(volume = 0.8): void {
    this.playSoundFile('tibetan_bowl', volume * 0.85);
  }

  // 2. Zen Bronze Gong
  playZenGong(volume = 0.8): void {
    this.playSoundFile('zen_gong', volume * 0.9);
  }

  // 3. Temple Bell
  playTempleBell(volume = 0.8): void {
    this.playSoundFile('temple_bell', volume * 0.8);
  }

  // 4. Gentle Bell
  playGentleBell(volume = 0.8): void {
    this.playSoundFile('gentle_bell', volume * 0.8);
  }

  // 5. Crystal Chime
  playCrystalChime(volume = 0.8): void {
    this.playSoundFile('crystal_chime', volume * 0.8);
  }

  // 6. Sacred Chimes
  playSacredChimes(volume = 0.8): void {
    this.playSoundFile('sacred_chimes', volume * 0.85);
  }

  // 7. Gentle Harp
  playGentleHarp(volume = 0.8): void {
    this.playSoundFile('gentle_harp', volume * 0.85);
  }

  // 8. Block Timer Start Music (Warm 432 pad + sparkling Dmaj9 arpeggio)
  playBlockTimerStartMusic(volume = 0.8): void {
    this.playSoundFile('timer_start_music', volume * 0.9);
  }

  // 9. Modern Digital Alert
  playDigitalAlert(volume = 0.8): void {
    this.playSoundFile('digital_alert', volume * 0.7);
  }

  // Tactile touch feedback sounds
  playPencilRaw(vol = 0.7): void {
    this.playSoundFile('touch_pencil', vol * 0.4);
  }

  playPop(vol = 0.7): void {
    this.playSoundFile('touch_pop', vol * 0.5);
  }

  playClick(vol = 0.7): void {
    this.playSoundFile('touch_click', vol * 0.45);
  }

  playChime(vol = 0.7): void {
    this.playSoundFile('touch_chime', vol * 0.4);
  }

  playWood(vol = 0.7): void {
    this.playSoundFile('touch_wood', vol * 0.5);
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

    // Subtle tactile haptic tick if supported
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

  // Backward-compatible playPencil routes through playTouchSound
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

  // Seamless Ambience Playback (Rain, 432Hz Alpha, Forest, White Noise)
  startAmbience(type?: AmbienceType, customVol?: number): void {
    this.stopAmbience();

    const settings = this.getSettings();
    const ambience = type || settings.ambience;
    if (ambience === 'none') return;

    let soundKey = '';
    switch (ambience) {
      case 'alpha432':
        soundKey = 'ambience_432hz';
        break;
      case 'rain':
        soundKey = 'ambience_rain';
        break;
      case 'forest_stream':
        soundKey = 'ambience_stream';
        break;
      case 'white_noise':
        soundKey = 'ambience_whitenoise';
        break;
      default:
        return;
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const vol = (customVol !== undefined ? customVol : settings.ambienceVolume) * settings.masterVolume;
      const targetGain = Math.max(0.001, Math.min(1.0, vol * 0.75));

      this.currentAmbienceType = ambience;
      const gainNode = ctx.createGain();
      const now = ctx.currentTime;
      // Smooth fade-in over 350ms to prevent click
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(targetGain, now + 0.35);
      gainNode.connect(this.getLimiter(ctx));
      this.ambienceGain = gainNode;

      this.loadAudio(soundKey).then((buffer) => {
        if (!buffer || this.currentAmbienceType !== ambience) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        source.start(0);
        this.ambienceSource = source;
      });
    } catch (e) {
      console.warn('Ambience start error', e);
    }
  }

  stopAmbience(): void {
    if (this.ambienceGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        const currentGain = this.ambienceGain.gain.value;
        this.ambienceGain.gain.setValueAtTime(Math.max(0.0001, currentGain), now);
        this.ambienceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      } catch {}
    }

    const sourceToStop = this.ambienceSource;
    const gainToDisconnect = this.ambienceGain;
    this.ambienceSource = null;
    this.ambienceGain = null;
    this.currentAmbienceType = 'none';

    setTimeout(() => {
      try {
        (sourceToStop as any)?.stop?.();
        sourceToStop?.disconnect();
        gainToDisconnect?.disconnect();
      } catch {}
    }, 280);
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
