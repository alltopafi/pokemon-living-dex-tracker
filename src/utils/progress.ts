import { REGIONS } from '../data/pokemonData';
import { CaughtStateMap, PokemonCaughtStatus } from '../types/pokemon';

export interface ProgressCount {
  caught: number;
  total: number;
  percentage: number;
}

/** A Pokemon counts toward progress when it is caught or only the base form is held. */
export function isCountedAsCaught(status?: PokemonCaughtStatus): boolean {
  return !!status && (status.caught || status.status === 'caught' || status.status === 'has_base');
}

/** Fully caught / evolved (a held base form does not count, since it is not ready to transfer). */
export function isFullyCaught(status?: PokemonCaughtStatus): boolean {
  if (!status) return false;
  return (status.status ?? (status.caught ? 'caught' : 'uncaught')) === 'caught';
}

/** Fully caught and already transferred into Pokemon HOME. */
export function isInHome(status?: PokemonCaughtStatus): boolean {
  return isFullyCaught(status) && !!status?.inHome;
}

/** Fully caught but not yet transferred into Pokemon HOME. */
export function needsHomeTransfer(status?: PokemonCaughtStatus): boolean {
  return isFullyCaught(status) && !status?.inHome;
}

export function toPercentage(caught: number, total: number): number {
  return total === 0 ? 0 : Math.round((caught / total) * 100);
}

/**
 * Progress through the National Dex excluding Pokemon that debuted on Nintendo Switch
 * (Gen 8 Galar/Hisui and Gen 9 Paldea).
 */
export function getNonSwitchProgress(caughtMap: CaughtStateMap): ProgressCount {
  let caught = 0;
  let total = 0;
  for (const region of REGIONS) {
    if (region.id === 'all' || region.switchOnly) continue;
    total += region.total;
    for (let id = region.startId; id <= region.endId; id++) {
      if (isCountedAsCaught(caughtMap[id])) caught++;
    }
  }
  return { caught, total, percentage: toPercentage(caught, total) };
}
