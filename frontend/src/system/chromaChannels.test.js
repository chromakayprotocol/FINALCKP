import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';
import {
  CHANNEL_IDS,
  CHROMA_CHANNELS,
  PROTOCOL_SURFACES,
  SURFACE_STATUS,
  channelStyle,
  findSurface,
  liveSurfaces,
  resolveChannel,
  surfacesForChannel,
} from './chromaChannels';

/* The chassis stylesheet, read as text.
   Not `import ... from './chromaFrame.css?raw'`: vitest runs with CSS
   processing off, so every CSS import — ?raw included — resolves to an empty
   string and the drift assertions below would pass vacuously against ''.
   Not `import.meta.url` either: under vitest that is not a file URL. So the
   file is located by walking up from the working directory, which makes the
   suite indifferent to whether it was invoked from the repo root, from
   frontend/, or from frontend/src/. */
const CHASSIS = (() => {
  const suffixes = ['src/system/chromaFrame.css', 'frontend/src/system/chromaFrame.css'];
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    for (const suffix of suffixes) {
      const candidate = path.join(dir, suffix);
      if (existsSync(candidate)) return candidate;
    }
    dir = path.dirname(dir);
  }
  throw new Error('chromaFrame.css not found from ' + process.cwd());
})();

const CSS = readFileSync(CHASSIS, 'utf8');

/** WCAG relative luminance, sRGB. */
function luminance(hex) {
  const channel = (value) => {
    const n = value / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const OBSIDIAN = '#08080B';

describe('the channel registry', () => {
  test('every channel carries a full key set', () => {
    for (const id of CHANNEL_IDS) {
      const channel = CHROMA_CHANNELS[id];
      expect(channel.id).toBe(id);
      expect(channel.key).toMatch(/^#[0-9A-F]{6}$/i);
      expect(channel.keyBright).toMatch(/^#[0-9A-F]{6}$/i);
      expect(channel.keyDim).toMatch(/^#[0-9A-F]{6}$/i);
      expect(channel.wash).toMatch(/^rgba\(/);
      expect(channel.label).toBeTruthy();
      expect(channel.domain).toBeTruthy();
    }
  });

  /* The rule the whole ink system rests on: --ckp-key paints borders and
     fills, --ckp-key-bright paints TEXT. If a bright value ever drops below
     4.5:1 on the obsidian ground, accent text stops being readable on every
     screen at once — which is exactly the failure a shared frame turns from
     a local mistake into a global one. */
  test('every key-bright clears 4.5:1 on the obsidian ground', () => {
    for (const id of CHANNEL_IDS) {
      expect(contrast(CHROMA_CHANNELS[id].keyBright, OBSIDIAN)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('key-dim is genuinely dimmer than key, which is dimmer than key-bright', () => {
    for (const id of CHANNEL_IDS) {
      const { key, keyBright, keyDim } = CHROMA_CHANNELS[id];
      expect(luminance(keyDim)).toBeLessThan(luminance(key));
      expect(luminance(key)).toBeLessThan(luminance(keyBright));
    }
  });

  test('no two channels share a key — a channel is an identity, not a shade', () => {
    const keys = CHANNEL_IDS.map((id) => CHROMA_CHANNELS[id].key.toUpperCase());
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('an unknown channel resolves to the system voice instead of throwing', () => {
    expect(resolveChannel('not-a-channel')).toBe(CHROMA_CHANNELS.argent);
    expect(resolveChannel(undefined)).toBe(CHROMA_CHANNELS.argent);
  });

  test('channelStyle emits the four custom properties the chassis reads', () => {
    expect(channelStyle('crimson')).toEqual({
      '--ckp-key': CHROMA_CHANNELS.crimson.key,
      '--ckp-key-bright': CHROMA_CHANNELS.crimson.keyBright,
      '--ckp-key-dim': CHROMA_CHANNELS.crimson.keyDim,
      '--ckp-key-wash': CHROMA_CHANNELS.crimson.wash,
    });
  });
});

describe('the registry and the stylesheet stay in lockstep', () => {
  /* chromaFrame.css restates every key as --ckp-ch-<id> so a screen can
     depict a channel other than its own. Two copies of the same value is a
     drift risk, and drift between these two files is exactly the failure
     mode this whole architecture exists to end — so it is asserted rather
     than trusted. */
  test('every channel key appears in the standing CSS palette', () => {
    for (const id of CHANNEL_IDS) {
      const { key, keyBright } = CHROMA_CHANNELS[id];
      expect(CSS).toContain(`--ckp-ch-${id}: ${key};`);
      expect(CSS).toContain(`--ckp-ch-${id}-bright: ${keyBright};`);
    }
  });

  test('every channel has a data-channel declaration block', () => {
    for (const id of CHANNEL_IDS) {
      expect(CSS).toContain(`[data-channel='${id}']`);
    }
  });

  test('the stylesheet declares no channel the registry does not know about', () => {
    const declared = [...CSS.matchAll(/\[data-channel='([a-z]+)'\]/g)].map((match) => match[1]);
    for (const id of new Set(declared)) {
      expect(CHANNEL_IDS).toContain(id);
    }
  });
});

describe('the protocol surface map', () => {
  test('surface ids are unique', () => {
    const ids = PROTOCOL_SURFACES.map((surface) => surface.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every surface transmits on a real channel', () => {
    for (const surface of PROTOCOL_SURFACES) {
      expect(CHANNEL_IDS).toContain(surface.channel);
    }
  });

  /* The registry is a map of what EXISTS, not of what is planned. A surface
     that claims to be live has to be reachable; one that is sealed or vacant
     must not pretend to have a destination. */
  test('live surfaces have a route and non-live surfaces do not', () => {
    for (const surface of PROTOCOL_SURFACES) {
      if (surface.status === SURFACE_STATUS.LIVE) {
        expect(surface.route).toMatch(/^\//);
      } else {
        expect(surface.route).toBeNull();
      }
    }
  });

  test('liveSurfaces returns only reachable surfaces', () => {
    const live = liveSurfaces();
    expect(live.length).toBeGreaterThan(0);
    for (const surface of live) {
      expect(surface.status).toBe(SURFACE_STATUS.LIVE);
      expect(surface.route).toBeTruthy();
    }
    expect(live.some((surface) => surface.id === 'paywall')).toBe(false);
  });

  /* The removed FastAPI surfaces are listed as vacant on purpose. A registry
     that silently omitted them would read as a complete system. */
  test('the surfaces the backend removal took with it are recorded as vacant', () => {
    for (const id of ['paywall', 'protocol-chat']) {
      expect(findSurface(id)?.status).toBe(SURFACE_STATUS.VACANT);
    }
  });

  test('surfacesForChannel filters by channel', () => {
    const indigo = surfacesForChannel('indigo');
    expect(indigo.map((surface) => surface.id)).toContain('university-nexus');
    expect(indigo.map((surface) => surface.id)).toContain('hermetic-hall');
    expect(indigo.every((surface) => surface.channel === 'indigo')).toBe(true);
  });

  /* Gold is Act IV's alone. It spent one revision doing double duty as the
     University's key as well, which is the collision this asserts against:
     nothing outside the Crucible Code may claim aurum. */
  test('aurum belongs to the Crucible Code and nothing else', () => {
    expect(surfacesForChannel('aurum').map((surface) => surface.id)).toEqual([
      'act-four',
      'crucible-protocol',
    ]);
  });

  /* Indigo and violet are one family split by shade, on purpose — the
     Hermetic Hall teaches by sight, Sonic Surfaces by sound. Kinship is the
     intent; the split is what keeps them legible as two places. Converging
     them (or pulling them apart into unrelated hues) both break it. */
  test('the teaching pair stays kin but stays distinguishable', () => {
    const hue = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const span = max - min;
      let h = 0;
      if (span === 0) h = 0;
      else if (max === r) h = ((g - b) / span) % 6;
      else if (max === g) h = (b - r) / span + 2;
      else h = (r - g) / span + 4;
      return ((h * 60) % 360 + 360) % 360;
    };

    const gap = Math.abs(hue(CHROMA_CHANNELS.indigo.key) - hue(CHROMA_CHANNELS.violet.key));
    expect(gap).toBeGreaterThan(15); // far enough apart to tell which room you are in
    expect(gap).toBeLessThan(60); // close enough to still read as one family

    // Indigo runs blue-cool, violet runs hot. Do not let them cross over.
    expect(hue(CHROMA_CHANNELS.indigo.key)).toBeLessThan(hue(CHROMA_CHANNELS.violet.key));
  });

  test('findSurface returns null rather than undefined for a miss', () => {
    expect(findSurface('nope')).toBeNull();
  });
});
