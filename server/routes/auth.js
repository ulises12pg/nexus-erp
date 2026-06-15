import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND active = 1').get(username, username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

    const token = generateToken(user);
    const sector = user.sector_id ? db.prepare('SELECT * FROM sectors WHERE id = ?').get(user.sector_id) : null;

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        language: user.language,
        sector_id: user.sector_id,
        sector: sector ? { id: sector.id, name: sector.name, slug: sector.slug } : null,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, full_name, role, sector_id, language } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 12);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, full_name, role, sector_id, language) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(username, email, password_hash, full_name, role || 'operator', sector_id || 1, language || 'es');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        language: user.language,
        sector_id: user.sector_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, username, email, full_name, role, sector_id, language, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const sector = user.sector_id ? db.prepare('SELECT id, name, slug, active_modules FROM sectors WHERE id = ?').get(user.sector_id) : null;
    res.json({ ...user, sector });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', (req, res) => {
  try {
    const { full_name, email, language } = req.body;
    const db = getDb();
    db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), language = COALESCE(?, language), updated_at = datetime("now") WHERE id = ?')
      .run(full_name, email, language, req.user.id);
    const user = db.prepare('SELECT id, username, email, full_name, role, sector_id, language FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users (admin only)
router.get('/users', (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const db = getDb();
    const users = db.prepare('SELECT id, username, email, full_name, role, sector_id, active, language, last_login, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
