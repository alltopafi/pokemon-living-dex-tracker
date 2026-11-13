import { describe, expect, it } from 'vitest';
import { REGIONS } from '../data/pokemonData';
import { CaughtStateMap } from '../types/pokemon';
import { getNonSwitchProgress } from '../utils/progress';

const caughtRange = (start: number, end: number, status: 'caught' | 'has_base' = 'caught'): CaughtStateMap => {
  const map: CaughtStateMap = {};
  for (let id = start; id <= end; id++) map[id] = { caught: status === 'caught', status };
  return map;
};

describe('getNonSwitchProgress', () => {
  it('only Gen 8 (Galar/Hisui) and Gen 9 (Paldea) are flagged as Switch-only', () => {
    const switchIds = REGIONS.filter((r) => r.switchOnly).map((r) => r.id);
    expect(switchIds).toEqual(['galar', 'paldea']);
  });

  it('total excludes Gen 8 and Gen 9 (1025 - 96 - 120 = 809)', () => {
    expect(getNonSwitchProgress({}).total).toBe(809);
  });

  it('is 0 / 0% for an empty dex', () => {
    expect(getNonSwitchProgress({})).toEqual({ caught: 0, total: 809, percentage: 0 });
  });

  it('is 100% when Gen 1-7 are complete, even with no Switch Pokemon', () => {
    expect(getNonSwitchProgress(caughtRange(1, 809))).toEqual({ caught: 809, total: 809, percentage: 100 });
  });

  it('ignores Switch-era Pokemon (#810-#1025)', () => {
    const progress = getNonSwitchProgress({ ...caughtRange(1, 100), ...caughtRange(810, 1025) });
    expect(progress.caught).toBe(100);
  });

  it('counts base-form entries as progress, matching the other meters', () => {
    expect(getNonSwitchProgress(caughtRange(1, 10, 'has_base')).caught).toBe(10);
  });

  it('does not count entries explicitly marked uncaught', () => {
    const map: CaughtStateMap = { 1: { caught: false, status: 'uncaught' } };
    expect(getNonSwitchProgress(map).caught).toBe(0);
  });
});
