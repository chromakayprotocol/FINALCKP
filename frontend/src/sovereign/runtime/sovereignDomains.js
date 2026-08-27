/**
 * The Domain Matrix (Phase 11 of the Sovereign OS migration).
 *
 * "Each domain references concepts rather than owning duplicate
 * definitions" — a domain is a lens a concept can be viewed through, not a
 * second place a concept gets defined. The concept itself still lives only
 * in the Concept Graph (concepts.selected, Phase 10); a domain mapping is
 * just a (conceptId, domain, role) triple saying "this concept plays this
 * role when viewed through this domain." The same concept can carry
 * different roles across different domains, or even multiple roles within
 * one domain (e.g. a feedback loop where a concept is both a cause and an
 * effect) — nothing here forces a concept into exactly one place.
 *
 * This module is the static catalog (which domains/roles exist) and the
 * pure function that turns raw domainMappings into the matrix shape the
 * migration guide describes. It does not decide how the matrix is
 * rendered — that's Phase 16's Visual Interaction Layer.
 */

export const SOVEREIGN_DOMAINS = Object.freeze([
  { id: 'psychology', label: 'Psychology' },
  { id: 'technology', label: 'Technology' },
  { id: 'economics', label: 'Economics' },
  { id: 'culture', label: 'Culture' },
  { id: 'power', label: 'Power' },
  { id: 'language', label: 'Language' },
  { id: 'systems', label: 'Systems' },
  { id: 'identity', label: 'Identity' },
]);

export const SOVEREIGN_DOMAIN_IDS = Object.freeze(SOVEREIGN_DOMAINS.map((domain) => domain.id));

export const SOVEREIGN_DOMAIN_ROLES = Object.freeze([
  { id: 'condition', label: 'Condition' },
  { id: 'cause', label: 'Cause' },
  { id: 'effect', label: 'Effect' },
  { id: 'feedback', label: 'Feedback' },
]);

export const SOVEREIGN_DOMAIN_ROLE_IDS = Object.freeze(
  SOVEREIGN_DOMAIN_ROLES.map((role) => role.id),
);

export function isValidDomain(domain) {
  return SOVEREIGN_DOMAIN_IDS.includes(domain);
}

export function isValidDomainRole(role) {
  return SOVEREIGN_DOMAIN_ROLE_IDS.includes(role);
}

/**
 * Builds the matrix the migration guide draws as a grid: one row per
 * domain, one column per role, each cell the concepts mapped to that
 * (domain, role) pair. Every domain/role appears even with zero mappings
 * (an empty cell is still part of the matrix, not an absent one), so a
 * renderer can iterate the full grid without special-casing gaps.
 *
 * @param {{ domainMappings: Array<{conceptId: string, domain: string, role: string}> }} concepts
 * @returns {Array<{ domain: string, label: string, roles: Record<string, string[]> }>}
 */
export function buildDomainMatrix(concepts) {
  const mappings = concepts?.domainMappings ?? [];

  return SOVEREIGN_DOMAINS.map((domain) => {
    const roles = Object.fromEntries(SOVEREIGN_DOMAIN_ROLE_IDS.map((roleId) => [roleId, []]));
    for (const mapping of mappings) {
      if (mapping.domain !== domain.id) continue;
      if (!roles[mapping.role]) continue;
      if (!roles[mapping.role].includes(mapping.conceptId)) {
        roles[mapping.role].push(mapping.conceptId);
      }
    }
    return { domain: domain.id, label: domain.label, roles };
  });
}

/**
 * All domains a given concept has been mapped into, each with the roles
 * it plays there. Useful for "where does this concept show up" views
 * (e.g. a concept detail panel) without walking the whole matrix.
 *
 * @param {{ domainMappings: Array<{conceptId: string, domain: string, role: string}> }} concepts
 * @param {string} conceptId
 * @returns {Array<{ domain: string, roles: string[] }>}
 */
export function domainsForConcept(concepts, conceptId) {
  const mappings = (concepts?.domainMappings ?? []).filter((mapping) => mapping.conceptId === conceptId);
  const byDomain = new Map();
  for (const mapping of mappings) {
    const roles = byDomain.get(mapping.domain) ?? [];
    if (!roles.includes(mapping.role)) roles.push(mapping.role);
    byDomain.set(mapping.domain, roles);
  }
  return Array.from(byDomain.entries()).map(([domain, roles]) => ({ domain, roles }));
}
