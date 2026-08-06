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

export function buildHomeBoxes(
  pokemonList: Pokemon[],
  caughtMap: CaughtStateMap,
  activeRegion: RegionId
): HomeBoxData[] {
  const boxes: HomeBoxData[] = [];
  let globalBoxNumber = 1;

  // Determine which regions to process
  const targetRegions = activeRegion === 'all' 
    ? REGIONS.filter(r => r.id !== 'all') 
    : REGIONS.filter(r => r.id === activeRegion);

  const pokemonById = new Map<number, Pokemon>();
  pokemonList.forEach(p => pokemonById.set(p.id, p));

  for (const region of targetRegions) {
    const prefix = REGION_PREFIXES[region.id] || 'K';
    const regionPokemon: Pokemon[] = [];

    // Collect all Pokemon matching this region in ID order
    for (let id = region.startId; id <= region.endId; id++) {
      if (pokemonById.has(id)) {
        regionPokemon.push(pokemonById.get(id)!);
      }
    }

    if (regionPokemon.length === 0) continue;

    // Chunk into boxes of 30
    const BOX_SIZE = 30;
    for (let i = 0; i < regionPokemon.length; i += BOX_SIZE) {
      const chunk = regionPokemon.slice(i, i + BOX_SIZE);
      const startId = chunk[0].id;
      const endId = chunk[chunk.length - 1].id;
      
      const boxTitle = startId === endId ? `${prefix} ${startId}` : `${prefix} ${startId}-${endId}`;
      const caughtCount = chunk.filter(p => !!caughtMap[p.id]?.caught).length;

      boxes.push({
        boxNumber: globalBoxNumber++,
        boxTitle,
        regionPrefix: prefix,
        startId,
        endId,
        pokemonList: chunk,
        caughtCount
      });
    }
  }

  return boxes;
}
