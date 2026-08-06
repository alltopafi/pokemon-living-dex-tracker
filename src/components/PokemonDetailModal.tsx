import React, { useState, useEffect } from 'react';
import { X, Check, Gamepad2, ShieldCheck, FileText, MapPin, Loader2, Sparkles } from 'lucide-react';
import { Pokemon, PokemonCaughtStatus, SpriteStyle } from '../types/pokemon';
import { getSpriteUrl } from '../utils/storage';
import { getPokemonObtainDetails, ObtainInfo } from '../services/encounterService';

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

  // Active game selection for location lookup
  const [selectedGame, setSelectedGame] = useState<string | null>(pokemon.validGames[0] || null);
  const [loadingObtain, setLoadingObtain] = useState<boolean>(false);
  const [obtainInfo, setObtainInfo] = useState<ObtainInfo | null>(null);

  useEffect(() => {
    setNotes(status?.notes || '');
    setCaughtInGame(status?.caughtInGame || '');
    setSelectedGame(pokemon.validGames[0] || null);
  }, [pokemon, status]);

  // Fetch encounter locations / obtainment requirements when selectedGame changes
  useEffect(() => {
    if (selectedGame && pokemon) {
      let isMounted = true;
      setLoadingObtain(true);
      
      getPokemonObtainDetails(pokemon.id, pokemon.name, selectedGame)
        .then((info) => {
          if (isMounted) {
            setObtainInfo(info);
            setLoadingObtain(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setObtainInfo(null);
            setLoadingObtain(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [selectedGame, pokemon]);

  const handleSaveNotes = () => {
    onUpdateNotes(pokemon.id, notes, caughtInGame);
  };

  const spriteUrl = getSpriteUrl(pokemon.id, spriteStyle);
  const formattedId = `#${String(pokemon.id).padStart(4, '0')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
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
            Must be caught in debut region <strong>{pokemon.region.toUpperCase()}</strong> or official region remakes.
          </p>
          
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
              <Gamepad2 size={14} color="var(--accent-blue)" /> Click a Game Title to View Locations & Method:
            </div>
            <div className="game-pills-container">
              {pokemon.validGames.map(game => (
                <button 
                  key={game} 
                  className={`game-pill ${selectedGame === game ? 'active' : ''}`}
                  onClick={() => setSelectedGame(game)}
                  title={`Click to view ${pokemon.name} locations in ${game}`}
                >
                  <MapPin size={12} />
                  <span>{game}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Game Encounter / Location Box */}
          {selectedGame && (
            <div className="encounter-details-box">
              <div className="encounter-header">
                <span>Locations & Obtaining in {selectedGame}</span>
                {loadingObtain && <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
              </div>

              {loadingObtain ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem' }}>
                  Fetching location & encounter data...
                </div>
              ) : obtainInfo?.locations && obtainInfo.locations.length > 0 ? (
                <div className="location-list">
                  {obtainInfo.locations.map((loc, idx) => (
                    <div key={idx} className="location-item">
                      <div className="location-name">
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-blue)' }} />
                        {loc.locationName}
                      </div>
                      <div className="location-meta">
                        <span className="method-tag">{loc.method}</span>
                        {loc.minLevel > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Lv {loc.minLevel}{loc.maxLevel > loc.minLevel ? `-${loc.maxLevel}` : ''}
                          </span>
                        )}
                        <span className="chance-tag">{loc.chance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', background: 'rgba(30, 41, 59, 0.6)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                  <span>{obtainInfo?.evolutionOrSpecial || `Obtainable in ${selectedGame} via evolution, gift, or NPC trade.`}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '0.85rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Gamepad2 size={14} /> Game Caught In:
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
            <FileText size={14} /> Notes / OT / ID / Pokeball:
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
