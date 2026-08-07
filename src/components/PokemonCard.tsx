import React from 'react';
import { Check, Info, CheckSquare, Square } from 'lucide-react';
import { Pokemon, SpriteStyle } from '../types/pokemon';
import { getSpriteUrl } from '../utils/storage';

interface PokemonCardProps {
  pokemon: Pokemon;
  isCaught: boolean;
  spriteStyle: SpriteStyle;
  onToggleCaught: (id: number) => void;
  onOpenDetail: (pokemon: Pokemon) => void;
  isBatchMode?: boolean;
  isSelectedInBatch?: boolean;
  onToggleBatchSelect?: (id: number) => void;
  boxLocation?: string; // Optional: e.g. "K Box 1 Slot 1" when in HOME Box view mode
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  isCaught,
  spriteStyle,
  onToggleCaught,
  onOpenDetail,
  isBatchMode = false,
  isSelectedInBatch = false,
  onToggleBatchSelect,
  boxLocation
}) => {
  const formattedId = `#${String(pokemon.id).padStart(4, '0')}`;
  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking directly on info button, don't toggle
    const target = e.target as HTMLElement;
    if (target.closest('.info-btn')) {
      return;
    }

    if (isBatchMode && onToggleBatchSelect) {
      onToggleBatchSelect(pokemon.id);
    } else {
      onToggleCaught(pokemon.id);
    }
  };

  return (
    <div 
      className={`pokemon-card ${isCaught ? 'caught' : ''} ${isBatchMode ? 'batch-mode' : ''} ${isSelectedInBatch ? 'batch-selected' : ''}`}
      onClick={handleCardClick}
      title={`${pokemon.name} - ${isCaught ? 'Caught' : 'Uncaught'}${boxLocation ? ` (${boxLocation})` : ''}`}
    >
      <div className="dex-number">{formattedId}</div>

      {isBatchMode ? (
        <div className={`batch-checkbox ${isSelectedInBatch ? 'checked' : ''}`}>
          {isSelectedInBatch ? (
            <CheckSquare size={18} color="var(--accent-purple)" />
          ) : (
            <Square size={18} color="var(--text-muted)" />
          )}
        </div>
      ) : (
        <div className="caught-badge">
          {isCaught && <Check size={14} strokeWidth={3} />}
        </div>
      )}

      <div className="sprite-container">
        <img 
          src={spriteUrl} 
          alt={pokemon.name}
          className="pokemon-sprite"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
          }}
        />
      </div>

      <div className="pokemon-name">{pokemon.name}</div>

      <div className="types-row">
        {pokemon.types.map((type) => (
          <span key={type} className={`type-pill type-${type}`}>
            {type}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '0.4rem' }}>
        <span className={`origin-tag ${boxLocation ? 'home-box-tag' : ''}`}>
          {boxLocation ? boxLocation : pokemon.region.toUpperCase()}
        </span>
        <button 
          className="info-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(pokemon);
          }}
          title="View Origin Region Rules & Locations"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Info size={14} />
        </button>
      </div>
    </div>
  );
};
