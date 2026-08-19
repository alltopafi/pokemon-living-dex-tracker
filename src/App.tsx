import { useState, useEffect, useMemo } from 'react';
import { POKEMON_LIST, REGIONS } from './data/pokemonData';
import { RegionId, Pokemon, SpriteStyle, FilterState, CaughtStateMap, ObtainmentStatus } from './types/pokemon';
import { 
  loadCaughtState, 
  saveCaughtState, 
  loadSpriteStyle, 
  saveSpriteStyle,
  loadSavedUsername,
  saveUsername,
  exportBackup,
  importBackup
} from './utils/storage';
import { buildHomeBoxes } from './utils/boxHelper';
import { loginUser, syncCaughtState, fetchUserCaughtState } from './services/apiService';
import { Header } from './components/Header';
import { BankShutdownBanner } from './components/BankShutdownBanner';
import { RegionTabs } from './components/RegionTabs';
import { PokemonCard } from './components/PokemonCard';
import { PokemonHomeBox } from './components/PokemonHomeBox';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { StatsDashboardModal } from './components/StatsDashboardModal';
import { UserLoginModal } from './components/UserLoginModal';
import { BatchActionBar } from './components/BatchActionBar';
import { SearchX } from 'lucide-react';

function App() {
  const [activeRegion, setActiveRegion] = useState<RegionId>('all');
  const [caughtMap, setCaughtMap] = useState<CaughtStateMap>(() => loadCaughtState());
  const [spriteStyle, setSpriteStyle] = useState<SpriteStyle>(() => loadSpriteStyle());
  
  // Modals & Panels
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // User Auth & DB Syncing
  const [username, setUsername] = useState<string>(() => loadSavedUsername());
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(new Set());

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    type: 'all',
    game: 'all',
    sortBy: 'id-asc',
    viewMode: 'grid'
  });

  // Save caughtMap locally & trigger optional sync
  useEffect(() => {
    saveCaughtState(caughtMap);
  }, [caughtMap]);

  // Initial Sync on load if username exists
  useEffect(() => {
    if (username) {
      performPostgresSync(username, caughtMap);
    }
  }, []);

  // Auto-sync on window focus when returning to tab
  useEffect(() => {
    const handleFocus = () => {
      if (username) {
        fetchUserCaughtState(username).then((remoteMap) => {
          if (remoteMap) {
            setCaughtMap(remoteMap);
            saveCaughtState(remoteMap);
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [username]);

  const performPostgresSync = async (user: string, currentMap: CaughtStateMap) => {
    setIsSyncing(true);
    try {
      const mergedMap = await syncCaughtState(user, currentMap);
      if (mergedMap) {
        setCaughtMap(mergedMap);
        saveCaughtState(mergedMap);
      }
    } catch (e) {
      console.warn('Postgres background sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!username) {
      setIsUserModalOpen(true);
      return;
    }

    setIsSyncing(true);
    try {
      const mergedMap = await syncCaughtState(username, caughtMap);
      if (mergedMap) {
        setCaughtMap(mergedMap);
        saveCaughtState(mergedMap);
      }
    } catch (e) {
      console.warn('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUserLogin = async (user: string) => {
    try {
      const res = await loginUser(user);
      setUsername(user);
      saveUsername(user);
      if (res?.caughtMap) {
        setCaughtMap(res.caughtMap);
        saveCaughtState(res.caughtMap);
      }
      setIsUserModalOpen(false);
    } catch (e) {
      alert('Login failed. Please make sure backend database server is running.');
    }
  };

  const handleUserLogout = () => {
    setUsername('');
    saveUsername('');
    setIsUserModalOpen(false);
  };

  const handleSpriteStyleChange = (style: SpriteStyle) => {
    setSpriteStyle(style);
    saveSpriteStyle(style);
  };

  const handleToggleCaught = (id: number) => {
    setCaughtMap((prev) => {
      const currentSt = prev[id];
      const isCurrentlyCaught = !!currentSt?.caught || currentSt?.status === 'caught' || currentSt?.status === 'has_base';
      const newStatus: ObtainmentStatus = isCurrentlyCaught ? 'uncaught' : 'caught';

      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          caught: newStatus === 'caught',
          status: newStatus,
          timestamp: Date.now()
        }
      };
      if (username) {
        performPostgresSync(username, next);
      }
      return next;
    });
  };

  const handleSetStatus = (id: number, status: ObtainmentStatus) => {
    setCaughtMap((prev) => {
      const isCaught = status === 'caught';
      const next = {
        ...prev,
        [id]: {
          ...prev[id],
          caught: isCaught,
          status: status,
          timestamp: Date.now()
        }
      };
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
      const st = caughtMap[p.id];
      const pStatus: ObtainmentStatus = st?.status || (st?.caught ? 'caught' : 'uncaught');
      
      if (filters.status === 'caught' && pStatus !== 'caught') return false;
      if (filters.status === 'has_base' && pStatus !== 'has_base') return false;
      if (filters.status === 'uncaught' && pStatus !== 'uncaught') return false;

      // 3. Game Caught In Filter
      if (filters.game === 'none') {
        if (st?.caughtInGame && st.caughtInGame.trim() !== '') {
          return false;
        }
      } else if (filters.game !== 'all') {
        if (pStatus === 'uncaught' || st?.caughtInGame !== filters.game) {
          return false;
        }
      }

      // 4. Type Filter
      if (filters.type !== 'all' && !p.types.includes(filters.type as any)) {
        return false;
      }

      // 5. Search Filter
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

  // Compute HOME Storage Boxes
  const homeBoxes = useMemo(() => {
    return buildHomeBoxes(filteredPokemon, caughtMap, activeRegion);
  }, [filteredPokemon, caughtMap, activeRegion]);

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
    status?: ObtainmentStatus;
    caughtInGame?: string;
    notes?: string;
  }) => {
    if (selectedBatchIds.size === 0) return;

    setCaughtMap((prev) => {
      const next = { ...prev };
      selectedBatchIds.forEach((id) => {
        const existing = next[id] || { caught: false };
        const newStatus = options.status !== undefined 
          ? options.status 
          : (existing.status || (existing.caught ? 'caught' : 'uncaught'));
        
        const newCaught = newStatus === 'caught';

        next[id] = {
          ...existing,
          caught: newCaught,
          status: newStatus,
          caughtInGame: options.caughtInGame !== undefined ? options.caughtInGame : existing.caughtInGame,
          notes: options.notes !== undefined ? options.notes : existing.notes,
          timestamp: Date.now()
        };
      });

      if (username) {
        performPostgresSync(username, next);
      }
      return next;
    });
  };

  // Active Region Helper
  const activeRegionInfo = useMemo(() => {
    return REGIONS.find(r => r.id === activeRegion) || REGIONS[0];
  }, [activeRegion]);

  // Counts both fully caught and base form acquired towards progress bar completion
  const regionCaughtCount = useMemo(() => {
    if (activeRegion === 'all') {
      return Object.values(caughtMap).filter(v => v.caught || v.status === 'caught' || v.status === 'has_base').length;
    }
    let c = 0;
    for (let i = activeRegionInfo.startId; i <= activeRegionInfo.endId; i++) {
      const st = caughtMap[i];
      if (st?.caught || st?.status === 'caught' || st?.status === 'has_base') c++;
    }
    return c;
  }, [activeRegion, activeRegionInfo, caughtMap]);

  const totalCaughtCount = useMemo(() => {
    return Object.values(caughtMap).filter(v => v.caught || v.status === 'caught' || v.status === 'has_base').length;
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
      <BankShutdownBanner />
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
        username={username}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        isBatchMode={isBatchMode}
        onToggleBatchMode={() => {
          setIsBatchMode(prev => !prev);
          setSelectedBatchIds(new Set());
        }}
      />

      <RegionTabs
        regions={REGIONS}
        activeRegion={activeRegion}
        onSelectRegion={(regionId) => setActiveRegion(regionId)}
        caughtMap={caughtMap}
      />

      {filteredPokemon.length === 0 ? (
        <div className="empty-state">
          <SearchX size={48} />
          <h3>No Pokemon Found</h3>
          <p>Try adjusting your search query, type, game, or caught status filter.</p>
        </div>
      ) : filters.viewMode === 'home-box' ? (
        <main className="home-boxes-wrapper">
          {homeBoxes.map((box) => (
            <PokemonHomeBox
              key={box.boxNumber}
              box={box}
              caughtMap={caughtMap}
              spriteStyle={spriteStyle}
              onToggleCaught={handleToggleCaught}
              onOpenDetail={(p) => setSelectedPokemon(p)}
              isBatchMode={isBatchMode}
              selectedBatchIds={selectedBatchIds}
              onToggleBatchSelect={handleToggleBatchSelect}
              activeRegion={activeRegion}
            />
          ))}
        </main>
      ) : (
        <main className="dex-grid">
          {filteredPokemon.map((pokemon) => {
            const st = caughtMap[pokemon.id];

            return (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isCaught={!!st?.caught}
                status={st?.status}
                spriteStyle={spriteStyle}
                onToggleCaught={handleToggleCaught}
                onOpenDetail={(p) => setSelectedPokemon(p)}
                isBatchMode={isBatchMode}
                isSelectedInBatch={selectedBatchIds.has(pokemon.id)}
                onToggleBatchSelect={handleToggleBatchSelect}
              />
            );
          })}
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
          isCaught={!!caughtMap[selectedPokemon.id]?.caught}
          status={caughtMap[selectedPokemon.id]?.status}
          initialNotes={caughtMap[selectedPokemon.id]?.notes}
          initialGame={caughtMap[selectedPokemon.id]?.caughtInGame}
          spriteStyle={spriteStyle}
          onClose={() => setSelectedPokemon(null)}
          onSetStatus={handleSetStatus}
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
