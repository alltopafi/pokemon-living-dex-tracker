import React from 'react';
import { X, Trophy, CheckCircle, CircleDot } from 'lucide-react';
import { REGIONS } from '../data/pokemonData';
import { CaughtStateMap } from '../types/pokemon';

interface StatsModalProps {
  caughtMap: CaughtStateMap;
  onClose: () => void;
}

export const StatsDashboardModal: React.FC<StatsModalProps> = ({ caughtMap, onClose }) => {
  const totalCaught = Object.values(caughtMap).filter(
    c => c.caught || c.status === 'caught' || c.status === 'has_base'
  ).length;

  const totalDex = 1025;
  const globalPct = ((totalCaught / totalDex) * 100).toFixed(1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Trophy size={24} color="var(--accent-gold)" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Living Dex Breakdown</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Overall Progress: <strong>{totalCaught}</strong> / {totalDex} ({globalPct}%)
            </p>
          </div>
        </div>

        <div className="stats-grid">
          {REGIONS.filter(r => r.id !== 'all').map((region) => {
            let caughtCount = 0;
            for (let i = region.startId; i <= region.endId; i++) {
              const st = caughtMap[i];
              if (st?.caught || st?.status === 'caught' || st?.status === 'has_base') {
                caughtCount++;
              }
            }
            const pct = ((caughtCount / region.total) * 100).toFixed(1);
            const isCompleted = caughtCount === region.total;

            return (
              <div 
                key={region.id} 
                className="stat-card"
                style={{ borderColor: isCompleted ? 'rgba(52, 211, 153, 0.4)' : undefined }}
              >
                <div className="stat-card-title">
                  <span>{region.name} ({region.genName})</span>
                  {isCompleted ? (
                    <CheckCircle size={16} color="var(--accent-green)" />
                  ) : (
                    <CircleDot size={16} color="var(--text-muted)" />
                  )}
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {caughtCount} / {region.total}
                </div>

                <div className="progress-bar-bg" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${pct}%`,
                      background: isCompleted ? 'var(--accent-green)' : undefined
                    }} 
                  />
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
                  {pct}% Complete
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
