import React from 'react';
import { Check, Info } from 'lucide-react';
import { Pokemon, SpriteStyle } from '../types/pokemon';
import { getSpriteUrl } from '../utils/storage';

interface PokemonCardProps {
  pokemon: Pokemon;
  isCaught: boolean;
  spriteStyle: SpriteStyle;
  onToggleCaught: (id: number) => void;
  onOpenDetail: (pokemon: Pokemon) => void;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  isCaught,
  spriteStyle,
  onToggleCaught,
  onOpenDetail
}) => {
  const formattedId = `#${String(pokemon.id).padStart(4, '0')}`;
  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking directly on info button, don't toggle caught
    const target = e.target as HTMLElement;
    if (target.closest('.info-btn')) {
      return;
    }
    onToggleCaught(pokemon.id);
  };

  return (
    <div 
      className={`pokemon-card ${isCaught ? 'caught' : ''}`}
      onClick={handleCardClick}
      title={`${pokemon.name} - ${isCaught ? 'Caught' : 'Uncaught'} (Click to toggle)`}
    >
      <div className="dex-number">{formattedId}</div>
      <div className="caught-badge">
        {isCaught && <Check size={14} strokeWidth={3} />}
      </div>

      <div className="sprite-container">
        <img 
          src={spriteUrl} 
          alt={pokemon.name}
          className="pokemon-sprite"
          loading="lazy"
          onError={(e) => {
            // Fallback if high res artwork isn't found
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
        <span className="origin-tag">
          {pokemon.region.toUpperCase()}
        </span>
        <button 
          className="info-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(pokemon);
          }}
          title="View Origin Region Rules & Notes"
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
