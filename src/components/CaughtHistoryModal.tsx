import React, { useState, useMemo } from 'react';
import { X, History, Calendar, Filter, Search, Gamepad2, GitBranch, Check, ArrowUpDown } from 'lucide-react';
import { CaughtStateMap, SpriteStyle, ObtainmentStatus } from '../types/pokemon';
import { POKEMON_LIST, REGIONS } from '../data/pokemonData';
import { getSpriteUrl } from '../utils/storage';

interface CaughtHistoryModalProps {
  caughtMap: CaughtStateMap;
  spriteStyle: SpriteStyle;
  onClose: () => void;
}

type TimeSpanOption = 'all' | 'today' | '7days' | '30days' | 'custom';

const ALL_GAME_OPTIONS = [
  'Red', 'Blue', 'Yellow',
  'Gold', 'Silver', 'Crystal',
  'Ruby', 'Sapphire', 'Emerald',
  'FireRed', 'LeafGreen',
  'Diamond', 'Pearl', 'Platinum',
  'HeartGold', 'SoulSilver',
  'Black', 'White', 'Black 2', 'White 2',
  'X', 'Y', 'Omega Ruby', 'Alpha Sapphire',
  'Sun', 'Moon', 'Ultra Sun', 'Ultra Moon',
  "Let's Go Pikachu", "Let's Go Eevee",
  'Sword', 'Shield', 'Legends: Arceus',
  'Brilliant Diamond', 'Shining Pearl',
  'Scarlet', 'Violet', 'The Teal Mask', 'The Indigo Disk'
];

export const CaughtHistoryModal: React.FC<CaughtHistoryModalProps> = ({
  caughtMap,
  spriteStyle,
  onClose
}) => {
  const [timeSpan, setTimeSpan] = useState<TimeSpanOption>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'id-asc' | 'id-desc'>('newest');

  // Convert caughtMap to array of items with Pokemon details & timestamp
  const historyList = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return POKEMON_LIST.filter((pokemon) => {
      const st = caughtMap[pokemon.id];
      if (!st) return false;
      const isAcquired = !!st.caught || st.status === 'caught' || st.status === 'has_base';
      if (!isAcquired) return false;

      // 1. Status Filter
      const status: ObtainmentStatus = st.status || (st.caught ? 'caught' : 'uncaught');
      if (selectedStatus === 'caught_only' && status !== 'caught' && !st.caught) return false;
      if (selectedStatus === 'has_base' && status !== 'has_base') return false;

      // 2. Region Filter
      if (selectedRegion !== 'all' && pokemon.region !== selectedRegion) return false;

      // 3. Game Filter
      if (selectedGame === 'none') {
        if (st.caughtInGame && st.caughtInGame.trim() !== '') return false;
      } else if (selectedGame !== 'all') {
        if (st.caughtInGame !== selectedGame) return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = pokemon.name.toLowerCase().includes(q);
        const matchId = `#${pokemon.id}`.includes(q) || String(pokemon.id).includes(q);
        const matchNotes = st.notes ? st.notes.toLowerCase().includes(q) : false;
        if (!matchName && !matchId && !matchNotes) return false;
      }

      // 5. Time Span Filter
      const ts = st.timestamp || 0;
      if (timeSpan === 'today') {
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        if (ts < startOfToday) return false;
      } else if (timeSpan === '7days') {
        if (ts < now - 7 * oneDayMs) return false;
      } else if (timeSpan === '30days') {
        if (ts < now - 30 * oneDayMs) return false;
      } else if (timeSpan === 'custom') {
        if (startDate) {
          const startMs = new Date(startDate).getTime();
          if (ts < startMs) return false;
        }
        if (endDate) {
          const endMs = new Date(endDate).setHours(23, 59, 59, 999);
          if (ts > endMs) return false;
        }
      }

      return true;
    }).map((pokemon) => {
      const st = caughtMap[pokemon.id];
      const status: ObtainmentStatus = st.status || (st.caught ? 'caught' : 'uncaught');
      return {
        pokemon,
        status,
        caughtInGame: st.caughtInGame || 'Unassigned',
        notes: st.notes || '',
        timestamp: st.timestamp || 0
      };
    }).sort((a, b) => {
      if (sortOrder === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
      if (sortOrder === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
      if (sortOrder === 'id-asc') return a.pokemon.id - b.pokemon.id;
      if (sortOrder === 'id-desc') return b.pokemon.id - a.pokemon.id;
      return 0;
    });
  }, [caughtMap, timeSpan, startDate, endDate, selectedRegion, selectedGame, selectedStatus, searchQuery, sortOrder]);

  // Breakdown by game for matching filtered list
  const gameBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    historyList.forEach((item) => {
      const g = item.caughtInGame || 'Unassigned';
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [historyList]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '940px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={24} color="var(--accent-blue)" />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Collection History & Game Audit Log</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Track when & where each Pokémon was caught across games and timeframes.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.9rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1rem'
          }}
        >
          {/* Time Span Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <Calendar size={13} /> Timeframe
            </label>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={timeSpan}
              onChange={(e) => setTimeSpan(e.target.value as TimeSpanOption)}
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Region / Generation Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <Filter size={13} /> Region / Gen
            </label>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">All Regions / Gens</option>
              {REGIONS.filter(r => r.id !== 'all').map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.genName})
                </option>
              ))}
            </select>
          </div>

          {/* Origin Game Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <Gamepad2 size={13} /> Origin Game
            </label>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <option value="all">All Origin Games</option>
              <option value="none">Unassigned (No Game Set)</option>
              {ALL_GAME_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Obtainment Status Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <GitBranch size={13} /> Status
            </label>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Acquired (Caught & Base)</option>
              <option value="caught_only">Fully Evolved / Caught Only</option>
              <option value="has_base">Has Base Form (Needs Evolution)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <ArrowUpDown size={13} /> Sort Order
            </label>
            <select
              className="select-control"
              style={{ width: '100%' }}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="id-asc">Dex # (Low to High)</option>
              <option value="id-desc">Dex # (High to Low)</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
              <Search size={13} /> Search
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
              placeholder="Search name, #, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Custom Date Inputs if custom timeframe selected */}
        {timeSpan === 'custom' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Start Date</label>
              <input 
                type="date" 
                className="select-control"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>End Date</label>
              <input 
                type="date" 
                className="select-control"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </div>
        )}

        {/* Summary Stats Pill Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', padding: '0.4rem 0.2rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Showing <strong>{historyList.length}</strong> matching entries
          </div>
          {gameBreakdown.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {gameBreakdown.slice(0, 4).map(([gameName, count]) => (
                <span key={gameName} className="origin-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  {gameName}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.6)' }}>
          {historyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <History size={40} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>No matching catch entries found.</p>
              <p style={{ fontSize: '0.85rem' }}>Try broadening your timeframe, region, or origin game filters.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Pokémon</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Region / Gen</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Game Caught In</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map(({ pokemon, status, caughtInGame, notes, timestamp }) => {
                  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);
                  const isHasBase = status === 'has_base';
                  const formattedTime = timestamp > 0 
                    ? new Date(timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Earlier';

                  return (
                    <tr 
                      key={pokemon.id}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                      className="history-row"
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {formattedTime}
                      </td>

                      {/* Pokemon Name & Sprite */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <img 
                            src={spriteUrl} 
                            alt={pokemon.name} 
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                          />
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                              #{String(pokemon.id).padStart(4, '0')}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {pokemon.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Region */}
                      <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {pokemon.region} (Gen {pokemon.gen})
                      </td>

                      {/* Game Caught In */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="origin-tag">
                          {caughtInGame}
                        </span>
                      </td>

                      {/* Obtainment Status Badge */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isHasBase ? (
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.3rem', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '6px', 
                              background: 'rgba(245, 158, 11, 0.2)', 
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <GitBranch size={12} /> Has Base Form
                          </span>
                        ) : (
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.3rem', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '6px', 
                              background: 'rgba(16, 185, 129, 0.2)', 
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Check size={12} /> Caught
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontStyle: notes ? 'normal' : 'italic' }}>
                        {notes ? notes : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
