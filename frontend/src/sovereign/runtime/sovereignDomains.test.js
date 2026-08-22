import { describe, expect, it } from 'vitest';
import {
  SOVEREIGN_DOMAIN_IDS,
  SOVEREIGN_DOMAIN_ROLE_IDS,
  isValidDomain,
  isValidDomainRole,
  buildDomainMatrix,
  domainsForConcept,
} from './sovereignDomains';

describe('sovereignDomains', () => {
  it('defines the eight domains and four roles from the migration guide', () => {
    expect(SOVEREIGN_DOMAIN_IDS).toEqual([
      'psychology', 'technology', 'economics', 'culture', 'power', 'language', 'systems', 'identity',
    ]);
    expect(SOVEREIGN_DOMAIN_ROLE_IDS).toEqual(['condition', 'cause', 'effect', 'feedback']);
  });

  it('validates domain and role ids', () => {
    expect(isValidDomain('psychology')).toBe(true);
    expect(isValidDomain('astrology')).toBe(false);
    expect(isValidDomainRole('cause')).toBe(true);
    expect(isValidDomainRole('outcome')).toBe(false);
  });

  describe('buildDomainMatrix', () => {
    it('includes every domain and role even with no mappings at all', () => {
      const matrix = buildDomainMatrix({ domainMappings: [] });

      expect(matrix).toHaveLength(8);
      expect(matrix.every((row) => Object.keys(row.roles).length === 4)).toBe(true);
      expect(matrix.every((row) => Object.values(row.roles).every((cell) => cell.length === 0))).toBe(true);
    });

    it('places a concept in exactly the (domain, role) cell it was mapped to', () => {
      const matrix = buildDomainMatrix({
        domainMappings: [{ conceptId: 'shadow-work', domain: 'psychology', role: 'cause' }],
      });

      const psychology = matrix.find((row) => row.domain === 'psychology');
      expect(psychology.roles.cause).toEqual(['shadow-work']);
      expect(psychology.roles.effect).toEqual([]);

      const culture = matrix.find((row) => row.domain === 'culture');
      expect(culture.roles.cause).toEqual([]);
    });

    it('lets the same concept appear across multiple domains and roles', () => {
      const matrix = buildDomainMatrix({
        domainMappings: [
          { conceptId: 'shadow-work', domain: 'psychology', role: 'cause' },
          { conceptId: 'shadow-work', domain: 'culture', role: 'effect' },
          { conceptId: 'shadow-work', domain: 'psychology', role: 'feedback' },
        ],
      });

      const psychology = matrix.find((row) => row.domain === 'psychology');
      expect(psychology.roles.cause).toEqual(['shadow-work']);
      expect(psychology.roles.feedback).toEqual(['shadow-work']);
      const culture = matrix.find((row) => row.domain === 'culture');
      expect(culture.roles.effect).toEqual(['shadow-work']);
    });

    it('does not duplicate a concept within one cell for a repeated mapping', () => {
      const matrix = buildDomainMatrix({
        domainMappings: [
          { conceptId: 'shadow-work', domain: 'psychology', role: 'cause' },
          { conceptId: 'shadow-work', domain: 'psychology', role: 'cause' },
        ],
      });

      expect(matrix.find((row) => row.domain === 'psychology').roles.cause).toEqual(['shadow-work']);
    });
  });

  describe('domainsForConcept', () => {
    it('returns nothing for a concept with no mappings', () => {
      expect(domainsForConcept({ domainMappings: [] }, 'shadow-work')).toEqual([]);
    });

    it('groups a concept\'s mappings by domain, collecting every role', () => {
      const result = domainsForConcept(
        {
          domainMappings: [
            { conceptId: 'shadow-work', domain: 'psychology', role: 'cause' },
            { conceptId: 'shadow-work', domain: 'psychology', role: 'feedback' },
            { conceptId: 'shadow-work', domain: 'culture', role: 'effect' },
            { conceptId: 'other-concept', domain: 'power', role: 'cause' },
          ],
        },
        'shadow-work',
      );

      expect(result).toEqual([
        { domain: 'psychology', roles: ['cause', 'feedback'] },
        { domain: 'culture', roles: ['effect'] },
      ]);
    });
  });
});
