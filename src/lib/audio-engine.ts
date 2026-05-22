import { getAudio, isIdbUrl, idbUrlToKey } from './audio-storage';

interface PlaybackSession {
  source: AudioBufferSourceNode;
  gain: GainNode;
  buffer: AudioBuffer;
  startTime: number;
  loop: boolean;
}

const MAX_CONCURRENT = 4;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private sessions = new Map<number, PlaybackSession>();
  private playbackOrder: number[] = [];
  private trackVolumes = new Map<number, number>();
  private currentAmbientIndex: number | null = null;
  private progressCb: ((index: number, pct: number) => void) | null = null;
  private playingStateCb: ((index: number, playing: boolean) => void) | null = null;
  private animFrameId: number | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  async resume(): Promise<void> {
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
  }

  setMasterVolume(v: number): void {
    this.getMasterGain().gain.value = v;
    this.sessions.forEach((s, idx) => {
      const trackVol = this.trackVolumes.get(idx) ?? 1;
      s.gain.gain.value = trackVol * v;
    });
  }

  getMasterVolume(): number {
    return this.getMasterGain().gain.value;
  }

  async loadBuffer(audioUrl: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(audioUrl)) return this.bufferCache.get(audioUrl)!;
    this.getCtx();
    let data: string;
    if (isIdbUrl(audioUrl)) {
      const base64 = await getAudio(idbUrlToKey(audioUrl));
      if (!base64) throw new Error('Audio not found in IndexedDB');
      data = base64;
    } else {
      data = audioUrl;
    }
    const resp = await fetch(data);
    const arrayBuffer = await resp.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    this.bufferCache.set(audioUrl, audioBuffer);
    return audioBuffer;
  }

  hasBuffer(audioUrl: string): boolean {
    return this.bufferCache.has(audioUrl);
  }

  async play(
    index: number,
    audioUrl: string,
    volume: number,
    loop: boolean,
  ): Promise<void> {
    if (this.sessions.has(index)) {
      this.stop(index);
      return;
    }

    if (this.sessions.size >= MAX_CONCURRENT) {
      const oldest = this.playbackOrder.shift()!;
      this.stop(oldest);
    }

    await this.resume();
    const buffer = await this.loadBuffer(audioUrl);
    const ctx = this.getCtx();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gain = ctx.createGain();
    const vol = volume * this.getMasterGain().gain.value;
    gain.gain.value = vol;
    this.trackVolumes.set(index, volume);

    source.connect(gain);
    gain.connect(this.getMasterGain());
    source.start(0);

    this.sessions.set(index, { source, gain, buffer, startTime: performance.now(), loop });
    this.playbackOrder.push(index);
    this.playingStateCb?.(index, true);
    this.startProgressTracking();

    source.onended = () => {
      if (!loop) this.cleanup(index);
    };
  }

  stop(index: number): void {
    const session = this.sessions.get(index);
    if (!session) return;
    try { session.source.stop(); } catch {}
    this.cleanup(index);
  }

  private cleanup(index: number): void {
    this.sessions.delete(index);
    this.playbackOrder = this.playbackOrder.filter(i => i !== index);
    this.playingStateCb?.(index, false);
    if (this.currentAmbientIndex === index) this.currentAmbientIndex = null;
    if (this.sessions.size === 0) this.stopProgressTracking();
  }

  stopAll(): void {
    this.sessions.forEach((_, idx) => this.stop(idx));
    this.currentAmbientIndex = null;
  }

  isPlaying(index: number): boolean {
    return this.sessions.has(index);
  }

  getCurrentTime(index: number): number {
    const s = this.sessions.get(index);
    if (!s) return 0;
    const elapsed = (performance.now() - s.startTime) / 1000;
    if (s.loop) return elapsed % s.buffer.duration;
    return Math.min(elapsed, s.buffer.duration);
  }

  getDuration(index: number): number {
    return this.sessions.get(index)?.buffer.duration ?? 0;
  }

  getPlaybackOrder(): number[] {
    return [...this.playbackOrder];
  }

  setTrackVolume(index: number, volume: number): void {
    this.trackVolumes.set(index, volume);
    const s = this.sessions.get(index);
    if (s) {
      s.gain.gain.value = volume * this.getMasterGain().gain.value;
    }
  }

  async crossfadeAmbient(
    index: number,
    audioUrl: string,
    volume: number,
    masterVolume: number,
    fadeDuration = 1500,
  ): Promise<void> {
    const prevIdx = this.currentAmbientIndex;

    if (this.sessions.has(index) && prevIdx === index) {
      this.stop(index);
      this.currentAmbientIndex = null;
      return;
    }

    if (prevIdx !== null && prevIdx !== index) {
      const prev = this.sessions.get(prevIdx);
      if (prev) {
        prev.gain.gain.linearRampToValueAtTime(0, this.getCtx().currentTime + fadeDuration / 1000);
        setTimeout(() => {
          const s = this.sessions.get(prevIdx);
          if (s) {
            try { s.source.stop(); } catch {}
            this.cleanup(prevIdx);
          }
        }, fadeDuration + 50);
      }
    }

    if (!this.sessions.has(index)) {
      if (this.sessions.size >= MAX_CONCURRENT) {
        const nonAmbient = this.playbackOrder.find(i => {
          const s = this.sessions.get(i);
          return s && !s.loop;
        });
        if (nonAmbient !== undefined) this.stop(nonAmbient);
      }

      await this.resume();
      const buffer = await this.loadBuffer(audioUrl);
      const ctx = this.getCtx();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      source.connect(gain);
      gain.connect(this.getMasterGain());
      source.start(0);

      this.trackVolumes.set(index, volume);
      this.sessions.set(index, { source, gain, buffer, startTime: performance.now(), loop: true });
      this.playbackOrder.push(index);
      this.playingStateCb?.(index, true);
      this.startProgressTracking();
    }

    const session = this.sessions.get(index);
    if (session) {
      session.gain.gain.linearRampToValueAtTime(
        volume * masterVolume,
        this.getCtx().currentTime + fadeDuration / 1000,
      );
    }

    this.currentAmbientIndex = index;
  }

  onProgress(cb: (index: number, pct: number) => void): void {
    this.progressCb = cb;
  }

  onPlayingState(cb: (index: number, playing: boolean) => void): void {
    this.playingStateCb = cb;
  }

  private startProgressTracking(): void {
    if (this.animFrameId !== null) return;
    const tick = () => {
      this.sessions.forEach((s, idx) => {
        const elapsed = (performance.now() - s.startTime) / 1000;
        const currentTime = s.loop ? elapsed % s.buffer.duration : Math.min(elapsed, s.buffer.duration);
        this.progressCb?.(idx, (currentTime / s.buffer.duration) * 100);
      });
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopProgressTracking(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy(): void {
    this.stopAll();
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
    this.bufferCache.clear();
    this.trackVolumes.clear();
  }
}

export const audioEngine = new AudioEngine();
