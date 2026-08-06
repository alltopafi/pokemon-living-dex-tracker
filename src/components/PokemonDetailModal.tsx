import React, { useState, useEffect } from 'react';
import { X, Check, Gamepad2, ShieldCheck, FileText } from 'lucide-react';
import { Pokemon, PokemonCaughtStatus, SpriteStyle } from '../types/pokemon';
import { getSpriteUrl } from '../utils/storage';

interface DetailModalProps {
  pokemon: Pokemon | null;
  status: PokemonCaughtStatus | undefined;
  spriteStyle: SpriteStyle;
  onClose: () => void;
  onToggleCaught: (id: number) => void;
  onUpdateNotes: (id: number, notes: string, caughtInGame: string) => void;
}

export const PokemonDetailModal: React.FC<DetailModalProps> = ({
  pokemon,
  status,
  spriteStyle,
  onClose,
  onToggleCaught,
  onUpdateNotes
}) => {
  if (!pokemon) return null;

  const isCaught = !!status?.caught;
  const [notes, setNotes] = useState(status?.notes || '');
  const [caughtInGame, setCaughtInGame] = useState(status?.caughtInGame || '');

  useEffect(() => {
    setNotes(status?.notes || '');
    setCaughtInGame(status?.caughtInGame || '');
  }, [pokemon, status]);

  const handleSaveNotes = () => {
    onUpdateNotes(pokemon.id, notes, caughtInGame);
  };

  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);
  const formattedId = `#${String(pokemon.id).padStart(4, '0')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <img src={spriteUrl} alt={pokemon.name} className="modal-sprite" />
          <div className="modal-title-group">
            <div style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 700 }}>
              {formattedId}
            </div>
            <h2>{pokemon.name}</h2>
            <div className="types-row" style={{ justifyContent: 'flex-start', marginTop: '0.4rem' }}>
              {pokemon.types.map(t => (
                <span key={t} className={`type-pill type-${t}`}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="origin-rule-box">
          <h4>
            <ShieldCheck size={16} /> Original Region Rule
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Must be caught in original debut region <strong>{pokemon.region.toUpperCase()}</strong> or official region remakes.
          </p>
          
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Gamepad2 size={14} /> Eligible Origin Games:
            </div>
            <div className="game-pills-container">
              {pokemon.validGames.map(game => (
                <span key={game} className="game-pill">{game}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Gamepad2 size={14} /> Game Caught In (Optional):
          </label>
          <select 
            className="select-control"
            style={{ width: '100%', marginTop: '0.3rem' }}
            value={caughtInGame}
            onChange={(e) => {
              setCaughtInGame(e.target.value);
              onUpdateNotes(pokemon.id, notes, e.target.value);
            }}
          >
            <option value="">Select Origin Game...</option>
            {pokemon.validGames.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileText size={14} /> Notes / OT / ID / Pokeball (Optional):
          </label>
          <textarea
            className="notes-field"
            placeholder="Add details (e.g., Premier Ball, OT: Ash, ID: 00151)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
          />
        </div>

        <button 
          className={`modal-toggle-btn ${isCaught ? 'mark-uncaught' : 'mark-caught'}`}
          onClick={() => {
            onToggleCaught(pokemon.id);
          }}
        >
          {isCaught ? (
            <>
              <X size={18} /> Mark as Uncaught
            </>
          ) : (
            <>
              <Check size={18} /> Mark as Caught
            </>
          )}
        </button>
      </div>
    </div>
  );
};
