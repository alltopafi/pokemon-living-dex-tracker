import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { POKEMON_LIST, REGIONS } from './data/pokemonData';
import { 
  RegionId, 
  Pokemon, 
  FilterState, 
  CaughtStateMap, 
  SpriteStyle 
} from './types/pokemon';
import { 
  loadCaughtState, 
  saveCaughtState, 
  loadSpriteStyle, 
  saveSpriteStyle, 
  exportBackup, 
  importBackup 
} from './utils/storage';
import { Header } from './components/Header';
import { RegionTabs } from './components/RegionTabs';
import { PokemonCard } from './components/PokemonCard';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { StatsDashboardModal } from './components/StatsDashboardModal';
import { SearchX } from 'lucide-react';

export function App() {
  const [caughtMap, setCaughtMap] = useState<CaughtStateMap>(loadCaughtState);
  const [activeRegion, setActiveRegion] = useState<RegionId>('all');
  const [spriteStyle, setSpriteStyle] = useState<SpriteStyle>(loadSpriteStyle);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'id-asc'
  });

  // Save to LocalStorage whenever caughtMap changes
  useEffect(() => {
    saveCaughtState(caughtMap);
  }, [caughtMap]);

  // Handle Sprite Style changes
  const handleSpriteStyleChange = (style: SpriteStyle) => {
    setSpriteStyle(style);
    saveSpriteStyle(style);
  };

  // Toggle caught status
  const handleToggleCaught = (id: number) => {
    setCaughtMap((prev) => {
      const next = { ...prev };
      const currentStatus = !!next[id]?.caught;
      const newStatus = !currentStatus;

      next[id] = {
        ...next[id],
        caught: newStatus,
        timestamp: newStatus ? Date.now() : undefined
      };

      // Trigger celebratory confetti if completing a region or 100% Dex!
      if (newStatus) {
        const totalCaughtCount = Object.values(next).filter(v => v.caught).length;
        if (totalCaughtCount === 1025) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      }

      return next;
    });
  };

  // Update Notes / Game Caught In
  const handleUpdateNotes = (id: number, notes: string, caughtInGame: string) => {
    setCaughtMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        caught: prev[id]?.caught ?? true,
        notes,
        caughtInGame
      }
    }));
  };

  // Filter & Search Logic
  const filteredPokemon = useMemo(() => {
    return POKEMON_LIST.filter((p) => {
      // 1. Region Filter
      if (activeRegion !== 'all' && p.region !== activeRegion) {
        return false;
      }

      // 2. Status Filter
      const isCaught = !!caughtMap[p.id]?.caught;
      if (filters.status === 'caught' && !isCaught) return false;
      if (filters.status === 'uncaught' && isCaught) return false;

      // 3. Type Filter
      if (filters.type !== 'all' && !p.types.includes(filters.type as any)) {
        return false;
      }

      // 4. Search Filter
      if (filters.search.trim()) {
        const query = filters.search.trim().toLowerCase();
        const idMatch = `#${p.id}`.includes(query) || String(p.id).includes(query);
        const nameMatch = p.name.toLowerCase().includes(query);
        if (!idMatch && !nameMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'id-asc') return a.id - b.id;
      if (filters.sortBy === 'id-desc') return b.id - a.id;
      if (filters.sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (filters.sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [activeRegion, filters, caughtMap]);

  // Active Region Stats
  const activeRegionInfo = REGIONS.find(r => r.id === activeRegion) || REGIONS[0];
  const regionCaughtCount = useMemo(() => {
    if (activeRegion === 'all') {
      return Object.values(caughtMap).filter(v => v.caught).length;
    }
    let c = 0;
    for (let i = activeRegionInfo.startId; i <= activeRegionInfo.endId; i++) {
      if (caughtMap[i]?.caught) c++;
    }
    return c;
  }, [activeRegion, activeRegionInfo, caughtMap]);

  const totalCaughtCount = useMemo(() => {
    return Object.values(caughtMap).filter(v => v.caught).length;
  }, [caughtMap]);

  // Export / Import
  const handleExport = () => {
    exportBackup(caughtMap);
  };

  const handleImport = (content: string) => {
    const imported = importBackup(content);
    if (imported) {
      setCaughtMap(imported);
      alert('Living Dex progress successfully imported!');
    } else {
      alert('Failed to import backup file. Please check file format.');
    }
  };

  return (
    <div className="app-container">
      <Header
        totalCaught={totalCaughtCount}
        totalDex={1025}
        activeRegionName={activeRegionInfo.name}
        regionCaught={regionCaughtCount}
        regionTotal={activeRegionInfo.total}
        filterState={filters}
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
        spriteStyle={spriteStyle}
        onSpriteStyleChange={handleSpriteStyleChange}
        onExport={handleExport}
        onImport={handleImport}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      <RegionTabs
        regions={REGIONS}
        activeRegion={activeRegion}
        onSelectRegion={(id) => setActiveRegion(id)}
        caughtMap={caughtMap}
      />

      {filteredPokemon.length === 0 ? (
        <div className="empty-state">
          <SearchX size={48} />
          <h3>No Pokemon Found</h3>
          <p>Try adjusting your search query, type, or caught status filter.</p>
        </div>
      ) : (
        <main className="dex-grid">
          {filteredPokemon.map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              isCaught={!!caughtMap[pokemon.id]?.caught}
              spriteStyle={spriteStyle}
              onToggleCaught={handleToggleCaught}
              onOpenDetail={(p) => setSelectedPokemon(p)}
            />
          ))}
        </main>
      )}

      {selectedPokemon && (
        <PokemonDetailModal
          pokemon={selectedPokemon}
          status={caughtMap[selectedPokemon.id]}
          spriteStyle={spriteStyle}
          onClose={() => setSelectedPokemon(null)}
          onToggleCaught={handleToggleCaught}
          onUpdateNotes={handleUpdateNotes}
        />
      )}

      {isStatsOpen && (
        <StatsDashboardModal
          caughtMap={caughtMap}
          onClose={() => setIsStatsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
