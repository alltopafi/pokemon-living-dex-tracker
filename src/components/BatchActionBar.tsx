import React, { useState } from 'react';
import { Check, X, Gamepad2, FileText, CheckSquare, Square, Sparkles } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  totalVisibleCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApplyBatchUpdate: (options: {
    status?: 'caught' | 'uncaught';
    caughtInGame?: string;
    notes?: string;
  }) => void;
  onExitBatchMode: () => void;
}

const COMMON_GAMES = [
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

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  totalVisibleCount,
  onSelectAll,
  onDeselectAll,
  onApplyBatchUpdate,
  onExitBatchMode
}) => {
  const [markStatus, setMarkStatus] = useState<'keep' | 'caught' | 'uncaught'>('caught');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>('');

  const isAllSelected = selectedCount > 0 && selectedCount === totalVisibleCount;

  const handleApply = () => {
    if (selectedCount === 0) return;

    onApplyBatchUpdate({
      status: markStatus === 'keep' ? undefined : markStatus,
      caughtInGame: selectedGame || undefined,
      notes: batchNotes.trim() || undefined
    });
  };

  return (
    <div className="batch-bar-container">
      <div className="batch-bar-header">
        <div className="batch-count-group">
          <Sparkles size={18} color="var(--accent-purple)" />
          <span className="batch-title">Batch Edit Mode</span>
          <span className="batch-pill">{selectedCount} Selected</span>
        </div>

        <div className="batch-quick-select">
          <button 
            className="batch-sub-btn" 
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
          >
            {isAllSelected ? <Square size={14} /> : <CheckSquare size={14} />}
            <span>{isAllSelected ? 'Deselect All' : `Select All (${totalVisibleCount})`}</span>
          </button>
          
          <button className="batch-exit-btn" onClick={onExitBatchMode} title="Exit Batch Edit Mode">
            <X size={16} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      <div className="batch-bar-controls">
        <div className="batch-field">
          <label><Check size={14} /> Status:</label>
          <select 
            className="select-control"
            value={markStatus}
            onChange={(e) => setMarkStatus(e.target.value as any)}
          >
            <option value="caught">Mark as Caught</option>
            <option value="uncaught">Mark as Uncaught</option>
            <option value="keep">Keep Current Status</option>
          </select>
        </div>

        <div className="batch-field">
          <label><Gamepad2 size={14} /> Game Caught In:</label>
          <select 
            className="select-control"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            <option value="">(Optional) Set Game...</option>
            {COMMON_GAMES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="batch-field" style={{ flex: 1, minWidth: '180px' }}>
          <label><FileText size={14} /> Notes:</label>
          <input 
            type="text"
            className="search-input"
            placeholder="Add notes to all selected..."
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            style={{ padding: '0.45rem 0.75rem' }}
          />
        </div>

        <button 
          className="batch-apply-btn"
          disabled={selectedCount === 0}
          onClick={handleApply}
        >
          <Check size={16} />
          <span>Apply to {selectedCount} Pokemon</span>
        </button>
      </div>
    </div>
  );
};
