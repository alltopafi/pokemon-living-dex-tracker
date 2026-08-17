import React from 'react';
import { Check, Info, CheckSquare, Square, GitBranch } from 'lucide-react';
import { Pokemon, SpriteStyle, ObtainmentStatus } from '../types/pokemon';
import { getSpriteUrl } from '../utils/storage';

interface PokemonCardProps {
  pokemon: Pokemon;
  isCaught: boolean;
  status?: ObtainmentStatus;
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
  status = isCaught ? 'caught' : 'uncaught',
  spriteStyle,
  onOpenDetail,
  isBatchMode = false,
  isSelectedInBatch = false,
  onToggleBatchSelect,
  boxLocation
}) => {
  const formattedId = `#${String(pokemon.id).padStart(4, '0')}`;
  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);

  const isHasBase = status === 'has_base';
  const isFullyCaught = isCaught || status === 'caught';

  const handleCardClick = () => {
    if (isBatchMode && onToggleBatchSelect) {
      onToggleBatchSelect(pokemon.id);
    } else {
      onOpenDetail(pokemon);
    }
  };

  const statusLabel = isFullyCaught ? 'Caught' : isHasBase ? 'Base Form Acquired (Needs Evolution)' : 'Uncaught';

  return (
    <div 
      className={`pokemon-card ${isFullyCaught ? 'caught' : isHasBase ? 'has-base' : ''} ${isBatchMode ? 'batch-mode' : ''} ${isSelectedInBatch ? 'batch-selected' : ''}`}
      onClick={handleCardClick}
      title={`${pokemon.name} - ${statusLabel}${boxLocation ? ` (${boxLocation})` : ''}`}
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
        <div className={`caught-badge ${isHasBase ? 'badge-has-base' : ''}`}>
          {isFullyCaught ? (
            <Check size={14} strokeWidth={3} />
          ) : isHasBase ? (
            <span title="Has Base Form (Needs Evolution)">
              <GitBranch size={13} strokeWidth={2.5} />
            </span>
          ) : null}
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
          title="View Origin Region Rules, Locations & Change Status"
        >
          <Info size={13} />
        </button>
      </div>
    </div>
  );
};
