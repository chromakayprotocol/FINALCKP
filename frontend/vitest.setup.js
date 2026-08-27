import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/* This repo's test files import `describe`/`it`/`afterEach` explicitly
   from 'vitest' rather than relying on injected globals (test.globals is
   deliberately left off), so @testing-library/react's own auto-cleanup
   -- which only self-registers when it detects a *global* afterEach --
   never fires. Registering it here once, centrally, is the standard
   fix for exactly this setup (globals: false + RTL): without it, DOM
   nodes from one test in a file leak into the next and produce
   "multiple elements found" failures that have nothing to do with the
   component under test. */
afterEach(() => {
  cleanup();
});

/* jsdom implements neither matchMedia, ResizeObserver, nor a real 2D
   canvas context -- several Reclamation University modules use all
   three purely for decorative canvas art (ResonanceField, SpectrumTuner,
   etc.) alongside the real, testable Sovereign Runtime wiring in the
   same components. Without these, mounting those components at all
   throws inside a useEffect before a single assertion runs. These are
   permissive no-op stubs (matches: false, every canvas call and every
   property assignment silently accepted) -- enough for the component to
   render and drive real state, not an attempt to actually verify the
   canvas drawing itself. */
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = () =>
      new Proxy(
        {},
        {
          get: (target, prop) => (prop in target ? target[prop] : () => {}),
          set: (target, prop, value) => {
            target[prop] = value;
            return true;
          },
        }
      );
  }
}
