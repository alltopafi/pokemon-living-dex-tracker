import { describe, expect, it } from 'vitest';
import { POKEMON_LIST, REGIONS } from '../data/pokemonData';
import { BULBAPEDIA_NATIONAL_DEX } from './fixtures/bulbapediaNationalDex';

/** Lowercase, drop accents, and strip everything except letters/digits ("Flabébé" -> "flabebe"). */
const normalize = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const NORMALIZED_REFERENCE = BULBAPEDIA_NATIONAL_DEX.map(normalize);
const REFERENCE_INDEX_BY_NAME = new Map(NORMALIZED_REFERENCE.map((name, index) => [name, index]));

/**
 * The app stores some species with their default-form label ("Deoxys Normal", "Meowstic Male")
 * and without punctuation ("Farfetchd"). A name matches the reference at `index` if it is the same
 * species after normalizing, or the reference species followed by a form label.
 * A name that is exactly some *other* species never matches, so a swapped/shifted entry
 * (e.g. "Porygon2" sitting where "Porygon" belongs) is still caught.
 */
const matchesReference = (actual: string, index: number): boolean => {
  const normalizedActual = normalize(actual);
  const expected = NORMALIZED_REFERENCE[index];
  if (normalizedActual === expected) return true;
  const ownIndex = REFERENCE_INDEX_BY_NAME.get(normalizedActual);
  if (ownIndex !== undefined && ownIndex !== index) return false;
  return normalizedActual.startsWith(expected);
};

describe('National Dex sequence', () => {
  it('has the same number of entries as the Bulbapedia reference list', () => {
    expect(POKEMON_LIST).toHaveLength(BULBAPEDIA_NATIONAL_DEX.length);
  });

  it('has contiguous ids from 1 with no gaps or duplicates, in array order', () => {
    const mismatches = POKEMON_LIST
      .map((p, index) => ({ index, id: p.id, expected: index + 1 }))
      .filter(({ id, expected }) => id !== expected);
    expect(mismatches).toEqual([]);
  });

  it('matches the Bulbapedia National Dex number for every Pokemon name', () => {
    const mismatches = POKEMON_LIST
      .map((p) => ({ id: p.id, actual: p.name, expected: BULBAPEDIA_NATIONAL_DEX[p.id - 1] }))
      .filter(({ id, actual }) => !matchesReference(actual, id - 1));
    expect(mismatches).toEqual([]);
  });

  it('detects a Pokemon placed at the wrong National Dex number', () => {
    // Guards the matcher itself: swapped neighbours and look-alike prefixes must not pass.
    expect(matchesReference('Ivysaur', 0)).toBe(false);
    expect(matchesReference('Porygon2', 136)).toBe(false);
    expect(matchesReference('Porygon', 136)).toBe(true);
    expect(matchesReference('Deoxys Normal', 385)).toBe(true);
    expect(matchesReference('Flabebe', 668)).toBe(true);
  });
});

describe('Region ranges', () => {
  const regions = REGIONS.filter((r) => r.id !== 'all');

  it('are contiguous, start at 1 and end at the last National Dex number', () => {
    expect(regions[0].startId).toBe(1);
    for (let i = 1; i < regions.length; i++) {
      expect(regions[i].startId).toBe(regions[i - 1].endId + 1);
    }
    expect(regions[regions.length - 1].endId).toBe(BULBAPEDIA_NATIONAL_DEX.length);
  });

  it('have totals that match their id range', () => {
    for (const region of regions) {
      expect(region.total).toBe(region.endId - region.startId + 1);
    }
  });

  it('tag every Pokemon with the region whose range contains its id', () => {
    for (const p of POKEMON_LIST) {
      const region = regions.find((r) => p.id >= r.startId && p.id <= r.endId);
      expect(p.region).toBe(region?.id);
    }
  });
});
