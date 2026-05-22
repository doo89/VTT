import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock audio-storage before importing engine
vi.mock('../audio-storage', () => ({
  getAudio: vi.fn(),
  isIdbUrl: vi.fn((url: string) => url.startsWith('idb://')),
  idbUrlToKey: vi.fn((url: string) => url.replace('idb://', '')),
  makeIdbKey: vi.fn((index: number) => `sound-${index}`),
}));

// Mock fetch for data URLs
const mockArrayBuffer = new ArrayBuffer(8);
globalThis.fetch = vi.fn(() =>
  Promise.resolve({ arrayBuffer: () => Promise.resolve(mockArrayBuffer) })
) as any;

// Mock AudioContext + AudioBuffer
class MockAudioBuffer {
  duration = 10;
  getChannelData() { return new Float32Array(0); }
}

class MockGainNode {
  gain = { value: 1, linearRampToValueAtTime: vi.fn() };
  connect() { return this; }
}

class MockBufferSource {
  buffer: any = null;
  loop = false;
  onended: (() => void) | null = null;
  start() { setTimeout(() => this.onended?.(), 0); }
  stop() { this.onended?.(); }
  connect() { return new MockGainNode(); }
}

const mockDecodeAudioData = async () => new MockAudioBuffer();

class MockAudioContext {
  state = 'running';
  resume = vi.fn();
  close = vi.fn();
  createGain() { return new MockGainNode(); }
  createBufferSource() { return new MockBufferSource(); }
  decodeAudioData = mockDecodeAudioData;
  currentTime = 0;
  destination = {};
}

let audioEngine: any;

beforeEach(async () => {
  (globalThis as any).AudioContext = MockAudioContext;
  const mod = await import('../audio-engine');
  audioEngine = mod.audioEngine;
  audioEngine.destroy();
});

afterEach(() => {
  audioEngine.destroy();
});

describe('AudioEngine', () => {
  it('should export a singleton instance', () => {
    expect(audioEngine).toBeDefined();
    expect(typeof audioEngine.setMasterVolume).toBe('function');
  });

  it('should set and get master volume', () => {
    audioEngine.setMasterVolume(0.5);
    expect(audioEngine.getMasterVolume()).toBe(0.5);
    audioEngine.setMasterVolume(1);
    expect(audioEngine.getMasterVolume()).toBe(1);
  });

  it('should load a buffer and cache it', async () => {
    const buf = await audioEngine.loadBuffer('data:audio/mpeg;base64,AAAA');
    expect(buf).toBeDefined();
    expect(audioEngine.hasBuffer('data:audio/mpeg;base64,AAAA')).toBe(true);

    const buf2 = await audioEngine.loadBuffer('data:audio/mpeg;base64,AAAA');
    expect(buf2).toBe(buf);
  });

  it('should load different URLs as separate buffers', async () => {
    const a = await audioEngine.loadBuffer('data:audio/mpeg;base64,AAAA');
    const b = await audioEngine.loadBuffer('data:audio/mpeg;base64,BBBB');
    expect(a).not.toBe(b);
  });

  it('should not be playing before any sound is played', () => {
    expect(audioEngine.isPlaying(0)).toBe(false);
    expect(audioEngine.getPlaybackOrder()).toEqual([]);
  });

  it('should call onPlayingState callback when play starts', async () => {
    const cb = vi.fn();
    audioEngine.onPlayingState(cb);

    await audioEngine.play(0, 'data:audio/mpeg;base64,AAAA', 1, false);
    expect(cb).toHaveBeenCalledWith(0, true);
  });

  it('should toggle play/stop when play is called twice', async () => {
    const cb = vi.fn();
    audioEngine.onPlayingState(cb);

    await audioEngine.play(0, 'data:audio/mpeg;base64,AAAA', 1, false);
    expect(cb).toHaveBeenCalledWith(0, true);
    cb.mockClear();

    await audioEngine.play(0, 'data:audio/mpeg;base64,AAAA', 1, false);
    expect(cb).toHaveBeenCalledWith(0, false);
  });

  it('should enforce MAX_CONCURRENT pool limit of 4 voices', async () => {
    const cb = vi.fn();
    audioEngine.onPlayingState(cb);

    await audioEngine.play(0, 'data:audio/mpeg;base64,A', 1, false);
    await audioEngine.play(1, 'data:audio/mpeg;base64,B', 1, false);
    await audioEngine.play(2, 'data:audio/mpeg;base64,C', 1, false);
    await audioEngine.play(3, 'data:audio/mpeg;base64,D', 1, false);

    expect(audioEngine.isPlaying(0)).toBe(true);
    expect(audioEngine.isPlaying(1)).toBe(true);
    expect(audioEngine.isPlaying(2)).toBe(true);
    expect(audioEngine.isPlaying(3)).toBe(true);

    await audioEngine.play(4, 'data:audio/mpeg;base64,E', 1, false);
    expect(audioEngine.isPlaying(0)).toBe(false);
    expect(audioEngine.isPlaying(4)).toBe(true);
  });

  it('should set track volume independently', async () => {
    await audioEngine.play(0, 'data:audio/mpeg;base64,A', 1, false);
    audioEngine.setTrackVolume(0, 0.3);
    expect(audioEngine['trackVolumes'].get(0)).toBe(0.3);
  });

  it('should stop all sounds', async () => {
    await audioEngine.play(0, 'data:audio/mpeg;base64,A', 1, false);
    await audioEngine.play(1, 'data:audio/mpeg;base64,B', 1, false);

    audioEngine.stopAll();
    expect(audioEngine.isPlaying(0)).toBe(false);
    expect(audioEngine.isPlaying(1)).toBe(false);
    expect(audioEngine.getPlaybackOrder()).toEqual([]);
  });

  it('should fire onProgress callback during playback', async () => {
    const cb = vi.fn();
    audioEngine.onProgress(cb);

    await audioEngine.play(0, 'data:audio/mpeg;base64,A', 1, false);
    expect(audioEngine['progressCb']).toBe(cb);
  });

  it('should provide current time and duration', async () => {
    await audioEngine.play(0, 'data:audio/mpeg;base64,A', 1, false);
    expect(audioEngine.getDuration(0)).toBe(10);
    expect(typeof audioEngine.getCurrentTime(0)).toBe('number');
  });

  it('should get playback order', async () => {
    await audioEngine.play(3, 'data:audio/mpeg;base64,A', 1, false);
    await audioEngine.play(1, 'data:audio/mpeg;base64,B', 1, false);
    await audioEngine.play(2, 'data:audio/mpeg;base64,C', 1, false);
    expect(audioEngine.getPlaybackOrder()).toEqual([3, 1, 2]);
  });
});
