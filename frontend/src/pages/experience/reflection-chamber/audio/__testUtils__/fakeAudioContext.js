/**
 * A minimal Web Audio API stand-in for tests. jsdom has no real
 * AudioContext, so this exercises the actual node graph our audio modules
 * build (which nodes get created, connected, started, stopped, and what
 * gets scheduled on their AudioParams) without needing a real browser.
 */
class FakeParam {
  constructor(value = 0) {
    this.value = value;
    this.calls = [];
  }
  setValueAtTime(value, time) {
    this.calls.push(['setValueAtTime', value, time]);
    this.value = value;
    return this;
  }
  linearRampToValueAtTime(value, time) {
    this.calls.push(['linearRampToValueAtTime', value, time]);
    this.value = value;
    return this;
  }
  exponentialRampToValueAtTime(value, time) {
    this.calls.push(['exponentialRampToValueAtTime', value, time]);
    this.value = value;
    return this;
  }
  cancelScheduledValues(time) {
    this.calls.push(['cancelScheduledValues', time]);
    return this;
  }
}

class FakeNode {
  constructor() {
    this.connectedTo = [];
  }
  connect(destination) {
    this.connectedTo.push(destination);
    return destination;
  }
}

class FakeBufferSource extends FakeNode {
  constructor() {
    super();
    this.loop = false;
    this.buffer = null;
    this.started = false;
    this.stopped = false;
    this.stopAt = null;
  }
  start() {
    this.started = true;
  }
  stop(time) {
    this.stopped = true;
    this.stopAt = time;
  }
}

class FakeOscillator extends FakeNode {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = new FakeParam(440);
    this.started = false;
    this.stopped = false;
  }
  start(time) {
    this.started = true;
    this.startAt = time;
  }
  stop(time) {
    this.stopped = true;
    this.stopAt = time;
  }
}

class FakeGain extends FakeNode {
  constructor() {
    super();
    this.gain = new FakeParam(1);
  }
}

class FakeBiquadFilter extends FakeNode {
  constructor() {
    super();
    this.type = 'lowpass';
    this.frequency = new FakeParam(350);
    this.Q = new FakeParam(1);
  }
}

export class FakeAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = new FakeNode();
    this.created = { bufferSources: [], filters: [], oscillators: [], gains: [], buffers: [] };
  }
  createBuffer(numberOfChannels, length, sampleRate) {
    const data = new Float32Array(length);
    const buffer = {
      numberOfChannels,
      length,
      sampleRate,
      getChannelData: () => data,
    };
    this.created.buffers.push(buffer);
    return buffer;
  }
  createBufferSource() {
    const node = new FakeBufferSource();
    this.created.bufferSources.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = new FakeBiquadFilter();
    this.created.filters.push(node);
    return node;
  }
  createOscillator() {
    const node = new FakeOscillator();
    this.created.oscillators.push(node);
    return node;
  }
  createGain() {
    const node = new FakeGain();
    this.created.gains.push(node);
    return node;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}
