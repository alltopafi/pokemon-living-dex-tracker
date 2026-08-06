import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: dbRes.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get or Create User by Username (No password required)
app.post('/api/user/login', async (req, res) => {
  let { username } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  username = username.trim().toLowerCase();
  if (username.length < 2) {
    return res.status(400).json({ error: 'Username must be at least 2 characters' });
  }

  try {
    // 1. Find or Insert User
    let userRes = await pool.query('SELECT id, username, created_at FROM users WHERE username = $1', [username]);
    
    if (userRes.rows.length === 0) {
      userRes = await pool.query('INSERT INTO users (username) VALUES ($1) RETURNING id, username, created_at', [username]);
    }

    const user = userRes.rows[0];

    // 2. Fetch User's Caught Records
    const caughtRes = await pool.query(
      'SELECT pokemon_id, caught, notes, caught_in_game, updated_at FROM pokemon_caught WHERE user_id = $1',
      [user.id]
    );

    const caughtMap = {};
    for (const row of caughtRes.rows) {
      caughtMap[row.pokemon_id] = {
        caught: row.caught,
        notes: row.notes || undefined,
        caughtInGame: row.caught_in_game || undefined,
        timestamp: row.updated_at ? new Date(row.updated_at).getTime() : undefined
      };
    }

    res.json({
      user,
      caughtMap
    });
  } catch (err) {
    console.error('Error during user login:', err);
    res.status(500).json({ error: 'Failed to authenticate user', details: err.message });
  }
});

// Fetch Caught Records for Username
app.get('/api/caught/:username', async (req, res) => {
  const username = req.params.username.trim().toLowerCase();
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userRes.rows[0].id;
    const caughtRes = await pool.query(
      'SELECT pokemon_id, caught, notes, caught_in_game, updated_at FROM pokemon_caught WHERE user_id = $1',
      [userId]
    );

    const caughtMap = {};
    for (const row of caughtRes.rows) {
      caughtMap[row.pokemon_id] = {
        caught: row.caught,
        notes: row.notes || undefined,
        caughtInGame: row.caught_in_game || undefined,
        timestamp: row.updated_at ? new Date(row.updated_at).getTime() : undefined
      };
    }

    res.json({ username, caughtMap });
  } catch (err) {
    console.error('Error fetching caught state:', err);
    res.status(500).json({ error: 'Failed to fetch caught state', details: err.message });
  }
});

// Sync Caught State Map to PostgreSQL for Username
app.post('/api/caught/sync', async (req, res) => {
  const { username, caughtMap } = req.body;
  if (!username || !caughtMap) {
    return res.status(400).json({ error: 'Username and caughtMap are required' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    // 1. Get user_id
    let userRes = await pool.query('SELECT id FROM users WHERE username = $1', [cleanUsername]);
    if (userRes.rows.length === 0) {
      userRes = await pool.query('INSERT INTO users (username) VALUES ($1) RETURNING id', [cleanUsername]);
    }
    const userId = userRes.rows[0].id;

    // 2. Transaction for Bulk Upsert
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const [pokemonIdStr, status] of Object.entries(caughtMap)) {
        const pokemonId = parseInt(pokemonIdStr, 10);
        if (isNaN(pokemonId)) continue;

        await client.query(
          `INSERT INTO pokemon_caught (user_id, pokemon_id, caught, notes, caught_in_game, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id, pokemon_id) 
           DO UPDATE SET 
             caught = EXCLUDED.caught,
             notes = EXCLUDED.notes,
             caught_in_game = EXCLUDED.caught_in_game,
             updated_at = NOW();`,
          [userId, pokemonId, !!status.caught, status.notes || null, status.caughtInGame || null]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, count: Object.keys(caughtMap).length });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error syncing caught state:', err);
    res.status(500).json({ error: 'Failed to sync caught state', details: err.message });
  }
});

// Initialize DB and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Living Dex API Server running on port ${PORT}`);
  });
});
