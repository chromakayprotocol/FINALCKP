export const selectSession = (state) => state.session;
export const selectIdentity = (state) => state.identity;
export const selectCurriculum = (state) => state.curriculum;
export const selectModule = (state, moduleId) => state.curriculum.modules[moduleId] ?? null;

export const selectActiveModule = (state) => {
  const { activeModuleId, modules } = state.curriculum;
  return activeModuleId ? (modules[activeModuleId] ?? null) : null;
};

export const selectMedia = (state) => state.media;
export const selectReflection = (state) => state.reflection;

export const selectReflectionEntry = (state, moduleId, promptId) =>
  state.reflection.entries[`${moduleId}:${promptId}`] ?? null;

export const selectConcepts = (state) => state.concepts;
export const selectSynthesis = (state) => state.synthesis;
export const selectArtifact = (state) => state.artifact;
