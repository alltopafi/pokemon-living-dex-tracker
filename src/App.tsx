import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { POKEMON_LIST, REGIONS } from './data/pokemonData';
import { RegionId, Pokemon, SpriteStyle, FilterState, CaughtStateMap, ObtainmentStatus } from './types/pokemon';
import { 
  loadCaughtState, 
  saveCaughtState, 
  loadSpriteStyle, 
  saveSpriteStyle, 
  loadSavedUsername, 
  saveUsername, 
  loadActiveRegion,
  saveActiveRegion,
  loadViewMode,
  saveViewMode,
  exportBackup, 
  importBackup,
  mergeCaughtStates
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
import { CaughtHistoryModal } from './components/CaughtHistoryModal';
import { UserLoginModal } from './components/UserLoginModal';
import { BatchActionBar } from './components/BatchActionBar';
import { SearchX } from 'lucide-react';
import { getNonSwitchProgress } from './utils/progress';

function App() {
  const [activeRegion, setActiveRegion] = useState<RegionId>(() => loadActiveRegion());
  const [caughtMap, setCaughtMap] = useState<CaughtStateMap>(() => loadCaughtState());
  const [spriteStyle, setSpriteStyle] = useState<SpriteStyle>(() => loadSpriteStyle());
  
  // Modals & Panels
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // User Auth & DB Syncing
  const [username, setUsername] = useState<string>(() => loadSavedUsername());
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Synchronization refs to prevent race conditions, rapid requests, and stale overwrites
  const syncVersionRef = useRef<number>(0);
  const syncDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const caughtMapRef = useRef<CaughtStateMap>(caughtMap);
  caughtMapRef.current = caughtMap;
  const isApplyingRemoteRef = useRef<boolean>(false);

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(new Set());

  // Filter State (defaults to HOME Boxes)
  const [filters, setFilters] = useState<FilterState>(() => ({
    search: '',
    status: 'all',
    type: 'all',
    game: 'all',
    sortBy: 'id-asc',
    viewMode: loadViewMode()
  }));

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    if (newFilters.viewMode) {
      saveViewMode(newFilters.viewMode);
    }
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const performPostgresSync = useCallback(async (user: string, mapToSync: CaughtStateMap) => {
    if (!user) return;
    const reqVersion = ++syncVersionRef.current;
    setIsSyncing(true);
    try {
      const remoteMap = await syncCaughtState(user, mapToSync);
      // Stale response check: only apply if this request is still the latest active one
      if (reqVersion === syncVersionRef.current && remoteMap) {
        setCaughtMap((prev) => {
          isApplyingRemoteRef.current = true;
          const merged = mergeCaughtStates(prev, remoteMap);
          saveCaughtState(merged);
          return merged;
        });
      }
    } catch (e) {
      console.warn('Postgres background sync error:', e);
    } finally {
      if (reqVersion === syncVersionRef.current) {
        setIsSyncing(false);
      }
    }
  }, []);

  const scheduleDebouncedSync = useCallback((mapToSync: CaughtStateMap) => {
    if (!username) return;
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
    }
    syncDebounceTimerRef.current = setTimeout(() => {
      performPostgresSync(username, mapToSync);
    }, 400);
  }, [username, performPostgresSync]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
    };
  }, []);

  // Save caughtMap locally and schedule background sync when local state changes
  useEffect(() => {
    saveCaughtState(caughtMap);

    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false;
      return;
    }

    if (username) {
      scheduleDebouncedSync(caughtMap);
    }
  }, [caughtMap, username, scheduleDebouncedSync]);

  // Initial Sync on load if username exists
  useEffect(() => {
    if (username) {
      performPostgresSync(username, caughtMapRef.current);
    }
  }, [username, performPostgresSync]);

  // Auto-sync on window focus when returning to tab
  useEffect(() => {
    const handleFocus = () => {
      if (username) {
        const reqVersion = ++syncVersionRef.current;
        fetchUserCaughtState(username).then((remoteMap) => {
          if (reqVersion === syncVersionRef.current && remoteMap) {
            setCaughtMap((prev) => {
              isApplyingRemoteRef.current = true;
              const merged = mergeCaughtStates(prev, remoteMap);
              saveCaughtState(merged);
              return merged;
            });
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [username]);

  const handleManualSync = async () => {
    if (!username) {
      setIsUserModalOpen(true);
      return;
    }
    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
    }
    await performPostgresSync(username, caughtMapRef.current);
  };

  const handleUserLogin = async (user: string) => {
    try {
      const res = await loginUser(user);
      setUsername(user);
      saveUsername(user);
      if (res?.caughtMap) {
        setCaughtMap((prev) => {
          isApplyingRemoteRef.current = true;
          const merged = mergeCaughtStates(prev, res.caughtMap);
          saveCaughtState(merged);
          performPostgresSync(user, merged);
          return merged;
        });
      } else {
        performPostgresSync(user, caughtMapRef.current);
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

  const handleSelectRegion = (regionId: RegionId) => {
    setActiveRegion(regionId);
    saveActiveRegion(regionId);
  };

  const handleToggleCaught = (id: number) => {
    const now = Date.now();
    setCaughtMap((prev) => {
      const currentSt = prev[id];
      const isCurrentlyCaught = !!currentSt?.caught || currentSt?.status === 'caught' || currentSt?.status === 'has_base';
      const newStatus: ObtainmentStatus = isCurrentlyCaught ? 'uncaught' : 'caught';

      return {
        ...prev,
        [id]: {
          ...prev[id],
          caught: newStatus === 'caught',
          status: newStatus,
          timestamp: now
        }
      };
    });
  };

  const handleSetStatus = (id: number, status: ObtainmentStatus) => {
    const now = Date.now();
    setCaughtMap((prev) => {
      const isCaught = status === 'caught';
      return {
        ...prev,
        [id]: {
          ...prev[id],
          caught: isCaught,
          status: status,
          timestamp: now
        }
      };
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
    const now = Date.now();
    setCaughtMap((prev) => {
      return {
        ...prev,
        [id]: {
          ...prev[id],
          caught: prev[id]?.caught ?? true,
          notes,
          caughtInGame,
          timestamp: now
        }
      };
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
      const isAcquired = !!st?.caught || pStatus === 'caught' || pStatus === 'has_base';

      if (filters.status === 'caught' || filters.status === 'caught_or_base') {
        if (!isAcquired) return false;
      } else if (filters.status === 'caught_only') {
        if (pStatus !== 'caught' && (!st?.caught || pStatus === 'has_base')) return false;
      } else if (filters.status === 'has_base') {
        if (pStatus !== 'has_base') return false;
      } else if (filters.status === 'uncaught') {
        if (isAcquired) return false;
      }

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
    const now = Date.now();

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
          timestamp: now
        };
      });

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

  const nonSwitchProgress = useMemo(() => getNonSwitchProgress(caughtMap), [caughtMap]);

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
        nonSwitchCaught={nonSwitchProgress.caught}
        nonSwitchTotal={nonSwitchProgress.total}
        activeRegionName={activeRegionInfo.name}
        regionCaught={regionCaughtCount}
        regionTotal={activeRegionInfo.total}
        filterState={filters}
        onFilterChange={handleFilterChange}
        spriteStyle={spriteStyle}
        onSpriteStyleChange={handleSpriteStyleChange}
        onExport={handleExport}
        onImport={handleImport}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
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
        onSelectRegion={handleSelectRegion}
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
                activeRegion={activeRegion}
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
          activeRegion={activeRegion}
        />
      )}

      {isStatsOpen && (
        <StatsDashboardModal
          caughtMap={caughtMap}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {isHistoryOpen && (
        <CaughtHistoryModal
          caughtMap={caughtMap}
          spriteStyle={spriteStyle}
          onClose={() => setIsHistoryOpen(false)}
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
