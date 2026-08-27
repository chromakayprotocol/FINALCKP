import { describe, expect, it, vi } from 'vitest';
import { createSovereignEventBus } from './SovereignEventBus';

describe('SovereignEventBus', () => {
  it('delivers an emitted event only to subscribers of that type', () => {
    const bus = createSovereignEventBus();
    const moduleEntered = vi.fn();
    const stepStarted = vi.fn();

    bus.subscribe('MODULE_ENTERED', moduleEntered);
    bus.subscribe('STEP_STARTED', stepStarted);
    bus.emit('MODULE_ENTERED', { moduleId: 'mentalism' });

    expect(moduleEntered).toHaveBeenCalledTimes(1);
    expect(moduleEntered).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MODULE_ENTERED', payload: { moduleId: 'mentalism' } }),
    );
    expect(stepStarted).not.toHaveBeenCalled();
  });

  it('delivers every event to a wildcard subscriber', () => {
    const bus = createSovereignEventBus();
    const all = vi.fn();
    bus.subscribeAll(all);

    bus.emit('MODULE_ENTERED', {});
    bus.emit('STEP_STARTED', {});

    expect(all).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe stops further delivery without affecting other subscribers', () => {
    const bus = createSovereignEventBus();
    const a = vi.fn();
    const b = vi.fn();
    const unsubscribeA = bus.subscribe('X', a);
    bus.subscribe('X', b);

    bus.emit('X', {});
    unsubscribeA();
    bus.emit('X', {});

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it("a throwing listener doesn't block other listeners or the emit call", () => {
    const bus = createSovereignEventBus();
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    bus.subscribe('X', bad);
    bus.subscribe('X', good);

    expect(() => bus.emit('X', {})).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('records emitted events in history, oldest first', () => {
    const bus = createSovereignEventBus();
    bus.emit('A', { n: 1 });
    bus.emit('B', { n: 2 });

    const history = bus.getHistory();
    expect(history.map((event) => event.type)).toEqual(['A', 'B']);
  });

  it('getHistory(limit) returns only the most recent N events', () => {
    const bus = createSovereignEventBus();
    bus.emit('A', {});
    bus.emit('B', {});
    bus.emit('C', {});

    expect(bus.getHistory(2).map((event) => event.type)).toEqual(['B', 'C']);
  });

  it('caps retained history at historyLimit', () => {
    const bus = createSovereignEventBus({ historyLimit: 3 });
    bus.emit('A', {});
    bus.emit('B', {});
    bus.emit('C', {});
    bus.emit('D', {});

    expect(bus.getHistory().map((event) => event.type)).toEqual(['B', 'C', 'D']);
  });

  it('clearHistory empties the history without affecting subscribers', () => {
    const bus = createSovereignEventBus();
    const handler = vi.fn();
    bus.subscribeAll(handler);
    bus.emit('A', {});
    bus.clearHistory();

    expect(bus.getHistory()).toEqual([]);
    bus.emit('B', {});
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
