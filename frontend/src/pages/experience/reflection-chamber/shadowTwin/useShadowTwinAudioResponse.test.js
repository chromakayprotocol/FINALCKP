import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseAudio = vi.fn();
vi.mock('../../../../context/audioprovider', () => ({
  useAudio: () => mockUseAudio(),
}));

import { useShadowTwinAudioResponse } from './useShadowTwinAudioResponse';

describe('useShadowTwinAudioResponse', () => {
  it('reports inactive with no provider mounted', () => {
    mockUseAudio.mockReturnValue(null);
    const { result } = renderHook(() => useShadowTwinAudioResponse());
    expect(result.current).toEqual({ isActive: false, trackProgress: 0 });
  });

  it('reports inactive with a provider but nothing playing', () => {
    mockUseAudio.mockReturnValue({ isPlaying: false, currentTime: 0, duration: 0 });
    const { result } = renderHook(() => useShadowTwinAudioResponse());
    expect(result.current.isActive).toBe(false);
  });

  it('reports progress as a 0..1 fraction while playing', () => {
    mockUseAudio.mockReturnValue({ isPlaying: true, currentTime: 30, duration: 120 });
    const { result } = renderHook(() => useShadowTwinAudioResponse());
    expect(result.current).toEqual({ isActive: true, trackProgress: 0.25 });
  });

  it('clamps progress to 1 rather than overshooting', () => {
    mockUseAudio.mockReturnValue({ isPlaying: true, currentTime: 999, duration: 120 });
    const { result } = renderHook(() => useShadowTwinAudioResponse());
    expect(result.current.trackProgress).toBe(1);
  });
});
