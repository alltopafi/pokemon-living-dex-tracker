import { describe, expect, it } from 'vitest';
import { REGIONS } from '../data/pokemonData';
import { CaughtStateMap } from '../types/pokemon';
import { getNonSwitchProgress, isInHome, needsHomeTransfer } from '../utils/progress';
import { mergeCaughtStates } from '../utils/storage';

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

describe('HOME transfer tracking', () => {
  it('a fully caught Pokemon is in HOME only when flagged', () => {
    expect(isInHome({ caught: true, status: 'caught', inHome: true })).toBe(true);
    expect(isInHome({ caught: true, status: 'caught' })).toBe(false);
    expect(needsHomeTransfer({ caught: true, status: 'caught' })).toBe(true);
    expect(needsHomeTransfer({ caught: true, status: 'caught', inHome: true })).toBe(false);
  });

  it('legacy entries with only caught: true count as fully caught and need transfer', () => {
    expect(needsHomeTransfer({ caught: true })).toBe(true);
  });

  it('base forms, uncaught and missing entries are neither in HOME nor awaiting transfer', () => {
    for (const entry of [{ caught: false, status: 'has_base' as const, inHome: true }, { caught: false, status: 'uncaught' as const, inHome: true }, undefined]) {
      expect(isInHome(entry)).toBe(false);
      expect(needsHomeTransfer(entry)).toBe(false);
    }
  });

  it('merging keeps the newer entry, including its inHome flag', () => {
    const local: CaughtStateMap = { 1: { caught: true, status: 'caught', inHome: true, timestamp: 200 } };
    const remote: CaughtStateMap = { 1: { caught: true, status: 'caught', inHome: false, timestamp: 100 }, 2: { caught: true, status: 'caught', inHome: true, timestamp: 50 } };
    const merged = mergeCaughtStates(local, remote);
    expect(merged[1].inHome).toBe(true);
    expect(merged[2].inHome).toBe(true);
    expect(mergeCaughtStates(remote, local)[1].inHome).toBe(true);
  });
});
