export type RegionId = 
  | 'all' 
  | 'kanto' 
  | 'johto' 
  | 'hoenn' 
  | 'sinnoh' 
  | 'unova' 
  | 'kalos' 
  | 'alola' 
  | 'galar' 
  | 'paldea';

export type PokemonType = 
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice' 
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug' 
  | 'Rock' | 'Ghost' | 'Dragon' | 'Steel' | 'Fairy' | 'Dark';

export interface Pokemon {
  id: number;
  name: string;
  gen: number;
  region: RegionId;
  types: PokemonType[];
  validGames: string[]; // Games where caught in original region (including remakes)
}

export interface RegionInfo {
  id: RegionId;
  name: string;
  genName: string;
  genNumber: number;
  startId: number;
  endId: number;
  total: number;
  nativeGames: string[];
}

export interface PokemonCaughtStatus {
  caught: boolean;
  notes?: string;
  caughtInGame?: string;
  timestamp?: number;
}

export type CaughtStateMap = Record<number, PokemonCaughtStatus>;

export type SpriteStyle = 'official-artwork' | 'home' | 'pixel';

export type ViewMode = 'grid' | 'home-box';

export interface FilterState {
  search: string;
  status: 'all' | 'caught' | 'uncaught';
  type: string; // 'all' or specific PokemonType
  game: string; // 'all' or specific origin game name (e.g. 'Blue', 'HeartGold')
  sortBy: 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc';
  viewMode: ViewMode;
}

export interface DexStats {
  total: number;
  caught: number;
  percentage: number;
}

export interface HomeBoxData {
  boxNumber: number;
  boxTitle: string; // e.g. "K 1-30"
  regionPrefix: string; // e.g. "K"
  startId: number;
  endId: number;
  pokemonList: Pokemon[];
  caughtCount: number;
}
