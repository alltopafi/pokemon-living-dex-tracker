import { Pokemon, RegionId, RegionInfo } from '../types/pokemon';

export const REGIONS: RegionInfo[] = [
  {
    id: 'all',
    name: 'National Dex',
    genName: 'All Generations',
    genNumber: 0,
    startId: 1,
    endId: 1025,
    total: 1025,
    nativeGames: ['All Games']
  },
  {
    id: 'kanto',
    name: 'Kanto',
    genName: 'Gen I',
    genNumber: 1,
    startId: 1,
    endId: 151,
    total: 151,
    nativeGames: ['Red', 'Blue', 'Yellow', 'FireRed', 'LeafGreen', "Let's Go Pikachu", "Let's Go Eevee"]
  },
  {
    id: 'johto',
    name: 'Johto',
    genName: 'Gen II',
    genNumber: 2,
    startId: 152,
    endId: 251,
    total: 100,
    nativeGames: ['Gold', 'Silver', 'Crystal', 'HeartGold', 'SoulSilver']
  },
  {
    id: 'hoenn',
    name: 'Hoenn',
    genName: 'Gen III',
    genNumber: 3,
    startId: 252,
    endId: 386,
    total: 135,
    nativeGames: ['Ruby', 'Sapphire', 'Emerald', 'Omega Ruby', 'Alpha Sapphire']
  },
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    genName: 'Gen IV',
    genNumber: 4,
    startId: 387,
    endId: 493,
    total: 107,
    nativeGames: ['Diamond', 'Pearl', 'Platinum', 'Brilliant Diamond', 'Shining Pearl', 'Legends: Arceus']
  },
  {
    id: 'unova',
    name: 'Unova',
    genName: 'Gen V',
    genNumber: 5,
    startId: 494,
    endId: 649,
    total: 156,
    nativeGames: ['Black', 'White', 'Black 2', 'White 2']
  },
  {
    id: 'kalos',
    name: 'Kalos',
    genName: 'Gen VI',
    genNumber: 6,
    startId: 650,
    endId: 721,
    total: 72,
    nativeGames: ['X', 'Y']
  },
  {
    id: 'alola',
    name: 'Alola',
    genName: 'Gen VII',
    genNumber: 7,
    startId: 722,
    endId: 809,
    total: 88,
    nativeGames: ['Sun', 'Moon', 'Ultra Sun', 'Ultra Moon']
  },
  {
    id: 'galar',
    name: 'Galar / Hisui',
    genName: 'Gen VIII',
    genNumber: 8,
    startId: 810,
    endId: 905,
    total: 96,
    nativeGames: ['Sword', 'Shield', 'Legends: Arceus']
  },
  {
    id: 'paldea',
    name: 'Paldea',
    genName: 'Gen IX',
    genNumber: 9,
    startId: 906,
    endId: 1025,
    total: 120,
    nativeGames: ['Scarlet', 'Violet', 'The Teal Mask', 'The Indigo Disk']
  }
];

// Helper to determine region by ID
export function getRegionForId(id: number): RegionId {
  if (id <= 151) return 'kanto';
  if (id <= 251) return 'johto';
  if (id <= 386) return 'hoenn';
  if (id <= 493) return 'sinnoh';
  if (id <= 649) return 'unova';
  if (id <= 721) return 'kalos';
  if (id <= 809) return 'alola';
  if (id <= 905) return 'galar';
  return 'paldea';
}

export function getGenForId(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

export function getValidGamesForId(id: number): string[] {
  const region = getRegionForId(id);
  const info = REGIONS.find(r => r.id === region);
  return info ? info.nativeGames : [];
}

// Full dataset helper generator
// We generate the exact 1025 Pokemon list with correct names, types, and regions
import { RAW_POKEMON_LIST } from './rawPokemonData';

export const POKEMON_LIST: Pokemon[] = RAW_POKEMON_LIST.map((p) => {
  const region = getRegionForId(p.id);
  const gen = getGenForId(p.id);
  const validGames = getValidGamesForId(p.id);
  return {
    ...p,
    gen,
    region,
    validGames
  };
});
