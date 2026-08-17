import { Pokemon, HomeBoxData, RegionId, CaughtStateMap } from '../types/pokemon';
import { REGIONS } from '../data/pokemonData';

export const REGION_PREFIXES: Record<RegionId, string> = {
  all: 'ALL',
  kanto: 'K',
  johto: 'J',
  hoenn: 'H',
  sinnoh: 'S',
  unova: 'U',
  kalos: 'Kl',
  alola: 'A',
  galar: 'G',
  paldea: 'P'
};

/**
 * Calculates the exact Pokemon HOME Box Number and Slot Number (1..30)
 * for any given Pokemon.
 * If activeRegion === 'all' (National Dex), boxNumber is relative to full National Dex.
 * If activeRegion is a specific region (e.g. 'johto'), boxNumber starts at 1 for that region.
 */
export function getPokemonBoxLocation(
  pokemon: Pokemon,
  activeRegion: RegionId = 'all'
): {
  prefix: string;
  boxNumber: number;
  slotNumber: number;
  locationString: string;
} {
  const region = REGIONS.find(r => r.id === pokemon.region) || REGIONS[1]; // fallback Kanto
  const prefix = REGION_PREFIXES[pokemon.region] || 'K';

  let precedingBoxes = 0;
  if (activeRegion === 'all') {
    for (const r of REGIONS) {
      if (r.id === 'all') continue;
      if (r.id === pokemon.region) break;
      precedingBoxes += Math.ceil(r.total / 30);
    }
  }

  const offsetInRegion = pokemon.id - region.startId;
  const boxInRegion = Math.floor(offsetInRegion / 30);
  const calculatedBoxNumber = precedingBoxes + boxInRegion + 1;
  const slotNumber = (offsetInRegion % 30) + 1;

  return {
    prefix,
    boxNumber: calculatedBoxNumber,
    slotNumber,
    locationString: `${prefix} Box ${calculatedBoxNumber} Slot ${slotNumber}`
  };
}

export function buildHomeBoxes(
  pokemonList: Pokemon[],
  caughtMap: CaughtStateMap,
  activeRegion: RegionId
): HomeBoxData[] {
  const boxes: HomeBoxData[] = [];

  // Determine which regions to process
  const targetRegions = activeRegion === 'all' 
    ? REGIONS.filter(r => r.id !== 'all') 
    : REGIONS.filter(r => r.id === activeRegion);

  const pokemonById = new Map<number, Pokemon>();
  pokemonList.forEach(p => pokemonById.set(p.id, p));

  // Preceding boxes count for active region start
  let startGlobalBox = 1;
  if (activeRegion !== 'all') {
    startGlobalBox = 1; // When a single region tab is selected, box numbers start at Box 1 for that region
  }

  let currentGlobalBox = startGlobalBox;

  for (const region of targetRegions) {
    const prefix = REGION_PREFIXES[region.id] || 'K';
    const regionPokemon: Pokemon[] = [];

    for (let id = region.startId; id <= region.endId; id++) {
      if (pokemonById.has(id)) {
        regionPokemon.push(pokemonById.get(id)!);
      }
    }

    if (regionPokemon.length === 0) continue;

    const BOX_SIZE = 30;
    for (let i = 0; i < regionPokemon.length; i += BOX_SIZE) {
      const chunk = regionPokemon.slice(i, i + BOX_SIZE);
      const startId = chunk[0].id;
      const endId = chunk[chunk.length - 1].id;
      
      const boxTitle = startId === endId ? `${prefix} ${startId}` : `${prefix} ${startId}-${endId}`;
      const caughtCount = chunk.filter(p => {
        const st = caughtMap[p.id];
        return !!st?.caught || st?.status === 'caught';
      }).length;
      const hasBaseCount = chunk.filter(p => caughtMap[p.id]?.status === 'has_base').length;

      boxes.push({
        boxNumber: currentGlobalBox++,
        boxTitle,
        regionPrefix: prefix,
        startId,
        endId,
        pokemonList: chunk,
        caughtCount,
        hasBaseCount
      });
    }
  }

  return boxes;
}
