/**
 * Canonical Reclamation University Nexus state model.
 *
 * ONE authoritative projection of seeker state for the Nexus dashboard.
 * Everything the Nexus displays as personalized learner progress is derived
 * here, from rows that a real writer in this app actually persists. Nothing
 * in this file invents a percentage, and nothing here falls back to a
 * display placeholder when production state is missing — a missing value is
 * reported as `null` with an explicit status so the UI can say so out loud.
 *
 *     Supabase rows -> deriveNexusState() -> NexusState -> UniversityNexus
 *
 * ---------------------------------------------------------------------------
 * Where learner state actually lives (audited, not assumed)
 * ---------------------------------------------------------------------------
 * Two tables persist Reclamation University learner state today, and which
 * one a module writes to is decided by which engine renders it:
 *
 * 1. `rec_uni_user_progress` (supabase/migrations/20260718050923_*.sql),
 *    written by useReclamationModuleProgress() -> saveUserProgress() with
 *    `module_id` = the curriculum registry's `module.id`
 *    (e.g. `module-fractured-veil`). This is the store behind
 *    ReclamationModuleEngine, i.e. every non-Hermetic faculty — which is
 *    exactly the Fracture Protocol's `foundations` faculty.
 *
 * 2. `sovereign_module_state` (supabase/migrations/20260822051703_*.sql),
 *    written by the Sovereign Runtime's autosave with `module_id` =
 *    `hermetic-hall/<slug>` or `reflection-chamber/<pillar>`. All seven
 *    Hermetic Hall principles and all five Reflection Chamber pillars moved
 *    onto the runtime in the Sovereign OS migration's Phase 8/15 and write
 *    here, not to `rec_uni_user_progress`.
 *
 * This module reads both. That is not a second persistence model — both
 * stores already exist and already have writers; reading only one of them
 * is what produced a permanently-0% Hermetic Hall (see the
 * HERMETIC_HALL_MODULES note below).
 */

import { getFacultyBySlug } from '../../data/reclamationUniversityCurriculum';
import { HERMETIC_HALL_FACULTY } from '../../data/hermeticHallCurriculum';
import {
  REFLECTION_CHAMBER_PILLAR_IDS,
  reflectionChamberModuleId,
} from '../../sovereign/reflectionChamber/mirrorClarity';

/** Which Supabase table a tracked module's progress row comes from. */
export const PROGRESS_SOURCE = Object.freeze({
  REC_UNI: 'rec_uni_user_progress',
  SOVEREIGN: 'sovereign_module_state',
});

/** Per-protocol / per-track completion status. */
export const NEXUS_STATUS = Object.freeze({
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  /** No production learner experience backs this node yet. */
  UNAVAILABLE: 'unavailable',
  /** Backed by a real experience, but this seeker's state could not be read. */
  UNKNOWN: 'unknown',
});

/**
 * Dock-metric status. `ok` is the only status that carries a number; every
 * other status means the UI must render an explicit non-value rather than a
 * percentage.
 */
export const NEXUS_METRIC_STATUS = Object.freeze({
  OK: 'ok',
  /** No backing subsystem exists to derive this metric from. */
  UNAVAILABLE: 'unavailable',
  /** A real metric whose value could not be read for this seeker. */
  UNKNOWN: 'unknown',
});

/** Top-level data state for the whole projection. */
export const NEXUS_DATA_STATE = Object.freeze({
  LOADING: 'loading',
  SIGNED_OUT: 'signed_out',
  READY: 'ready',
  ERROR: 'error',
});

/**
 * The seven Hermetic principles, in Hall order, with every module id under
 * which a completion for that principle has ever been persisted.
 *
 * `sovereignId` is the live writer (the six Sovereign Runtime experiences
 * plus HermeticSuppliedModuleExperience all use `hermetic-hall/<slug>`).
 * `recUniIds` are the ids HermeticCurriculumModule would write through
 * useReclamationModuleProgress(module.id) — kept so a legacy row still
 * counts rather than being silently discarded.
 *
 * The previous Nexus hook queried `rec_uni_user_progress` for the bare
 * slugs (`mentalism`, ...), which no writer in this repository has ever
 * produced. That query could only ever return zero rows, so the Hall
 * percentage it derived was structurally pinned to 0% for every seeker.
 */
export const HERMETIC_HALL_MODULES = Object.freeze(
  HERMETIC_HALL_FACULTY.modules.map((module) =>
    Object.freeze({
      key: `hermetic-hall/${module.slug}`,
      slug: module.slug,
      title: module.title,
      sovereignId: `hermetic-hall/${module.slug}`,
      recUniIds: Object.freeze([module.id, module.slug]),
    })
  )
);

/**
 * Fracture Protocol modules: the `foundations` faculty, read straight off
 * the curriculum registry rather than restated here, so adding a faculty
 * module cannot silently drift the Nexus denominator.
 */
function fractureModules() {
  const faculty = getFacultyBySlug('foundations');
  return (faculty?.modules ?? []).map((module) =>
    Object.freeze({
      key: module.id,
      slug: module.slug,
      title: module.title,
      recUniIds: Object.freeze([module.id]),
    })
  );
}

/** Reflection Protocol modules: the five Reflection Chamber pillars. */
function reflectionModules() {
  return REFLECTION_CHAMBER_PILLAR_IDS.map((pillarId) =>
    Object.freeze({
      key: reflectionChamberModuleId(pillarId),
      slug: pillarId,
      title: pillarId,
      sovereignId: reflectionChamberModuleId(pillarId),
    })
  );
}

/**
 * The explicit protocol -> module mapping the Nexus derives every protocol
 * percentage from. Crucible and Reclamation intentionally have no modules:
 * no production learner experience exists for them, so they resolve to
 * `available: false` / `progress: null` rather than to an invented number.
 */
export const PROTOCOL_MODULE_MAP = Object.freeze({
  fracture: Object.freeze(fractureModules()),
  reflection: Object.freeze(reflectionModules()),
  crucible: Object.freeze([]),
  reclamation: Object.freeze([]),
});

/** Protocols whose modules count toward the Knowledge Index. */
const KNOWLEDGE_INDEX_PROTOCOLS = Object.freeze(['fracture', 'reflection']);

function isCompletedRecUniRow(row) {
  if (!row) return false;
  return row.status === 'completed' || Boolean(row.completed_at);
}

function isCompletedSovereignRow(row) {
  return row?.status === 'completed';
}

function isStartedRecUniRow(row) {
  if (!row) return false;
  return row.status === 'in_progress' || Boolean(row.started_at);
}

function isStartedSovereignRow(row) {
  if (!row) return false;
  return row.status === 'in_progress' || Boolean(row.started_at);
}

function indexRows(rows) {
  const byId = new Map();
  for (const row of rows ?? []) {
    if (row?.module_id) byId.set(row.module_id, row);
  }
  return byId;
}

/**
 * Resolves one tracked module against both row sets. A module counts as
 * complete if ANY store that legitimately writes it says so.
 */
function resolveModule(trackedModule, recUniById, sovereignById) {
  const recUniRows = (trackedModule.recUniIds ?? [])
    .map((id) => recUniById.get(id))
    .filter(Boolean);
  const sovereignRow = trackedModule.sovereignId
    ? sovereignById.get(trackedModule.sovereignId)
    : undefined;

  const completed =
    recUniRows.some(isCompletedRecUniRow) || isCompletedSovereignRow(sovereignRow);
  const started =
    completed ||
    recUniRows.some(isStartedRecUniRow) ||
    isStartedSovereignRow(sovereignRow);

  return { key: trackedModule.key, slug: trackedModule.slug, completed, started };
}

/** 0 -> not_started, 1..99 -> in_progress, 100 -> completed. */
export function statusForProgress(progress) {
  if (progress === null || progress === undefined) return NEXUS_STATUS.UNKNOWN;
  if (progress >= 100) return NEXUS_STATUS.COMPLETED;
  if (progress > 0) return NEXUS_STATUS.IN_PROGRESS;
  return NEXUS_STATUS.NOT_STARTED;
}

/** Deterministic completed/total percentage. Empty denominators stay null. */
export function completionPercent(completedCount, totalCount) {
  if (!totalCount) return null;
  return Math.round((completedCount / totalCount) * 100);
}

function unresolvedTrack(totalCount, available, status) {
  return {
    progress: null,
    status: available ? status : NEXUS_STATUS.UNAVAILABLE,
    available,
    completedCount: null,
    totalCount,
  };
}

function unresolvedMetric(status) {
  return { value: null, status };
}

function buildProtocol(protocolId, resolvedByKey, dataState) {
  const modules = PROTOCOL_MODULE_MAP[protocolId] ?? [];
  const available = modules.length > 0;

  if (!available) return unresolvedTrack(0, false, NEXUS_STATUS.UNAVAILABLE);
  if (dataState !== NEXUS_DATA_STATE.READY) {
    return unresolvedTrack(modules.length, true, NEXUS_STATUS.UNKNOWN);
  }

  const completedCount = modules.filter(
    (module) => resolvedByKey.get(module.key)?.completed
  ).length;
  const progress = completionPercent(completedCount, modules.length);

  return {
    progress,
    status: statusForProgress(progress),
    available: true,
    completedCount,
    totalCount: modules.length,
  };
}

/**
 * Builds the whole Nexus projection from raw rows. Pure — no I/O, no
 * clock, no randomness — so the failure states are unit-testable.
 *
 * @param {Object}   input
 * @param {boolean}  input.isAuthenticated
 * @param {boolean}  [input.loading]
 * @param {Array}    [input.progressRows]  rec_uni_user_progress rows
 * @param {Array}    [input.sovereignRows] sovereign_module_state rows
 * @param {Object}   [input.error]         a structured load failure, if any
 */
export function deriveNexusState({
  isAuthenticated = false,
  loading = false,
  progressRows = [],
  sovereignRows = [],
  error = null,
} = {}) {
  let dataState = NEXUS_DATA_STATE.READY;
  if (loading) dataState = NEXUS_DATA_STATE.LOADING;
  else if (error) dataState = NEXUS_DATA_STATE.ERROR;
  else if (!isAuthenticated) dataState = NEXUS_DATA_STATE.SIGNED_OUT;

  const recUniById = indexRows(progressRows);
  const sovereignById = indexRows(sovereignRows);

  const resolvedByKey = new Map();
  const trackAll = (modules) => {
    for (const module of modules) {
      if (!resolvedByKey.has(module.key)) {
        resolvedByKey.set(module.key, resolveModule(module, recUniById, sovereignById));
      }
    }
  };
  trackAll(HERMETIC_HALL_MODULES);
  for (const modules of Object.values(PROTOCOL_MODULE_MAP)) trackAll(modules);

  const ready = dataState === NEXUS_DATA_STATE.READY;

  // --- Hermetic Hall (Central Academic Axis) --------------------------------
  const hallModules = HERMETIC_HALL_MODULES;
  let hermeticHall;
  if (ready) {
    const principles = hallModules.map((module) => {
      const resolved = resolvedByKey.get(module.key);
      return {
        slug: module.slug,
        completed: Boolean(resolved?.completed),
        started: Boolean(resolved?.started),
      };
    });
    const completedCount = principles.filter((p) => p.completed).length;
    const progress = completionPercent(completedCount, principles.length);
    hermeticHall = {
      progress,
      status: statusForProgress(progress),
      available: true,
      completedCount,
      totalCount: principles.length,
      principles,
      current: principles.find((p) => !p.completed) ?? principles[principles.length - 1] ?? null,
    };
  } else {
    hermeticHall = {
      ...unresolvedTrack(hallModules.length, true, NEXUS_STATUS.UNKNOWN),
      principles: hallModules.map((module) => ({
        slug: module.slug,
        completed: false,
        started: false,
      })),
      current: null,
    };
  }

  // --- The four Protocols ---------------------------------------------------
  const fracture = buildProtocol('fracture', resolvedByKey, dataState);
  const reflection = buildProtocol('reflection', resolvedByKey, dataState);
  const crucible = buildProtocol('crucible', resolvedByKey, dataState);
  const reclamation = buildProtocol('reclamation', resolvedByKey, dataState);

  // --- Bottom dock metrics --------------------------------------------------
  //
  // Knowledge Index is a real derivation: completed educational modules over
  // available educational modules, across every Reclamation University track
  // that has a production learner experience today (Hermetic Hall's seven
  // principles plus the available Protocols' modules).
  //
  // Arsenal Attunement and Celestial Alignment have no backing subsystem —
  // no arsenal/artifact curriculum defines an enumerable denominator, and no
  // alignment curriculum exists at all. Per the data-integrity rule, they
  // report `unavailable` rather than a fabricated percentage.
  const knowledgeModules = [
    ...hallModules,
    ...KNOWLEDGE_INDEX_PROTOCOLS.flatMap((id) => PROTOCOL_MODULE_MAP[id] ?? []),
  ];
  const knowledgeIndex = ready
    ? (() => {
        const completedCount = knowledgeModules.filter(
          (module) => resolvedByKey.get(module.key)?.completed
        ).length;
        const value = completionPercent(completedCount, knowledgeModules.length);
        return {
          value,
          status:
            value === null ? NEXUS_METRIC_STATUS.UNAVAILABLE : NEXUS_METRIC_STATUS.OK,
          completedCount,
          totalCount: knowledgeModules.length,
        };
      })()
    : {
        ...unresolvedMetric(NEXUS_METRIC_STATUS.UNKNOWN),
        completedCount: null,
        totalCount: knowledgeModules.length,
      };

  return {
    loading,
    error,
    isAuthenticated,
    dataState,
    hermeticHall,
    fracture,
    reflection,
    crucible,
    reclamation,
    knowledgeIndex,
    arsenalAttunement: unresolvedMetric(NEXUS_METRIC_STATUS.UNAVAILABLE),
    celestialAlignment: unresolvedMetric(NEXUS_METRIC_STATUS.UNAVAILABLE),
  };
}

/** Every module id this projection reads, grouped by source table. */
export function nexusTrackedModuleIds() {
  const recUni = new Set();
  const sovereign = new Set();
  const collect = (modules) => {
    for (const module of modules) {
      for (const id of module.recUniIds ?? []) recUni.add(id);
      if (module.sovereignId) sovereign.add(module.sovereignId);
    }
  };
  collect(HERMETIC_HALL_MODULES);
  for (const modules of Object.values(PROTOCOL_MODULE_MAP)) collect(modules);
  return { recUni: [...recUni], sovereign: [...sovereign] };
}
