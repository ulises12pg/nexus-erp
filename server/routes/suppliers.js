import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/suppliers
router.get('/', requireModule('suppliers'), (req, res) => {
  try {
    const db = getDb();
    const { search, status, category, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM suppliers WHERE sector_id = ?';
    const params = [req.user.sector_id];
    if (search) { query += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;
    query += ' ORDER BY company_name LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const suppliers = db.prepare(query).all(...params);
    res.json({ data: suppliers, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/suppliers/:id
router.get('/:id', requireModule('suppliers'), (req, res) => {
  try {
    const db = getDb();
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ? AND sector_id = ?').get(req.params.id, req.user.sector_id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
    const evaluations = db.prepare('SELECT se.*, u.full_name as evaluator_name FROM supplier_evaluations se LEFT JOIN users u ON se.evaluator_id = u.id WHERE se.supplier_id = ? ORDER BY se.created_at DESC').all(req.params.id);
    const orders = db.prepare('SELECT so.*, s.name as supply_name FROM supply_orders so JOIN supplies s ON so.supply_id = s.id WHERE so.supplier_id = ? ORDER BY so.order_date DESC LIMIT 10').all(req.params.id);
    res.json({ ...supplier, evaluations, recent_orders: orders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/suppliers
router.post('/', requireModule('suppliers'), (req, res) => {
  try {
    const db = getDb();
    const { company_name, contact_name, email, phone, address, city, state, zip_code, tax_id, category, payment_terms, notes, custom_data } = req.body;
    const result = db.prepare(
      'INSERT INTO suppliers (sector_id, company_name, contact_name, email, phone, address, city, state, zip_code, tax_id, category, payment_terms, notes, custom_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, company_name, contact_name, email, phone, address, city, state, zip_code, tax_id, category, payment_terms || '30 days', notes, JSON.stringify(custom_data || {}));
    
    db.prepare('INSERT INTO audit_log (user_id, action, module, record_id, changes) VALUES (?,?,?,?,?)')
      .run(req.user.id, 'create', 'suppliers', result.lastInsertRowid, JSON.stringify({ company_name }));

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(supplier);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/suppliers/:id
router.put('/:id', requireModule('suppliers'), (req, res) => {
  try {
    const db = getDb();
    const fields = req.body;
    const allowed = ['company_name','contact_name','email','phone','address','city','state','zip_code','tax_id','category','payment_terms','status','notes'];
    const sets = []; const vals = [];
    for (const [k,v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k}=?`); vals.push(v); }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No valid fields.' });
    sets.push('updated_at=datetime("now")');
    vals.push(req.params.id, req.user.sector_id);
    db.prepare(`UPDATE suppliers SET ${sets.join(',')} WHERE id=? AND sector_id=?`).run(...vals);
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    res.json(supplier);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/suppliers/:id
router.delete('/:id', requireModule('suppliers'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM suppliers WHERE id = ? AND sector_id = ?').run(req.params.id, req.user.sector_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/suppliers/:id/evaluate
router.post('/:id/evaluate', requireModule('suppliers'), (req, res) => {
  try {
    const db = getDb();
    const { period, quality_score, delivery_score, price_score, service_score, comments } = req.body;
    const overall = ((quality_score || 0) + (delivery_score || 0) + (price_score || 0) + (service_score || 0)) / 4;
    const result = db.prepare(
      'INSERT INTO supplier_evaluations (supplier_id, period, quality_score, delivery_score, price_score, service_score, overall_score, comments, evaluator_id) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(req.params.id, period, quality_score, delivery_score, price_score, service_score, overall, comments, req.user.id);
    // Update supplier overall rating
    const avgRating = db.prepare('SELECT AVG(overall_score) as avg FROM supplier_evaluations WHERE supplier_id = ?').get(req.params.id);
    db.prepare('UPDATE suppliers SET rating = ?, updated_at = datetime("now") WHERE id = ?').run(avgRating.avg || 0, req.params.id);
    const evaluation = db.prepare('SELECT * FROM supplier_evaluations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(evaluation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
