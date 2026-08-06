import React, { useRef } from 'react';
import { Search, Download, Upload, BarChart3, Settings, CheckCircle2 } from 'lucide-react';
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
}

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
  onOpenStats
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePercentage = regionTotal > 0 
    ? ((regionCaught / regionTotal) * 100).toFixed(1) 
    : '0.0';

  const totalPercentage = totalDex > 0
    ? ((totalCaught / totalDex) * 100).toFixed(1)
    : '0.0';

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
          <button className="action-btn" onClick={onOpenStats} title="View Detailed Dex Breakdown">
            <BarChart3 size={16} />
            <span>Stats</span>
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
              <option value="home">Pokemon HOME 3D</option>
              <option value="pixel">Classic Sprite</option>
            </select>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <div className="progress-title-group">
            <CheckCircle2 size={20} color="var(--accent-blue)" />
            <span>{activeRegionName} Progress</span>
          </div>
          <div className="progress-counter">
            {regionCaught} / {regionTotal} ({activePercentage}%)
          </div>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${activePercentage}%` }} 
          />
        </div>
        {activeRegionName !== 'National Dex' && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '-0.25rem' }}>
            National Dex: {totalCaught} / {totalDex} ({totalPercentage}%)
          </div>
        )}
      </div>

      <div className="filter-bar">
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
          <option value="caught">Caught Only</option>
          <option value="uncaught">Uncaught Only</option>
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
          <option value="id-asc">Sort by # (Low to High)</option>
          <option value="id-desc">Sort by # (High to Low)</option>
          <option value="name-asc">Sort by Name (A-Z)</option>
          <option value="name-desc">Sort by Name (Z-A)</option>
        </select>
      </div>
    </header>
  );
};
