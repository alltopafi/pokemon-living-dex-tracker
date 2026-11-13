import React from 'react';
import { Check, Info, CheckSquare, Square, GitBranch, Home, Upload } from 'lucide-react';
import { Pokemon, SpriteStyle, ObtainmentStatus, RegionId } from '../types/pokemon';
import { getSpriteUrl } from '../utils/storage';
import { getRegionalDexNumber } from '../data/pokemonData';

interface PokemonCardProps {
  pokemon: Pokemon;
  isCaught: boolean;
  status?: ObtainmentStatus;
  spriteStyle: SpriteStyle;
  onToggleCaught: (id: number) => void;
  inHome?: boolean;
  onToggleInHome?: (id: number) => void;
  onOpenDetail: (pokemon: Pokemon) => void;
  isBatchMode?: boolean;
  isSelectedInBatch?: boolean;
  onToggleBatchSelect?: (id: number) => void;
  boxLocation?: string; // Optional: e.g. "K Box 1 Slot 1" when in HOME Box view mode
  activeRegion?: RegionId;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  isCaught,
  status = isCaught ? 'caught' : 'uncaught',
  spriteStyle,
  onOpenDetail,
  inHome = false,
  onToggleInHome,
  isBatchMode = false,
  isSelectedInBatch = false,
  onToggleBatchSelect,
  boxLocation,
  activeRegion
}) => {
  const nationalFormattedId = `#${String(pokemon.id).padStart(4, '0')}`;
  const regionalNumber = activeRegion && activeRegion !== 'all' ? getRegionalDexNumber(pokemon.id, activeRegion) : null;
  const regionalFormattedId = regionalNumber !== null ? `#${String(regionalNumber).padStart(3, '0')}` : null;
  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);

  const isHasBase = status === 'has_base';
  const isFullyCaught = isCaught || status === 'caught';

  const handleHomeStripClick = (e: React.MouseEvent) => {
    // In batch mode the strip is informational only; let the click select the card
    if (isBatchMode || !onToggleInHome) return;
    e.stopPropagation();
    onToggleInHome(pokemon.id);
  };

  const handleCardClick = () => {
    if (isBatchMode && onToggleBatchSelect) {
      onToggleBatchSelect(pokemon.id);
    } else {
      onOpenDetail(pokemon);
    }
  };

  const homeLabel = isFullyCaught ? (inHome ? 'In HOME' : 'Needs transfer to HOME') : '';
  const statusLabel = isFullyCaught ? `Caught - ${homeLabel}` : isHasBase ? 'Base Form Acquired (Needs Evolution)' : 'Uncaught';
  const displayIdTooltip = regionalFormattedId ? `${regionalFormattedId} (Nat. ${nationalFormattedId})` : nationalFormattedId;

  return (
    <div 
      className={`pokemon-card ${isFullyCaught ? 'caught' : isHasBase ? 'has-base' : ''} ${isBatchMode ? 'batch-mode' : ''} ${isSelectedInBatch ? 'batch-selected' : ''}`}
      onClick={handleCardClick}
      title={`${pokemon.name} - ${displayIdTooltip} - ${statusLabel}${boxLocation ? ` (${boxLocation})` : ''}`}
    >
      <div className="dex-number-group">
        <span className="dex-number">{regionalFormattedId || nationalFormattedId}</span>
        {regionalFormattedId && (
          <span className="dex-nat-number">Nat. {nationalFormattedId}</span>
        )}
      </div>

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '0.4rem', marginBottom: isFullyCaught ? '0.55rem' : undefined }}>
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

      {isFullyCaught && (
        <button
          type="button"
          className={`home-strip ${inHome ? 'in-home' : 'needs-transfer'} ${isBatchMode ? 'static' : ''}`}
          onClick={handleHomeStripClick}
          title={isBatchMode ? homeLabel : inHome ? 'In HOME - click to mark as not transferred' : 'Needs transfer - click to mark as in HOME'}
        >
          {inHome ? <Home size={12} strokeWidth={2.5} /> : <Upload size={12} strokeWidth={2.5} />}
          <span>{inHome ? 'In HOME' : 'Needs transfer'}</span>
        </button>
      )}
    </div>
  );
};
