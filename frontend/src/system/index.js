/* ============================================================================
   THE CHROMA FRAME
   ----------------------------------------------------------------------------
   The Protocol's central architecture. See docs/CENTRAL_ARCHITECTURE.md for
   the spec, and /system/chroma-frame (ChromaFrameReference.jsx) for the
   living version of it you can look at.
   ========================================================================= */

export { default as ChromaFrame, FramePanel } from './ChromaFrame';
export { FrameRail, FrameDock, FrameReadout, FrameMeter, FrameAction, FrameExit } from './FrameRail';

export {
  CHROMA_CHANNELS,
  CHANNEL_IDS,
  PROTOCOL_SURFACES,
  SURFACE_STATUS,
  channelStyle,
  findSurface,
  liveSurfaces,
  resolveChannel,
  surfacesForChannel,
} from './chromaChannels';

export {
  READOUT_STATE,
  NON_VALUE_GLYPH,
  meterFill,
  normalizeState,
  readoutAriaText,
  resolvePercent,
  resolveReadout,
} from './frameReadout';
