import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/expenses
router.get('/', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const { search, category_id, status, date_from, date_to, page = 1, limit = 50 } = req.query;
    let query = 'SELECT e.*, ec.name as category_name, u.full_name as submitted_by_name FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id LEFT JOIN users u ON e.submitted_by = u.id WHERE e.sector_id = ?';
    const params = [req.user.sector_id];
    if (search) { query += ' AND e.description LIKE ?'; params.push(`%${search}%`); }
    if (category_id) { query += ' AND e.category_id = ?'; params.push(category_id); }
    if (status) { query += ' AND e.status = ?'; params.push(status); }
    if (date_from) { query += ' AND e.date >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND e.date <= ?'; params.push(date_to); }
    const total = db.prepare(query.replace(/SELECT e\.\*.*?FROM/, 'SELECT COUNT(*) as count FROM')).get(...params).count;
    query += ' ORDER BY e.date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const expenses = db.prepare(query).all(...params);
    res.json({ data: expenses, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/expenses
router.post('/', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const { category_id, description, amount, date, department, payment_method, receipt_number, notes, custom_data } = req.body;
    const result = db.prepare(
      'INSERT INTO expenses (sector_id, category_id, description, amount, date, department, payment_method, receipt_number, notes, custom_data, submitted_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, category_id, description, amount, date, department, payment_method || 'transfer', receipt_number, notes, JSON.stringify(custom_data || {}), req.user.id);
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/expenses/:id
router.put('/:id', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const { category_id, description, amount, date, department, payment_method, receipt_number, notes } = req.body;
    db.prepare('UPDATE expenses SET category_id=COALESCE(?,category_id), description=COALESCE(?,description), amount=COALESCE(?,amount), date=COALESCE(?,date), department=COALESCE(?,department), payment_method=COALESCE(?,payment_method), receipt_number=COALESCE(?,receipt_number), notes=COALESCE(?,notes) WHERE id=? AND sector_id=?')
      .run(category_id, description, amount, date, department, payment_method, receipt_number, notes, req.params.id, req.user.sector_id);
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json(expense);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/expenses/:id/approve
router.put('/:id/approve', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const { approved } = req.body;
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only managers can approve expenses.' });
    }
    const status = approved ? 'approved' : 'rejected';
    db.prepare('UPDATE expenses SET status = ?, approved_by = ?, approval_date = datetime("now"), rejection_reason = ? WHERE id = ? AND sector_id = ?')
      .run(status, req.user.id, approved ? null : (req.body.reason || ''), req.params.id, req.user.sector_id);
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json(expense);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/expenses/:id
router.delete('/:id', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM expenses WHERE id = ? AND sector_id = ? AND status = "pending"').run(req.params.id, req.user.sector_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/expenses/categories
router.get('/categories', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM expense_categories WHERE sector_id = ? ORDER BY name').all(req.user.sector_id);
    res.json(categories);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/expenses/categories
router.post('/categories', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const { name, description, budget_limit } = req.body;
    const result = db.prepare('INSERT INTO expense_categories (sector_id, name, description, budget_limit) VALUES (?,?,?,?)').run(req.user.sector_id, name, description, budget_limit || 0);
    const cat = db.prepare('SELECT * FROM expense_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/expenses/summary
router.get('/summary', requireModule('expenses'), (req, res) => {
  try {
    const db = getDb();
    const { period } = req.query;
    const sectorId = req.user.sector_id;
    const byCategory = db.prepare('SELECT ec.name as category, SUM(e.amount) as total, COUNT(*) as count FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id WHERE e.sector_id = ? AND e.status = "approved" GROUP BY e.category_id ORDER BY total DESC').all(sectorId);
    const byMonth = db.prepare("SELECT strftime('%Y-%m', e.date) as month, SUM(e.amount) as total FROM expenses e WHERE e.sector_id = ? AND e.status = 'approved' GROUP BY month ORDER BY month DESC LIMIT 12").all(sectorId);
    const totalPending = db.prepare('SELECT SUM(amount) as total, COUNT(*) as count FROM expenses WHERE sector_id = ? AND status = "pending"').get(sectorId);
    const totalApproved = db.prepare('SELECT SUM(amount) as total, COUNT(*) as count FROM expenses WHERE sector_id = ? AND status = "approved"').get(sectorId);
    res.json({ byCategory, byMonth, totalPending, totalApproved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
