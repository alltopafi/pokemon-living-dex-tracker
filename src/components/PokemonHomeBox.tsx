import React from 'react';
import { Package, CheckCircle2, GitBranch } from 'lucide-react';
import { HomeBoxData, Pokemon, SpriteStyle, CaughtStateMap, RegionId } from '../types/pokemon';
import { PokemonCard } from './PokemonCard';
import { getPokemonBoxLocation } from '../utils/boxHelper';

interface PokemonHomeBoxProps {
  box: HomeBoxData;
  caughtMap: CaughtStateMap;
  spriteStyle: SpriteStyle;
  onToggleCaught: (id: number) => void;
  onOpenDetail: (pokemon: Pokemon) => void;
  isBatchMode: boolean;
  selectedBatchIds: Set<number>;
  onToggleBatchSelect: (id: number) => void;
  activeRegion: RegionId;
}

export const PokemonHomeBox: React.FC<PokemonHomeBoxProps> = ({
  box,
  caughtMap,
  spriteStyle,
  onToggleCaught,
  onOpenDetail,
  isBatchMode,
  selectedBatchIds,
  onToggleBatchSelect,
  activeRegion
}) => {
  const isCompleted = box.caughtCount === box.pokemonList.length;
  const percentage = Math.round((box.caughtCount / box.pokemonList.length) * 100);
  const hasBaseCount = box.hasBaseCount || 0;

  return (
    <div className={`home-box-card ${isCompleted ? 'completed' : ''}`}>
      <div className="home-box-header">
        <div className="home-box-title-group">
          <Package size={18} color="var(--accent-blue)" />
          <span className="home-box-name">Box {box.boxNumber}</span>
          <span className="home-box-prefix-badge">{box.boxTitle}</span>
        </div>

        <div className="home-box-progress">
          {hasBaseCount > 0 && (
            <span style={{ fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem', marginRight: '0.4rem' }}>
              <GitBranch size={13} /> {hasBaseCount} Base
            </span>
          )}
          {isCompleted && <CheckCircle2 size={16} color="var(--accent-green)" />}
          <span>{box.caughtCount}/{box.pokemonList.length} ({percentage}%)</span>
        </div>
      </div>

      <div className="home-box-grid">
        {box.pokemonList.map((pokemon) => {
          const loc = getPokemonBoxLocation(pokemon, activeRegion);
          const st = caughtMap[pokemon.id];

          return (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              isCaught={!!st?.caught}
              status={st?.status}
              spriteStyle={spriteStyle}
              onToggleCaught={onToggleCaught}
              onOpenDetail={onOpenDetail}
              isBatchMode={isBatchMode}
              isSelectedInBatch={selectedBatchIds.has(pokemon.id)}
              onToggleBatchSelect={onToggleBatchSelect}
              boxLocation={loc.locationString}
            />
          );
        })}
      </div>
    </div>
  );
};
