import React, { useRef } from 'react';
import { Search, Download, Upload, BarChart3, Settings, Layers, User, Database, RefreshCw, LayoutGrid, Package, History } from 'lucide-react';
import { FilterState, SpriteStyle } from '../types/pokemon';

interface HeaderProps {
  totalCaught: number;
  totalDex: number;
  activeRegionName: string;
  regionCaught: number;
  regionTotal: number;
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  spriteStyle: SpriteStyle;
  onSpriteStyleChange: (style: SpriteStyle) => void;
  onExport: () => void;
  onImport: (content: string) => void;
  onOpenStats: () => void;
  onOpenHistory: () => void;
  isBatchMode: boolean;
  onToggleBatchMode: () => void;
  username: string | null;
  onOpenUserModal: () => void;
  onManualSync: () => void;
  isSyncing?: boolean;
}

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

export const Header: React.FC<HeaderProps> = ({
  totalCaught,
  totalDex,
  activeRegionName,
  regionCaught,
  regionTotal,
  filterState,
  onFilterChange,
  spriteStyle,
  onSpriteStyleChange,
  onExport,
  onImport,
  onOpenStats,
  onOpenHistory,
  isBatchMode,
  onToggleBatchMode,
  username,
  onOpenUserModal,
  onManualSync,
  isSyncing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const globalPercentage = Math.round((totalCaught / totalDex) * 100);
  const regionPercentage = Math.round((regionCaught / regionTotal) * 100);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImport(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="header-card">
      <div className="brand-row">
        <div className="brand-title">
          <img src="/pokeball.svg" alt="Pokeball" />
          <div>
            <h1>Living Dex Tracker</h1>
          </div>
          <span className="badge">PWA</span>
        </div>

        <div className="header-actions">
          {/* Sync Now Button */}
          <button 
            className="action-btn"
            onClick={onManualSync}
            disabled={isSyncing}
            title={username ? `Sync & merge collection with Database (@${username})` : 'Click to log in and sync to Database'}
            style={{
              borderColor: 'rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#ffffff'
            }}
          >
            <RefreshCw 
              size={16} 
              color="var(--accent-blue)" 
              style={{ animation: isSyncing ? 'spin 1s linear infinite' : undefined }} 
            />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {/* Username / DB Sync Badge */}
          <button 
            className="action-btn"
            onClick={onOpenUserModal}
            title={username ? `Logged in as ${username} (Click to manage)` : 'Set Username to sync to PostgreSQL'}
            style={{
              borderColor: username ? 'rgba(56, 189, 248, 0.4)' : undefined,
              background: username ? 'rgba(56, 189, 248, 0.15)' : undefined
            }}
          >
            {username ? (
              <Database size={16} color="var(--accent-blue)" />
            ) : (
              <User size={16} />
            )}
            <span>{username ? `@${username}` : 'Set Username'}</span>
          </button>

          <button 
            className="action-btn" 
            onClick={onToggleBatchMode} 
            title="Batch Edit Mode"
            style={{
              borderColor: isBatchMode ? 'var(--accent-purple)' : undefined,
              background: isBatchMode ? 'rgba(129, 140, 248, 0.2)' : undefined,
              color: isBatchMode ? '#ffffff' : undefined
            }}
          >
            <Layers size={16} color={isBatchMode ? 'var(--accent-purple)' : undefined} />
            <span>{isBatchMode ? 'Exit Batch Mode' : 'Batch Edit'}</span>
          </button>

          <button className="action-btn" onClick={onOpenStats} title="View Detailed Dex Breakdown">
            <BarChart3 size={16} />
            <span>Stats</span>
          </button>

          <button className="action-btn" onClick={onOpenHistory} title="View Catch History & Game Audit Log">
            <History size={16} color="var(--accent-blue)" />
            <span>History Log</span>
          </button>

          <button className="action-btn" onClick={onExport} title="Export Progress Backup JSON">
            <Download size={16} />
            <span>Export</span>
          </button>

          <button className="action-btn" onClick={() => fileInputRef.current?.click()} title="Import Progress Backup JSON">
            <Upload size={16} />
            <span>Import</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            style={{ display: 'none' }} 
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Settings size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="select-control"
              value={spriteStyle}
              onChange={(e) => onSpriteStyleChange(e.target.value as SpriteStyle)}
              title="Select Sprite Style"
            >
              <option value="official-artwork">Official Artwork</option>
              <option value="home">Pokémon HOME</option>
              <option value="pixel">Classic Pixel</option>
            </select>
          </div>
        </div>
      </div>

      <div className="progress-section">
        {/* Active Region Meter */}
        <div className="progress-group">
          <div className="progress-info">
            <span className="progress-label">{activeRegionName} Region Progress</span>
            <span className="progress-count">
              {regionCaught} / {regionTotal}
              <span className="progress-percentage">({regionPercentage}%)</span>
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${regionPercentage}%` }} />
          </div>
        </div>

        {/* Total National Dex Meter */}
        <div className="progress-group">
          <div className="progress-info">
            <span className="progress-label">National Dex Progress</span>
            <span className="progress-count">
              {totalCaught} / {totalDex}
              <span className="progress-percentage">({globalPercentage}%)</span>
            </span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${globalPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Controls Bar (Search, Sort, Filters) */}
      <div className="controls-row">
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-toggle-btn ${filterState.viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onFilterChange({ viewMode: 'grid' })}
            title="Grid View Mode"
          >
            <LayoutGrid size={15} />
            <span>Grid</span>
          </button>
          <button
            className={`view-toggle-btn ${filterState.viewMode === 'home-box' ? 'active' : ''}`}
            onClick={() => onFilterChange({ viewMode: 'home-box' })}
            title="Pokemon HOME Boxes View (6x5)"
          >
            <Package size={15} />
            <span>HOME Boxes</span>
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or number (e.g. #25 or Pikachu)..."
            value={filterState.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        <select
          className="select-control"
          value={filterState.status}
          onChange={(e) => onFilterChange({ status: e.target.value as any })}
        >
          <option value="all">All Status</option>
          <option value="caught">Caught & Acquired (Incl. Base Forms)</option>
          <option value="caught_only">Fully Evolved / Caught Only</option>
          <option value="has_base">Has Base Form Only (Needs Evolution)</option>
          <option value="uncaught">Uncaught Only</option>
        </select>

        <select
          className="select-control"
          value={filterState.game}
          onChange={(e) => onFilterChange({ game: e.target.value })}
          title="Filter by Game Caught In"
        >
          <option value="all">All Origin Games</option>
          <option value="none">Unassigned (No Game Selected)</option>
          {ALL_GAME_OPTIONS.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          className="select-control"
          value={filterState.type}
          onChange={(e) => onFilterChange({ type: e.target.value })}
        >
          <option value="all">All Types</option>
          <option value="Normal">Normal</option>
          <option value="Fire">Fire</option>
          <option value="Water">Water</option>
          <option value="Grass">Grass</option>
          <option value="Electric">Electric</option>
          <option value="Ice">Ice</option>
          <option value="Fighting">Fighting</option>
          <option value="Poison">Poison</option>
          <option value="Ground">Ground</option>
          <option value="Flying">Flying</option>
          <option value="Psychic">Psychic</option>
          <option value="Bug">Bug</option>
          <option value="Rock">Rock</option>
          <option value="Ghost">Ghost</option>
          <option value="Dragon">Dragon</option>
          <option value="Steel">Steel</option>
          <option value="Fairy">Fairy</option>
          <option value="Dark">Dark</option>
        </select>

        <select
          className="select-control"
          value={filterState.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
        >
          <option value="id-asc">Dex Number (Low to High)</option>
          <option value="id-desc">Dex Number (High to Low)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>
    </header>
  );
};
