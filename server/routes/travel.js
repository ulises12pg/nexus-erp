import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/travel/requests
router.get('/requests', requireModule('travel'), (req, res) => {
  try {
    const db = getDb();
    const { status, employee_id, page = 1, limit = 20 } = req.query;
    let query = 'SELECT tr.*, e.full_name as employee_name, u.full_name as submitted_by_name FROM travel_requests tr JOIN employees e ON tr.employee_id = e.id LEFT JOIN users u ON tr.submitted_by = u.id WHERE tr.sector_id = ?';
    const params = [req.user.sector_id];
    if (status) { query += ' AND tr.status = ?'; params.push(status); }
    if (employee_id) { query += ' AND tr.employee_id = ?'; params.push(employee_id); }
    const total = db.prepare(query.replace(/SELECT tr\.\*.*?FROM/, 'SELECT COUNT(*) as count FROM')).get(...params).count;
    query += ' ORDER BY tr.start_date DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const requests = db.prepare(query).all(...params);
    res.json({ data: requests, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/travel/requests
router.post('/requests', requireModule('travel'), (req, res) => {
  try {
    const db = getDb();
    const { employee_id, destination, origin, purpose, start_date, end_date, estimated_budget, transport_type, accommodation, itinerary, notes, custom_data } = req.body;
    const result = db.prepare(
      'INSERT INTO travel_requests (sector_id, employee_id, destination, origin, purpose, start_date, end_date, estimated_budget, transport_type, accommodation, itinerary, notes, custom_data, submitted_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, employee_id, destination, origin, purpose, start_date, end_date, estimated_budget || 0, transport_type, accommodation, JSON.stringify(itinerary || []), notes, JSON.stringify(custom_data || {}), req.user.id);
    const request = db.prepare('SELECT * FROM travel_requests WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/travel/requests/:id
router.put('/requests/:id', requireModule('travel'), (req, res) => {
  try {
    const db = getDb();
    const { destination, origin, purpose, start_date, end_date, estimated_budget, transport_type, accommodation, notes } = req.body;
    const sets = [];
    const params = [];
    if (destination !== undefined) { sets.push('destination=?'); params.push(destination); }
    if (origin !== undefined) { sets.push('origin=?'); params.push(origin); }
    if (purpose !== undefined) { sets.push('purpose=?'); params.push(purpose); }
    if (start_date !== undefined) { sets.push('start_date=?'); params.push(start_date); }
    if (end_date !== undefined) { sets.push('end_date=?'); params.push(end_date); }
    if (estimated_budget !== undefined) { sets.push('estimated_budget=?'); params.push(estimated_budget); }
    if (transport_type !== undefined) { sets.push('transport_type=?'); params.push(transport_type); }
    if (accommodation !== undefined) { sets.push('accommodation=?'); params.push(accommodation); }
    if (notes !== undefined) { sets.push('notes=?'); params.push(notes); }
    if (sets.length > 0) {
      params.push(req.params.id, req.user.sector_id);
      db.prepare(`UPDATE travel_requests SET ${sets.join(', ')} WHERE id=? AND sector_id=?`).run(...params);
    }
    const request = db.prepare('SELECT * FROM travel_requests WHERE id = ?').get(req.params.id);
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/travel/requests/:id/approve
router.put('/requests/:id/approve', requireModule('travel'), (req, res) => {
  try {
    const db = getDb();
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only managers can approve travel requests.' });
    }
    const { approved, reason } = req.body;
    const status = approved ? 'approved' : 'rejected';
    db.prepare('UPDATE travel_requests SET status = ?, approved_by = ?, approval_date = datetime("now") WHERE id = ? AND sector_id = ?')
      .run(status, req.user.id, req.params.id, req.user.sector_id);
    const request = db.prepare('SELECT * FROM travel_requests WHERE id = ?').get(req.params.id);
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/travel/requests/:id/expenses
router.get('/requests/:id/expenses', requireModule('travel'), (req, res) => {
  try {
    const db = getDb();
    const expenses = db.prepare('SELECT * FROM travel_expenses WHERE request_id = ? ORDER BY date').all(req.params.id);
    const total = db.prepare('SELECT SUM(amount) as total FROM travel_expenses WHERE request_id = ?').get(req.params.id);
    res.json({ data: expenses, total: total.total || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/travel/expenses
router.post('/expenses', requireModule('travel'), (req, res) => {
  try {
    const db = getDb();
    const { request_id, category, description, amount, currency, date } = req.body;
    const result = db.prepare(
      'INSERT INTO travel_expenses (request_id, category, description, amount, currency, date) VALUES (?,?,?,?,?,?)'
    ).run(request_id, category, description, amount, currency || 'MXN', date);
    // Update actual cost on the request
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM travel_expenses WHERE request_id = ?').get(request_id);
    db.prepare('UPDATE travel_requests SET actual_cost = ? WHERE id = ?').run(totalExpenses.total || 0, request_id);
    const expense = db.prepare('SELECT * FROM travel_expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
