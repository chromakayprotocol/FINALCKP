import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const playTrack = vi.fn();
vi.mock('../../../../context/audioprovider', () => ({
  useAudio: () => ({ playTrack }),
}));

const resolveActDefaultTrack = vi.fn();
vi.mock('./actDefaultTracks', () => ({
  resolveActDefaultTrack: (...args) => resolveActDefaultTrack(...args),
}));

import { usePillarAudio } from './usePillarAudio';

afterEach(() => {
  vi.clearAllMocks();
});

describe('usePillarAudio', () => {
  test('does nothing on render -- audio only starts from a real user gesture', () => {
    renderHook(() => usePillarAudio(2));
    expect(playTrack).not.toHaveBeenCalled();
    expect(resolveActDefaultTrack).not.toHaveBeenCalled();
  });

  test('start() resolves the given Act\'s default track and plays it', async () => {
    resolveActDefaultTrack.mockResolvedValue({ id: 't1', title: 'H2O', audio_url: 'https://example.com/h2o.mp3' });
    const { result } = renderHook(() => usePillarAudio(2));

    await act(async () => {
      await result.current.start();
    });

    expect(resolveActDefaultTrack).toHaveBeenCalledWith(2);
    expect(playTrack).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'H2O', audio_url: 'https://example.com/h2o.mp3' }),
    );
  });

  test('start() never calls playTrack when the Act has no default track yet (Act One, Act Four today)', async () => {
    resolveActDefaultTrack.mockResolvedValue(null);
    const { result } = renderHook(() => usePillarAudio(1));

    await act(async () => {
      await result.current.start();
    });

    expect(resolveActDefaultTrack).toHaveBeenCalledWith(1);
    expect(playTrack).not.toHaveBeenCalled();
  });

  test('exposes the interface tone cues directly', () => {
    const { result } = renderHook(() => usePillarAudio(2));
    expect(typeof result.current.tones.playSelect).toBe('function');
    expect(typeof result.current.tones.playTransition).toBe('function');
    expect(typeof result.current.tones.playReveal).toBe('function');
    expect(typeof result.current.tones.playComplete).toBe('function');
  });

  test('stop() and unmount are safe even without a prior start()', () => {
    const { result, unmount } = renderHook(() => usePillarAudio(2));
    expect(() => result.current.stop()).not.toThrow();
    expect(() => unmount()).not.toThrow();
  });
});
