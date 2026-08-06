import { CaughtStateMap, SpriteStyle } from '../types/pokemon';

const CAUGHT_STORAGE_KEY = 'pokemon_living_dex_caught_v1';
const SPRITE_STORAGE_KEY = 'pokemon_living_dex_sprite_style_v1';

export function loadCaughtState(): CaughtStateMap {
  try {
    const raw = localStorage.getItem(CAUGHT_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load caught state from localStorage', e);
    return {};
  }
}

export function saveCaughtState(state: CaughtStateMap): void {
  try {
    localStorage.setItem(CAUGHT_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save caught state to localStorage', e);
  }
}

export function loadSpriteStyle(): SpriteStyle {
  try {
    const raw = localStorage.getItem(SPRITE_STORAGE_KEY);
    if (raw === 'official-artwork' || raw === 'home' || raw === 'pixel') {
      return raw;
    }
  } catch (e) {
    console.error('Failed to load sprite style setting', e);
  }
  return 'official-artwork';
}

export function saveSpriteStyle(style: SpriteStyle): void {
  try {
    localStorage.setItem(SPRITE_STORAGE_KEY, style);
  } catch (e) {
    console.error('Failed to save sprite style setting', e);
  }
}

export function exportBackup(state: CaughtStateMap): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `pokemon_living_dex_backup_${timestamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBackup(fileContent: string): CaughtStateMap | null {
  try {
    const parsed = JSON.parse(fileContent);
    if (typeof parsed === 'object' && parsed !== null) {
      saveCaughtState(parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Invalid backup JSON file', e);
  }
  return null;
}

export function getSpriteUrl(id: number, style: SpriteStyle): string {
  if (style === 'home') {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
  }
  if (style === 'pixel') {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }
  // Official Artwork default
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
