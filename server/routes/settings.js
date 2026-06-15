import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// GET /api/settings/sectors
router.get('/sectors', (req, res) => {
  try {
    const db = getDb();
    const sectors = db.prepare('SELECT * FROM sectors ORDER BY name').all();
    res.json(sectors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/sector/:id
router.get('/sector/:id', (req, res) => {
  try {
    const db = getDb();
    const sector = db.prepare('SELECT * FROM sectors WHERE id = ?').get(req.params.id);
    if (!sector) return res.status(404).json({ error: 'Sector not found.' });
    const customFields = db.prepare('SELECT * FROM custom_fields WHERE sector_id = ? AND active = 1 ORDER BY module, sort_order').all(req.params.id);
    res.json({ ...sector, customFields });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings/sector/:id
router.put('/sector/:id', requireRole('superadmin', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const { name, description, active_modules, config } = req.body;
    db.prepare('UPDATE sectors SET name=COALESCE(?,name), description=COALESCE(?,description), active_modules=COALESCE(?,active_modules), config=COALESCE(?,config) WHERE id=?')
      .run(name, description, active_modules ? JSON.stringify(active_modules) : null, config ? JSON.stringify(config) : null, req.params.id);
    const sector = db.prepare('SELECT * FROM sectors WHERE id = ?').get(req.params.id);
    res.json(sector);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/settings/sectors
router.post('/sectors', requireRole('superadmin'), (req, res) => {
  try {
    const db = getDb();
    const { name, slug, description, icon, active_modules } = req.body;
    const result = db.prepare('INSERT INTO sectors (name, slug, description, icon, active_modules) VALUES (?,?,?,?,?)')
      .run(name, slug, description, icon || 'building', JSON.stringify(active_modules || ['inventory','payroll','expenses','supplies','suppliers','travel']));
    const sector = db.prepare('SELECT * FROM sectors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(sector);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/custom-fields
router.get('/custom-fields', (req, res) => {
  try {
    const db = getDb();
    const { module } = req.query;
    let query = 'SELECT * FROM custom_fields WHERE sector_id = ? AND active = 1';
    const params = [req.user.sector_id];
    if (module) { query += ' AND module = ?'; params.push(module); }
    query += ' ORDER BY module, sort_order';
    const fields = db.prepare(query).all(...params);
    res.json(fields);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/settings/custom-fields
router.post('/custom-fields', requireRole('superadmin', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const { module, field_name, field_label_es, field_label_en, field_type, required, options, sort_order } = req.body;
    const result = db.prepare(
      'INSERT INTO custom_fields (sector_id, module, field_name, field_label_es, field_label_en, field_type, required, options, sort_order) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, module, field_name, field_label_es, field_label_en, field_type || 'text', required || 0, options ? JSON.stringify(options) : null, sort_order || 0);
    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(field);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings/custom-fields/:id
router.put('/custom-fields/:id', requireRole('superadmin', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const { field_label_es, field_label_en, field_type, required, options, sort_order, active } = req.body;
    db.prepare('UPDATE custom_fields SET field_label_es=COALESCE(?,field_label_es), field_label_en=COALESCE(?,field_label_en), field_type=COALESCE(?,field_type), required=COALESCE(?,required), options=COALESCE(?,options), sort_order=COALESCE(?,sort_order), active=COALESCE(?,active) WHERE id=? AND sector_id=?')
      .run(field_label_es, field_label_en, field_type, required, options ? JSON.stringify(options) : null, sort_order, active, req.params.id, req.user.sector_id);
    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(req.params.id);
    res.json(field);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/settings/custom-fields/:id
router.delete('/custom-fields/:id', requireRole('superadmin', 'admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE custom_fields SET active = 0 WHERE id = ? AND sector_id = ?').run(req.params.id, req.user.sector_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/audit-log
router.get('/audit-log', requireRole('superadmin', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const { module, page = 1, limit = 50 } = req.query;
    let query = 'SELECT al.*, u.full_name as user_name FROM audit_log al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1';
    const params = [];
    if (module) { query += ' AND al.module = ?'; params.push(module); }
    query += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const logs = db.prepare(query).all(...params);
    res.json({ data: logs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
