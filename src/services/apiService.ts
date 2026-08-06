import { CaughtStateMap } from '../types/pokemon';

const API_BASE = '/api';

export interface UserLoginResult {
  user: {
    id: number;
    username: string;
  };
  caughtMap: CaughtStateMap;
}

export async function loginUser(username: string): Promise<UserLoginResult | null> {
  try {
    const res = await fetch(`${API_BASE}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }

    return await res.json();
  } catch (e) {
    console.warn('Backend API login unavailable or offline, using fallback mode', e);
    return null;
  }
}

export async function syncCaughtState(username: string, caughtMap: CaughtStateMap): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/caught/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, caughtMap })
    });

    return res.ok;
  } catch (e) {
    console.warn('Failed to sync to PostgreSQL backend', e);
    return false;
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
