import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// Default Target Shutdown Date: December 31, 2026 23:59:59 UTC
const SHUTDOWN_TARGET_TIMESTAMP = new Date('2026-12-31T23:59:59Z').getTime();

const BANNER_DISMISSED_KEY = 'pokemon_bank_banner_minimized_v1';

export const BankShutdownBanner: React.FC = () => {
  const [now, setNow] = useState<number>(Date.now());
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMinimized = () => {
    const next = !isMinimized;
    setIsMinimized(next);
    localStorage.setItem(BANNER_DISMISSED_KEY, String(next));
  };

  // Time remaining calculation
  const totalDifference = Math.max(0, SHUTDOWN_TARGET_TIMESTAMP - now);
  const days = Math.floor(totalDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalDifference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalDifference / (1000 * 60)) % 60);
  const seconds = Math.floor((totalDifference / 1000) % 60);

  return (
    <div className={`bank-banner ${isMinimized ? 'minimized' : ''}`}>
      <div className="bank-banner-header">
        <div className="bank-banner-title">
          <div className="bank-icon-glow">
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div>
            <span className="bank-headline">Pokémon Bank Shutdown Countdown</span>
            <span className="bank-subtext">Estimated Service End: Dec 31, 2026</span>
          </div>
        </div>

        <div className="bank-header-right">
          <div className="bank-mini-counter">
            <Clock size={14} color="var(--accent-red)" />
            <span>{days}d {hours}h {minutes}m {seconds}s</span>
          </div>
          <button 
            className="bank-toggle-btn" 
            onClick={toggleMinimized}
            title={isMinimized ? "Expand Countdown Banner" : "Minimize Banner"}
          >
            {isMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="bank-banner-body">
          <div className="bank-timer-grid">
            <div className="timer-box">
              <span className="timer-value">{days}</span>
              <span className="timer-label">DAYS</span>
            </div>
            <div className="timer-divider">:</div>
            <div className="timer-box">
              <span className="timer-value">{String(hours).padStart(2, '0')}</span>
              <span className="timer-label">HOURS</span>
            </div>
            <div className="timer-divider">:</div>
            <div className="timer-box">
              <span className="timer-value">{String(minutes).padStart(2, '0')}</span>
              <span className="timer-label">MINUTES</span>
            </div>
            <div className="timer-divider">:</div>
            <div className="timer-box">
              <span className="timer-value">{String(seconds).padStart(2, '0')}</span>
              <span className="timer-label">SECONDS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
