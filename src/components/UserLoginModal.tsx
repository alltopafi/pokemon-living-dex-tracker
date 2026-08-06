import React, { useState } from 'react';
import { X, User, Database, ArrowRight, ShieldCheck } from 'lucide-react';

interface UserLoginModalProps {
  currentUsername: string | null;
  onLogin: (username: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  currentUsername,
  onLogin,
  onLogout,
  onClose
}) => {
  const [usernameInput, setUsernameInput] = useState(currentUsername || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim();
    if (!clean) {
      setErrorMsg('Please enter a valid username');
      return;
    }
    if (clean.length < 2) {
      setErrorMsg('Username must be at least 2 characters');
      return;
    }
    setErrorMsg('');
    onLogin(clean);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <User size={24} color="var(--accent-blue)" />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Trainer Profile & Database Sync</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No password needed. Sync your Living Dex to PostgreSQL.
            </p>
          </div>
        </div>

        {currentUsername ? (
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Profile:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)', margin: '0.25rem 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={18} />
              <span>{currentUsername}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={14} color="var(--accent-green)" /> Syncing selections directly to PostgreSQL
            </div>

            <button 
              className="modal-toggle-btn mark-uncaught"
              style={{ marginTop: '1rem' }}
              onClick={onLogout}
            >
              Switch Account / Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Enter Trainer Username:
              </label>
              <div className="search-input-wrapper" style={{ width: '100%' }}>
                <User size={16} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. ash_ketchum or pallet_trainer"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  autoFocus
                />
              </div>
              {errorMsg && (
                <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem', fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}
            </div>

            <button type="submit" className="modal-toggle-btn mark-caught">
              <span>Load / Sync Profile</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
