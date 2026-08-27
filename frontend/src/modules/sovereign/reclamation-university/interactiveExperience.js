export const INTERACTION_MODES = Object.freeze({
  CHOICE: "choice",
  REFLECTION: "reflection",
  CLASSIFICATION: "classification",
  SEQUENCE: "sequence",
  KNOWLEDGE_LOCK: "knowledge-lock",
});

export function createInteraction(mode, config = {}) {
  return { mode, ...config };
}

export function isInteractionComplete(interaction, value) {
  if (!interaction) return false;
  switch (interaction.mode) {
    case INTERACTION_MODES.CHOICE:
      return Boolean(value);
    case INTERACTION_MODES.REFLECTION:
      return Boolean(String(value || "").trim());
    case INTERACTION_MODES.CLASSIFICATION:
      return (interaction.items || []).every((item) => Boolean(value?.[item.id]));
    case INTERACTION_MODES.SEQUENCE:
      return Array.isArray(value) && value.length === (interaction.items || []).length;
    case INTERACTION_MODES.KNOWLEDGE_LOCK:
      return String(value || "").trim().toLowerCase() === String(interaction.answer || "").trim().toLowerCase();
    default:
      return false;
  }
}
