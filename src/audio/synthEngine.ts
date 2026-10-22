/**
 * 80s Vaporwave Synth Engine & Arcade Sound Effects
 * Web Audio API procedural synthesis with zero external dependencies.
 */

export interface TrackInfo {
  id: number;
  title: string;
  artist: string;
  subgenre: string;
  bpm: number;
  durationSec: number;
  description: string;
  key: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 1,
    title: 'Sunset Highway 1984',
    artist: 'Neon Mirage',
    subgenre: 'Outrun / Synthwave',
    bpm: 112,
    durationSec: 180,
    description: 'Warm analog chords, driving 80s arpeggio, and sunset basslines.',
    key: 'A Minor',
  },
  {
    id: 2,
    title: 'Cyber Runner DX',
    artist: 'Vector Pulse',
    subgenre: 'Darksynth / Arcade',
    bpm: 126,
    durationSec: 210,
    description: 'High-energy 16th-note bass pulse, gritty saw leads, and arcade drums.',
    key: 'D Minor',
  },
  {
    id: 3,
    title: 'Midnight Cassette Memories',
    artist: 'Lofi Glitcher',
    subgenre: 'Chillwave / Vapor',
    bpm: 90,
    durationSec: 165,
    description: 'Detuned dreamy pads, tape-warble texture, and laid-back retro beats.',
    key: 'E Minor',
  },
];

// Frequencies for musical notes
const NOTE_FREQ: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
};

class SynthWaveAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  private isPlaying = false;
  private isMuted = false;
  private volume = 0.7;
  private currentTrackIndex = 0;
  private step = 0;
  private timerId: number | null = null;
  private trackElapsedSeconds = 0;
  private elapsedInterval: number | null = null;

  private onTrackChangeCallbacks: ((track: TrackInfo) => void)[] = [];
  private onPlayStateCallbacks: ((isPlaying: boolean) => void)[] = [];
  private onTimeUpdateCallbacks: ((elapsed: number, duration: number) => void)[] = [];

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.55, this.ctx.currentTime);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect graph: music -> musicGain -> analyser -> masterGain -> destination
      // SFX -> sfxGain -> analyser -> masterGain -> destination
      this.musicGain.connect(this.analyser);
      this.sfxGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(
    onTrackChange: (track: TrackInfo) => void,
    onPlayState: (isPlaying: boolean) => void,
    onTimeUpdate: (elapsed: number, duration: number) => void
  ) {
    this.onTrackChangeCallbacks.push(onTrackChange);
    this.onPlayStateCallbacks.push(onPlayState);
    this.onTimeUpdateCallbacks.push(onTimeUpdate);

    return () => {
      this.onTrackChangeCallbacks = this.onTrackChangeCallbacks.filter(c => c !== onTrackChange);
      this.onPlayStateCallbacks = this.onPlayStateCallbacks.filter(c => c !== onPlayState);
      this.onTimeUpdateCallbacks = this.onTimeUpdateCallbacks.filter(c => c !== onTimeUpdate);
    };
  }

  public getTrack(): TrackInfo {
    return TRACKS[this.currentTrackIndex];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public play() {
    this.initContext();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startMusicScheduler();
    this.onPlayStateCallbacks.forEach(cb => cb(true));
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.stopMusicScheduler();
    this.onPlayStateCallbacks.forEach(cb => cb(false));
  }

  public togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % TRACKS.length;
    this.step = 0;
    this.trackElapsedSeconds = 0;
    const track = TRACKS[this.currentTrackIndex];
    this.onTrackChangeCallbacks.forEach(cb => cb(track));
    if (this.isPlaying) {
      this.stopMusicScheduler();
      this.startMusicScheduler();
    }
  }

  public prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    this.step = 0;
    this.trackElapsedSeconds = 0;
    const track = TRACKS[this.currentTrackIndex];
    this.onTrackChangeCallbacks.forEach(cb => cb(track));
    if (this.isPlaying) {
      this.stopMusicScheduler();
      this.startMusicScheduler();
    }
  }

  public selectTrack(index: number) {
    if (index >= 0 && index < TRACKS.length) {
      this.currentTrackIndex = index;
      this.step = 0;
      this.trackElapsedSeconds = 0;
      const track = TRACKS[this.currentTrackIndex];
      this.onTrackChangeCallbacks.forEach(cb => cb(track));
      if (!this.isPlaying) {
        this.play();
      } else {
        this.stopMusicScheduler();
        this.startMusicScheduler();
      }
    }
  }

  public seek(seconds: number) {
    const curTrack = TRACKS[this.currentTrackIndex];
    this.trackElapsedSeconds = Math.max(0, Math.min(curTrack.durationSec, seconds));
    // Approximate step alignment: 1 beat = 4 16th notes
    const sixteenthsPerSec = (curTrack.bpm / 60) * 4;
    this.step = Math.floor(this.trackElapsedSeconds * sixteenthsPerSec) % 64;
    this.onTimeUpdateCallbacks.forEach(cb => cb(this.trackElapsedSeconds, curTrack.durationSec));
  }

  private startMusicScheduler() {
    const track = TRACKS[this.currentTrackIndex];
    const sixteenthIntervalMs = (60 / track.bpm / 4) * 1000;

    if (this.timerId !== null) clearInterval(this.timerId);
    if (this.elapsedInterval !== null) clearInterval(this.elapsedInterval);

    this.timerId = window.setInterval(() => {
      this.playMusicStep(track);
      this.step = (this.step + 1) % 64;
    }, sixteenthIntervalMs);

    this.elapsedInterval = window.setInterval(() => {
      this.trackElapsedSeconds += 1;
      if (this.trackElapsedSeconds >= track.durationSec) {
        this.nextTrack();
      } else {
        this.onTimeUpdateCallbacks.forEach(cb => cb(this.trackElapsedSeconds, track.durationSec));
      }
    }, 1000);
  }

  private stopMusicScheduler() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.elapsedInterval !== null) {
      clearInterval(this.elapsedInterval);
      this.elapsedInterval = null;
    }
  }

  /**
   * Generates rhythmic 16th note steps of synthwave track music
   */
  private playMusicStep(track: TrackInfo) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const step = this.step;

    if (track.id === 1) {
      // "Sunset Highway 1984" - A minor (Am - F - C - G)
      // Drums
      if (step % 8 === 0) this.triggerSynthKick(t);
      if (step % 8 === 4) this.triggerSynthSnare(t);
      if (step % 2 === 0) this.triggerSynthHihat(t, step % 4 === 2);

      // Bassline (80s driving 8th notes)
      if (step % 2 === 0) {
        const chordIndex = Math.floor(step / 16);
        const rootNotes = ['A2', 'F2', 'C2', 'G2'];
        const octaves = step % 4 === 0 ? 'A2' : 'A3';
        const bassNote = step % 4 === 0 ? rootNotes[chordIndex] : NOTE_FREQ[rootNotes[chordIndex]] * 2;
        this.triggerSynthBass(t, typeof bassNote === 'number' ? bassNote : NOTE_FREQ[bassNote], 0.12);
      }

      // Arpeggiated Lead Synth (16th notes)
      const arpNotesA = ['A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'E4', 'G4'];
      const arpNotesF = ['F3', 'A3', 'C4', 'F4', 'C4', 'A3', 'C4', 'E4'];
      const arpNotesC = ['C3', 'E3', 'G3', 'C4', 'G3', 'E3', 'G3', 'B3'];
      const arpNotesG = ['G3', 'B3', 'D4', 'G4', 'D4', 'B3', 'D4', 'F4'];
      const arpList = [arpNotesA, arpNotesF, arpNotesC, arpNotesG];
      const curArp = arpList[Math.floor(step / 16)];
      const noteName = curArp[step % 8];
      this.triggerSynthArp(t, NOTE_FREQ[noteName], 0.1);

      // Pad chord on measure start
      if (step % 16 === 0) {
        const chordIndex = Math.floor(step / 16);
        const chords = [
          [NOTE_FREQ.A3, NOTE_FREQ.C4, NOTE_FREQ.E4],
          [NOTE_FREQ.F3, NOTE_FREQ.A3, NOTE_FREQ.C4],
          [NOTE_FREQ.C3, NOTE_FREQ.E3, NOTE_FREQ.G3],
          [NOTE_FREQ.G3, NOTE_FREQ.B3, NOTE_FREQ.D4],
        ];
        this.triggerSynthPad(t, chords[chordIndex], 2.2);
      }
    } else if (track.id === 2) {
      // "Cyber Runner DX" - D Minor Darksynth (Fast & punchy)
      // Four on the floor kick
      if (step % 4 === 0) this.triggerSynthKick(t, 1.2);
      if (step % 8 === 4) this.triggerSynthSnare(t, 1.1);
      // 16th note closed hats
      this.triggerSynthHihat(t, step % 2 === 0);

      // Fast rolling bass
      const bar = Math.floor(step / 16);
      const rootD = bar === 3 ? NOTE_FREQ.C2 : (bar === 2 ? NOTE_FREQ.Bb2 || 116.54 : NOTE_FREQ.D2);
      const bassFreq = step % 4 === 0 ? rootD : rootD * 2;
      this.triggerSynthBass(t, bassFreq, 0.08, 'sawtooth');

      // Lead stab
      if (step % 8 === 2 || step % 8 === 5) {
        const stabs = [NOTE_FREQ.D4, NOTE_FREQ.F4, NOTE_FREQ.A4, NOTE_FREQ.C5];
        this.triggerSynthLead(t, stabs[step % 4], 0.18);
      }
    } else {
      // "Midnight Cassette Memories" - Chillwave E Minor
      // Laid back half-time kick & snare
      if (step % 16 === 0 || step % 16 === 10) this.triggerSynthKick(t, 0.8);
      if (step % 16 === 8) this.triggerSynthSnare(t, 0.7);
      if (step % 4 === 2) this.triggerSynthHihat(t, true);

      // Warm chorus Rhodes/FM bell pad
      if (step % 16 === 0) {
        const chordIndex = Math.floor(step / 16);
        const chillChords = [
          [NOTE_FREQ.E3, NOTE_FREQ.G3, NOTE_FREQ.B3, NOTE_FREQ.D4],
          [NOTE_FREQ.C3, NOTE_FREQ.E3, NOTE_FREQ.G3, NOTE_FREQ.B3],
          [NOTE_FREQ.A2, NOTE_FREQ.C3, NOTE_FREQ.E3, NOTE_FREQ.G3],
          [NOTE_FREQ.B2, NOTE_FREQ.D3, NOTE_FREQ.F3, NOTE_FREQ.A3],
        ];
        this.triggerSynthPad(t, chillChords[chordIndex % 4], 2.8, true);
      }

      // Occasional nostalgic high bell note
      if (step % 8 === 6) {
        const bellNotes = [NOTE_FREQ.E5, NOTE_FREQ.B4, NOTE_FREQ.G5, NOTE_FREQ.D5];
        this.triggerSynthLead(t, bellNotes[Math.floor(step / 8) % 4], 0.4, 'sine');
      }
    }
  }

  // --- SYNTHESIS INSTRUMENTS ---

  private triggerSynthKick(t: number, velocity = 1.0) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.12);

    gain.gain.setValueAtTime(0.7 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  private triggerSynthSnare(t: number, velocity = 1.0) {
    if (!this.ctx || !this.musicGain) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    oscGain.gain.setValueAtTime(0.3 * velocity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.12);

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * velocity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + 0.18);
  }

  private triggerSynthHihat(t: number, open = false) {
    if (!this.ctx || !this.musicGain) return;
    const dur = open ? 0.09 : 0.035;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.18 : 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + dur);
  }

  private triggerSynthBass(t: number, freq: number, dur = 0.12, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + dur);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private triggerSynthArp(t: number, freq: number, dur = 0.1) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + dur);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private triggerSynthLead(t: number, freq: number, dur = 0.2, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  private triggerSynthPad(t: number, freqs: number[], dur = 2.0, detuneWarble = false) {
    if (!this.ctx || !this.musicGain) return;

    freqs.forEach((freq, idx) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      const detune = detuneWarble ? (idx % 2 === 0 ? 8 : -8) : 5;
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq, t);
      osc1.detune.setValueAtTime(detune, t);
      osc2.detune.setValueAtTime(-detune, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(1300, t + dur * 0.5);
      filter.frequency.linearRampToValueAtTime(600, t + dur);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08 / freqs.length, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur);
      osc2.stop(t + dur);
    });
  }

  // --- RETRO ARCADE SOUND EFFECTS ---

  public playPlayerShoot() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playInvaderHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Crunch noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.18);
  }

  public playPlayerExplode() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  public playUfoSound() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(550, t + 0.08);
    osc.frequency.linearRampToValueAtTime(440, t + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playWaveStart() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [NOTE_FREQ.C4, NOTE_FREQ.E4, NOTE_FREQ.G4, NOTE_FREQ.C5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.2);
    });
  }
}

// Global singleton instance
export const synthEngine = new SynthWaveAudioEngine();
