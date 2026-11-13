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

export async function fetchUserCaughtState(username: string): Promise<CaughtStateMap | null> {
  try {
    const res = await fetch(`${API_BASE}/caught/${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.caughtMap || null;
  } catch (e) {
    console.warn('Failed to fetch caught state from backend', e);
    return null;
  }
}

export async function syncCaughtState(username: string, caughtMap: CaughtStateMap): Promise<CaughtStateMap | null> {
  try {
    const res = await fetch(`${API_BASE}/caught/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, caughtMap })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.caughtMap || null;
  } catch (e) {
    console.warn('Failed to sync to PostgreSQL backend', e);
    return null;
  }
}

export type ApiResult =
  | { ok: true; caughtMap: CaughtStateMap }
  | { ok: false; error: string };

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || `Server responded with ${res.status}`;
  } catch {
    return `Server responded with ${res.status}`;
  }
}

/** Push the local collection to the database. Distinguishes failure from an empty result. */
export async function uploadCaughtState(username: string, caughtMap: CaughtStateMap): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/caught/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, caughtMap })
    });
    if (!res.ok) return { ok: false, error: await readError(res) };
    const data = await res.json();
    return { ok: true, caughtMap: data.caughtMap || {} };
  } catch (e) {
    console.warn('Failed to upload to backend', e);
    return { ok: false, error: 'Could not reach the server' };
  }
}

/** Pull the collection stored in the database. Distinguishes failure from an empty result. */
export async function downloadCaughtState(username: string): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/caught/${encodeURIComponent(username)}`);
    if (res.status === 404) return { ok: false, error: 'No saved collection found for this user yet. Upload first.' };
    if (!res.ok) return { ok: false, error: await readError(res) };
    const data = await res.json();
    return { ok: true, caughtMap: data.caughtMap || {} };
  } catch (e) {
    console.warn('Failed to download from backend', e);
    return { ok: false, error: 'Could not reach the server' };
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
