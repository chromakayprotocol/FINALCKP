import { describe, it, expect } from 'vitest';
import { buildSystemBlocks, VMA_PERSONA } from './vmaContext.js';

describe('buildSystemBlocks', () => {
  it('puts the cache_control breakpoint on the stable persona block, not the per-user one', () => {
    const blocks = buildSystemBlocks({ activeModuleId: 'hermetic-hall/mentalism' });
    expect(blocks[0].text).toBe(VMA_PERSONA);
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(blocks[1].cache_control).toBeUndefined();
    expect(blocks[1].text).toContain('hermetic-hall/mentalism');
  });

  it('never puts user-specific data in the cached block', () => {
    const blocks = buildSystemBlocks({ retainedConcepts: ['shadow-work'] });
    expect(blocks[0].text).not.toContain('shadow-work');
  });
});
