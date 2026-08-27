function createEventId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** @returns {{id: string, type: string, payload: Object, timestamp: string}} */
export function createSovereignEvent(type, payload = {}) {
  return { id: createEventId(), type, payload, timestamp: new Date().toISOString() };
}
