import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/supplies
router.get('/', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    const { search, category, low_stock, page = 1, limit = 50 } = req.query;
    let query = 'SELECT s.*, sup.company_name as supplier_name FROM supplies s LEFT JOIN suppliers sup ON s.preferred_supplier_id = sup.id WHERE s.sector_id = ? AND s.active = 1';
    const params = [req.user.sector_id];
    if (search) { query += ' AND (s.name LIKE ? OR s.code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category) { query += ' AND s.category = ?'; params.push(category); }
    if (low_stock === 'true') { query += ' AND s.stock <= s.reorder_point AND s.reorder_point > 0'; }
    const total = db.prepare(query.replace('SELECT s.*, sup.company_name as supplier_name', 'SELECT COUNT(*) as count')).get(...params).count;
    query += ' ORDER BY s.name LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const supplies = db.prepare(query).all(...params);
    res.json({ data: supplies, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/supplies
router.post('/', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    const { code, name, description, category, unit, stock, reorder_point, preferred_supplier_id, unit_cost, specs, custom_data } = req.body;
    const result = db.prepare(
      'INSERT INTO supplies (sector_id, code, name, description, category, unit, stock, reorder_point, preferred_supplier_id, unit_cost, specs, custom_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, code, name, description, category, unit || 'pza', stock || 0, reorder_point || 0, preferred_supplier_id, unit_cost || 0, JSON.stringify(specs || {}), JSON.stringify(custom_data || {}));
    const supply = db.prepare('SELECT * FROM supplies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(supply);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/supplies/:id
router.put('/:id', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    const { name, description, category, unit, reorder_point, preferred_supplier_id, unit_cost, specs, active } = req.body;
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name=?'); params.push(name); }
    if (description !== undefined) { sets.push('description=?'); params.push(description); }
    if (category !== undefined) { sets.push('category=?'); params.push(category); }
    if (unit !== undefined) { sets.push('unit=?'); params.push(unit); }
    if (reorder_point !== undefined) { sets.push('reorder_point=?'); params.push(reorder_point); }
    if (preferred_supplier_id !== undefined) { sets.push('preferred_supplier_id=?'); params.push(preferred_supplier_id); }
    if (unit_cost !== undefined) { sets.push('unit_cost=?'); params.push(unit_cost); }
    if (active !== undefined) { sets.push('active=?'); params.push(active); }
    sets.push('updated_at=datetime("now")');
    params.push(req.params.id, req.user.sector_id);
    db.prepare(`UPDATE supplies SET ${sets.join(', ')} WHERE id=? AND sector_id=?`).run(...params);
    const supply = db.prepare('SELECT * FROM supplies WHERE id = ?').get(req.params.id);
    res.json(supply);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/supplies/:id
router.delete('/:id', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE supplies SET active = 0, updated_at = datetime("now") WHERE id = ? AND sector_id = ?').run(req.params.id, req.user.sector_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/supplies/orders
router.get('/orders', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    const { status, page = 1, limit = 50 } = req.query;
    let query = 'SELECT so.*, s.name as supply_name, sup.company_name as supplier_name FROM supply_orders so JOIN supplies s ON so.supply_id = s.id LEFT JOIN suppliers sup ON so.supplier_id = sup.id WHERE so.sector_id = ?';
    const params = [req.user.sector_id];
    if (status) { query += ' AND so.status = ?'; params.push(status); }
    query += ' ORDER BY so.order_date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const orders = db.prepare(query).all(...params);
    res.json({ data: orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/supplies/orders
router.post('/orders', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    const { supply_id, supplier_id, quantity, unit_cost, estimated_delivery, notes } = req.body;
    const total_cost = quantity * (unit_cost || 0);
    const result = db.prepare(
      'INSERT INTO supply_orders (sector_id, supply_id, supplier_id, quantity, unit_cost, total_cost, estimated_delivery, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, supply_id, supplier_id, quantity, unit_cost || 0, total_cost, estimated_delivery, notes, req.user.id);
    const order = db.prepare('SELECT * FROM supply_orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/supplies/orders/:id/receive
router.put('/orders/:id/receive', requireModule('supplies'), (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM supply_orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    db.prepare('UPDATE supply_orders SET status = "received", actual_delivery = datetime("now") WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE supplies SET stock = stock + ?, updated_at = datetime("now") WHERE id = ?').run(order.quantity, order.supply_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
