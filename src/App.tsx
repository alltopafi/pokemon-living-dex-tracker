import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { loginUser, syncCaughtState } from './services/apiService';
import { Header } from './components/Header';
import { RegionTabs } from './components/RegionTabs';
import { PokemonCard } from './components/PokemonCard';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { StatsDashboardModal } from './components/StatsDashboardModal';
import { BatchActionBar } from './components/BatchActionBar';
import { UserLoginModal } from './components/UserLoginModal';
import { SearchX } from 'lucide-react';

const USERNAME_STORAGE_KEY = 'pokemon_living_dex_username_v1';

export function App() {
  const [caughtMap, setCaughtMap] = useState<CaughtStateMap>(loadCaughtState);
  const [activeRegion, setActiveRegion] = useState<RegionId>('all');
  const [spriteStyle, setSpriteStyle] = useState<SpriteStyle>(loadSpriteStyle);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Username & DB Sync State
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_STORAGE_KEY));
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(new Set());

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

  // Sync to PostgreSQL DB helper
  const performPostgresSync = useCallback(async (user: string, stateMap: CaughtStateMap) => {
    setIsSyncing(true);
    await syncCaughtState(user, stateMap);
    setIsSyncing(false);
  }, []);

  // Handle Username Login
  const handleUserLogin = async (newUsername: string) => {
    const cleanUser = newUsername.trim().toLowerCase();
    setUsername(cleanUser);
    localStorage.setItem(USERNAME_STORAGE_KEY, cleanUser);
    setIsUserModalOpen(false);

    setIsSyncing(true);
    const dbResult = await loginUser(cleanUser);
    setIsSyncing(false);

    if (dbResult) {
      // Merge DB state with local caughtMap or adopt DB state
      setCaughtMap(dbResult.caughtMap);
    } else {
      // If DB endpoint unreachable, push current local map to DB when online
      performPostgresSync(cleanUser, caughtMap);
    }
  };

  // Handle User Logout
  const handleUserLogout = () => {
    setUsername(null);
    localStorage.removeItem(USERNAME_STORAGE_KEY);
    setIsUserModalOpen(false);
  };

  // Auto-login / fetch DB state on app load if username exists
  useEffect(() => {
    if (username) {
      loginUser(username).then((dbResult) => {
        if (dbResult && Object.keys(dbResult.caughtMap).length > 0) {
          setCaughtMap(dbResult.caughtMap);
        }
      });
    }
  }, []);

  // Handle Sprite Style changes
  const handleSpriteStyleChange = (style: SpriteStyle) => {
    setSpriteStyle(style);
    saveSpriteStyle(style);
  };

  // Toggle caught status for single card
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

      if (newStatus) {
        const totalCaughtCount = Object.values(next).filter(v => v.caught).length;
        if (totalCaughtCount === 1025) {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      }

      // Sync to PostgreSQL DB if logged in
      if (username) {
        performPostgresSync(username, next);
      }

      return next;
    });
  };

  // Toggle selection for single card in batch mode
  const handleToggleBatchSelect = (id: number) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Update Notes / Game Caught In for single card
  const handleUpdateNotes = (id: number, notes: string, caughtInGame: string) => {
    setCaughtMap((prev) => {
      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          caught: prev[id]?.caught ?? true,
          notes,
          caughtInGame
        }
      };
      if (username) {
        performPostgresSync(username, next);
      }
      return next;
    });
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

  // Batch Selection Helpers
  const handleSelectAllVisible = () => {
    const allIds = new Set(filteredPokemon.map(p => p.id));
    setSelectedBatchIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedBatchIds(new Set());
  };

  // Apply Batch Updates (Status, Game, Notes)
  const handleApplyBatchUpdate = (options: {
    status?: 'caught' | 'uncaught';
    caughtInGame?: string;
    notes?: string;
  }) => {
    if (selectedBatchIds.size === 0) return;

    setCaughtMap((prev) => {
      const next = { ...prev };
      selectedBatchIds.forEach((id) => {
        const existing = next[id] || { caught: false };
        const newCaughtState = options.status !== undefined 
          ? (options.status === 'caught') 
          : existing.caught;

        next[id] = {
          ...existing,
          caught: newCaughtState,
          caughtInGame: options.caughtInGame !== undefined ? options.caughtInGame : existing.caughtInGame,
          notes: options.notes !== undefined ? options.notes : existing.notes,
          timestamp: newCaughtState ? (existing.timestamp || Date.now()) : undefined
        };
      });

      if (username) {
        performPostgresSync(username, next);
      }

      return next;
    });

    setSelectedBatchIds(new Set());
    setIsBatchMode(false);
  };

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
      if (username) {
        performPostgresSync(username, imported);
      }
      alert('Living Dex progress successfully imported & synced!');
    } else {
      alert('Failed to import backup file. Please check file format.');
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: isBatchMode ? '140px' : '3rem' }}>
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
        isBatchMode={isBatchMode}
        onToggleBatchMode={() => {
          setIsBatchMode(!isBatchMode);
          if (isBatchMode) {
            setSelectedBatchIds(new Set());
          }
        }}
        username={username}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        isSyncing={isSyncing}
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
              isBatchMode={isBatchMode}
              isSelectedInBatch={selectedBatchIds.has(pokemon.id)}
              onToggleBatchSelect={handleToggleBatchSelect}
            />
          ))}
        </main>
      )}

      {isBatchMode && (
        <BatchActionBar
          selectedCount={selectedBatchIds.size}
          totalVisibleCount={filteredPokemon.length}
          onSelectAll={handleSelectAllVisible}
          onDeselectAll={handleDeselectAll}
          onApplyBatchUpdate={handleApplyBatchUpdate}
          onExitBatchMode={() => {
            setIsBatchMode(false);
            setSelectedBatchIds(new Set());
          }}
        />
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

      {isUserModalOpen && (
        <UserLoginModal
          currentUsername={username}
          onLogin={handleUserLogin}
          onLogout={handleUserLogout}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
