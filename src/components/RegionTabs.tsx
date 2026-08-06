import React from 'react';
import { RegionId, RegionInfo, CaughtStateMap } from '../types/pokemon';

interface RegionTabsProps {
  regions: RegionInfo[];
  activeRegion: RegionId;
  onSelectRegion: (id: RegionId) => void;
  caughtMap: CaughtStateMap;
}

export const RegionTabs: React.FC<RegionTabsProps> = ({
  regions,
  activeRegion,
  onSelectRegion,
  caughtMap
}) => {
  return (
    <div className="tabs-container">
      {regions.map((region) => {
        let count = 0;
        if (region.id === 'all') {
          count = Object.values(caughtMap).filter(v => v.caught).length;
        } else {
          for (let i = region.startId; i <= region.endId; i++) {
            if (caughtMap[i]?.caught) {
              count++;
            }
          }
        }

        const percentage = Math.round((count / region.total) * 100);

        return (
          <button
            key={region.id}
            className={`tab-btn ${activeRegion === region.id ? 'active' : ''}`}
            onClick={() => onSelectRegion(region.id)}
          >
            <span>{region.name}</span>
            <span className="tab-badge">{count}/{region.total} ({percentage}%)</span>
          </button>
        );
      })}
    </div>
  );
};
