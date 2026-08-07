// Service to fetch and format game-specific locations and obtaining methods for Pokemon

export interface LocationDetail {
  locationName: string;
  method: string;
  minLevel: number;
  maxLevel: number;
  chance: number;
}

export interface ObtainInfo {
  gameName: string;
  locations: LocationDetail[];
  evolutionOrSpecial?: string;
}

// Memory cache for encounter data
const encounterCache: Record<string, ObtainInfo> = {};

// Map game display names to PokeAPI version internal names
const GAME_TO_VERSION_MAP: Record<string, string[]> = {
  'Red': ['red'],
  'Blue': ['blue'],
  'Yellow': ['yellow'],
  'Gold': ['gold'],
  'Silver': ['silver'],
  'Crystal': ['crystal'],
  'Ruby': ['ruby'],
  'Sapphire': ['sapphire'],
  'Emerald': ['emerald'],
  'FireRed': ['firered'],
  'LeafGreen': ['leafgreen'],
  'Diamond': ['diamond'],
  'Pearl': ['pearl'],
  'Platinum': ['platinum'],
  'HeartGold': ['heartgold'],
  'SoulSilver': ['soulsilver'],
  'Black': ['black'],
  'White': ['white'],
  'Black 2': ['black-2'],
  'White 2': ['white-2'],
  'X': ['x'],
  'Y': ['y'],
  'Omega Ruby': ['omega-ruby'],
  'Alpha Sapphire': ['alpha-sapphire'],
  'Sun': ['sun'],
  'Moon': ['moon'],
  'Ultra Sun': ['ultra-sun'],
  'Ultra Moon': ['ultra-moon'],
  "Let's Go Pikachu": ["lets-go-pikachu"],
  "Let's Go Eevee": ["lets-go-eevee"],
  'Sword': ['sword'],
  'Shield': ['shield'],
  'Brilliant Diamond': ['brilliant-diamond'],
  'Shining Pearl': ['shining-pearl'],
  'Legends: Arceus': ['legends-arceus'],
  'Scarlet': ['scarlet'],
  'Violet': ['violet'],
  'The Teal Mask': ['teal-mask', 'scarlet', 'violet'],
  'The Indigo Disk': ['indigo-disk', 'scarlet', 'violet']
};

export async function getPokemonObtainDetails(
  pokemonId: number,
  pokemonName: string,
  gameName: string
): Promise<ObtainInfo> {
  const cacheKey = `${pokemonId}_${gameName}_v2`; // Updated cache key to prevent stale memory cache
  if (encounterCache[cacheKey]) {
    return encounterCache[cacheKey];
  }

  const versionKeys = GAME_TO_VERSION_MAP[gameName] || [gameName.toLowerCase().replace(/[^a-z0-9]/g, '-')];

  try {
    // 1. Fetch Encounters from PokeAPI
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`);
    let matchedLocations: LocationDetail[] = [];

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const areaName = formatLocationName(item.location_area?.name || '');
          
          for (const verDetail of item.version_details || []) {
            const verName = verDetail.version?.name;
            if (versionKeys.includes(verName)) {
              for (const encDetails of verDetail.encounter_details || []) {
                matchedLocations.push({
                  locationName: areaName,
                  method: formatMethod(encDetails.method?.name),
                  minLevel: encDetails.min_level,
                  maxLevel: encDetails.max_level,
                  chance: encDetails.chance
                });
              }
            }
          }
        }
      }
    }

    // Deduplicate locations with same area & method
    const uniqueLocations = deduplicateLocations(matchedLocations);

    // 2. Fetch evolution or special method info
    let evolutionText = await getSpecialOrEvolutionObtainMethod(pokemonId, pokemonName, gameName);
    let evolutionOrSpecial: string | undefined = undefined;

    if (evolutionText) {
      const isEvo = evolutionText.startsWith('Evolve') || evolutionText.startsWith('Trade');
      if (isEvo) {
        evolutionOrSpecial = `Evolution Method: ${evolutionText}`;
      } else {
        evolutionOrSpecial = evolutionText;
      }
    }

    const result: ObtainInfo = {
      gameName,
      locations: uniqueLocations,
      evolutionOrSpecial
    };

    encounterCache[cacheKey] = result;
    return result;

  } catch (error) {
    console.warn('Fallback to evolution/special method check due to error or missing data', error);
    const fallbackText = await getSpecialOrEvolutionObtainMethod(pokemonId, pokemonName, gameName);
    const result: ObtainInfo = {
      gameName,
      locations: [],
      evolutionOrSpecial: fallbackText ? `Evolution Method: ${fallbackText}` : `Obtainable in ${gameName} via wild encounters, evolution, or NPC trade.`
    };
    encounterCache[cacheKey] = result;
    return result;
  }
}

// Helpers
function formatLocationName(raw: string): string {
  if (!raw) return 'Unknown Location';
  // Remove region prefixes like johto- or kanto- or sinnoh-
  let clean = raw
    .replace(/^(kanto|johto|hoenn|sinnoh|unova|kalos|alola|galar|paldea|hisui)-/i, '')
    .replace(/-area$/i, '')
    .replace(/-/g, ' ');

  return clean
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatMethod(method: string | undefined): string {
  if (!method) return 'Wild Encounter';
  switch (method) {
    case 'walk': return 'Tall Grass / Walking';
    case 'surf': return 'Surfing on Water';
    case 'super-rod': return 'Fishing (Super Rod)';
    case 'good-rod': return 'Fishing (Good Rod)';
    case 'old-rod': return 'Fishing (Old Rod)';
    case 'headbutt': return 'Headbutt Tree';
    case 'rock-smash': return 'Rock Smash';
    case 'gift': return 'Gift Pokemon';
    case 'gift-egg': return 'Gift Egg';
    case 'only-one': return 'Static Special Encounter';
    default:
      return method.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}

function deduplicateLocations(locs: LocationDetail[]): LocationDetail[] {
  const map = new Map<string, LocationDetail>();
  for (const l of locs) {
    const key = `${l.locationName}_${l.method}`;
    if (!map.has(key) || map.get(key)!.chance < l.chance) {
      map.set(key, l);
    }
  }
  return Array.from(map.values()).slice(0, 10); // Limit to top 10 unique locations for clean UI
}

async function getSpecialOrEvolutionObtainMethod(
  pokemonId: number,
  pokemonName: string,
  gameName: string
): Promise<string | undefined> {
  // Check Starters / Mythicals / Specials
  if (pokemonId === 1 || pokemonId === 4 || pokemonId === 7) {
    return `Starter Pokemon received from Professor Oak in Pallet Town (${gameName}).`;
  }
  if (pokemonId === 152 || pokemonId === 155 || pokemonId === 158) {
    return `Starter Pokemon received from Professor Elm in New Bark Town (${gameName}).`;
  }
  if (pokemonId === 252 || pokemonId === 255 || pokemonId === 258) {
    return `Starter Pokemon received from Professor Birch on Route 101 (${gameName}).`;
  }
  if (pokemonId === 387 || pokemonId === 390 || pokemonId === 393) {
    return `Starter Pokemon received from Professor Rowan / Lake Verity (${gameName}).`;
  }
  if (pokemonId === 495 || pokemonId === 498 || pokemonId === 501) {
    return `Starter Pokemon received from Professor Juniper in Nuvema Town (${gameName}).`;
  }
  if (pokemonId === 650 || pokemonId === 653 || pokemonId === 656) {
    return `Starter Pokemon received from Shauna / Tierno in Aquacorde Town (${gameName}).`;
  }
  if (pokemonId === 722 || pokemonId === 725 || pokemonId === 728) {
    return `Starter Pokemon received from Hala in Iki Town (${gameName}).`;
  }
  if (pokemonId === 810 || pokemonId === 813 || pokemonId === 816) {
    return `Starter Pokemon received from Leon in Postwick (${gameName}).`;
  }
  if (pokemonId === 906 || pokemonId === 909 || pokemonId === 912) {
    return `Starter Pokemon received from Director Clavell in Cabo Poco (${gameName}).`;
  }

  // Fetch species to check evolution trigger
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    if (!res.ok) throw new Error('Species fetch failed');
    const speciesData = await res.json();

    const evoChainUrl = speciesData.evolution_chain?.url;
    if (evoChainUrl) {
      const evoRes = await fetch(evoChainUrl);
      if (evoRes.ok) {
        const evoData = await evoRes.json();
        const evoDetails = parseEvolutionDetails(evoData.chain, pokemonName);
        if (evoDetails) {
          return evoDetails;
        }
      }
    }
  } catch (e) {
    // Ignore error and return general obtain text
  }

  return undefined;
}

function parseEvolutionDetails(chainNode: any, targetName: string): string | null {
  if (!chainNode) return null;

  for (const evo of chainNode.evolves_to || []) {
    const speciesName = evo.species?.name;
    const targetLower = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentLower = speciesName?.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (targetLower === currentLower) {
      const details = evo.evolution_details?.[0];
      const fromName = chainNode.species?.name 
        ? chainNode.species.name.charAt(0).toUpperCase() + chainNode.species.name.slice(1) 
        : 'pre-evolution';

      if (!details) return `Evolve from ${fromName}.`;

      const trigger = details.trigger?.name;
      if (trigger === 'level-up') {
        if (details.min_level) return `Evolve ${fromName} at Level ${details.min_level}.`;
        if (details.item) return `Evolve ${fromName} with ${formatItemName(details.item.name)}.`;
        if (details.held_item) return `Evolve ${fromName} holding ${formatItemName(details.held_item.name)} when leveling up.`;
        if (details.time_of_day) return `Evolve ${fromName} at ${details.time_of_day} time.`;
        if (details.location) return `Evolve ${fromName} near ${formatLocationName(details.location.name)}.`;
        if (details.known_move) return `Evolve ${fromName} after learning ${formatItemName(details.known_move.name)}.`;
        return `Evolve from ${fromName} via Level Up.`;
      } else if (trigger === 'use-item') {
        const item = details.item?.name ? formatItemName(details.item.name) : 'Evolution Stone';
        return `Evolve ${fromName} using ${item}.`;
      } else if (trigger === 'trade') {
        if (details.held_item) return `Trade ${fromName} holding ${formatItemName(details.held_item.name)}.`;
        return `Trade ${fromName} with another player.`;
      }
      return `Evolve from ${fromName}.`;
    }

    // Recursive search
    const subResult = parseEvolutionDetails(evo, targetName);
    if (subResult) return subResult;
  }

  return null;
}

function formatItemName(name: string): string {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
