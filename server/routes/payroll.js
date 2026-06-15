import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/payroll/employees
router.get('/employees', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const { search, department, active = '1', page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM employees WHERE sector_id = ? AND active = ?';
    const params = [req.user.sector_id, Number(active)];
    if (search) { query += ' AND (full_name LIKE ? OR employee_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (department) { query += ' AND department = ?'; params.push(department); }
    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;
    query += ' ORDER BY full_name LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const employees = db.prepare(query).all(...params);
    res.json({ data: employees, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payroll/employees
router.post('/employees', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const { employee_code, full_name, position, department, base_salary, hire_date, tax_id, social_security, bank_account, email, phone, emergency_contact, custom_data } = req.body;
    const result = db.prepare(
      'INSERT INTO employees (sector_id, employee_code, full_name, position, department, base_salary, hire_date, tax_id, social_security, bank_account, email, phone, emergency_contact, custom_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, employee_code, full_name, position, department, base_salary || 0, hire_date, tax_id, social_security, bank_account, email, phone, emergency_contact, JSON.stringify(custom_data || {}));
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(employee);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/payroll/employees/:id
router.put('/employees/:id', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const fields = req.body;
    const allowed = ['full_name','position','department','base_salary','tax_id','social_security','bank_account','email','phone','emergency_contact','active'];
    const sets = []; const vals = [];
    for (const [k,v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k}=?`); vals.push(v); }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No valid fields.' });
    sets.push('updated_at=datetime("now")');
    vals.push(req.params.id, req.user.sector_id);
    db.prepare(`UPDATE employees SET ${sets.join(',')} WHERE id=? AND sector_id=?`).run(...vals);
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    res.json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/payroll/periods
router.get('/periods', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM payroll_periods WHERE sector_id = ?';
    const params = [req.user.sector_id];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY period_start DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const periods = db.prepare(query).all(...params);
    res.json({ data: periods });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payroll/periods
router.post('/periods', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const { name, period_type, period_start, period_end, payment_date, notes } = req.body;
    const result = db.prepare(
      'INSERT INTO payroll_periods (sector_id, name, period_type, period_start, period_end, payment_date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)'
    ).run(req.user.sector_id, name, period_type || 'quincenal', period_start, period_end, payment_date, notes, req.user.id);
    const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(period);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/payroll/calculate - Calculate payroll for a period
router.post('/calculate', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const { period_id } = req.body;
    const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ? AND sector_id = ?').get(period_id, req.user.sector_id);
    if (!period) return res.status(404).json({ error: 'Period not found.' });
    if (period.status === 'closed') return res.status(400).json({ error: 'Period is already closed.' });

    const employees = db.prepare('SELECT * FROM employees WHERE sector_id = ? AND active = 1').all(req.user.sector_id);
    // Clear existing calculations
    db.prepare('DELETE FROM payroll_details WHERE period_id = ?').run(period_id);

    let totalGross = 0, totalDeductions = 0, totalNet = 0;
    const insertDetail = db.prepare(
      'INSERT INTO payroll_details (period_id, employee_id, days_worked, base_salary, overtime_hours, overtime_pay, bonuses, deductions_imss, deductions_isr, deductions_other, gross_pay, total_deductions, net_pay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );

    const calculate = db.transaction(() => {
      for (const emp of employees) {
        const dailySalary = emp.base_salary / 30;
        const daysWorked = 15; // Default quincenal
        const basePay = dailySalary * daysWorked;
        const overtimePay = 0;
        const bonuses = 0;
        const grossPay = basePay + overtimePay + bonuses;
        // Mexican tax approximations
        const imss = grossPay * 0.025;
        const isr = grossPay > 15000 ? grossPay * 0.12 : grossPay * 0.08;
        const otherDed = 0;
        const totalDed = imss + isr + otherDed;
        const netPay = grossPay - totalDed;

        insertDetail.run(period_id, emp.id, daysWorked, basePay, 0, overtimePay, bonuses, imss, isr, otherDed, grossPay, totalDed, netPay);
        totalGross += grossPay; totalDeductions += totalDed; totalNet += netPay;
      }
      db.prepare('UPDATE payroll_periods SET total_gross = ?, total_deductions = ?, total_net = ?, status = "calculated" WHERE id = ?')
        .run(totalGross, totalDeductions, totalNet, period_id);
    });
    calculate();

    const details = db.prepare('SELECT pd.*, e.full_name, e.position, e.department FROM payroll_details pd JOIN employees e ON pd.employee_id = e.id WHERE pd.period_id = ?').all(period_id);
    const updatedPeriod = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(period_id);
    res.json({ period: updatedPeriod, details });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/payroll/periods/:id/close
router.put('/periods/:id/close', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE payroll_periods SET status = "closed", approved_by = ? WHERE id = ? AND sector_id = ? AND status = "calculated"')
      .run(req.user.id, req.params.id, req.user.sector_id);
    const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(req.params.id);
    res.json(period);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/payroll/periods/:id/details
router.get('/periods/:id/details', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const details = db.prepare('SELECT pd.*, e.full_name, e.position, e.department, e.employee_code FROM payroll_details pd JOIN employees e ON pd.employee_id = e.id WHERE pd.period_id = ?').all(req.params.id);
    res.json(details);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/payroll/employees/:id
router.delete('/employees/:id', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM employees WHERE id = ? AND sector_id = ?').run(req.params.id, req.user.sector_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/payroll/periods/:id
router.delete('/periods/:id', requireModule('payroll'), (req, res) => {
  try {
    const db = getDb();
    const deletePeriod = db.transaction(() => {
      db.prepare('DELETE FROM payroll_details WHERE period_id = ?').run(req.params.id);
      db.prepare('DELETE FROM payroll_periods WHERE id = ? AND sector_id = ?').run(req.params.id, req.user.sector_id);
    });
    deletePeriod();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
