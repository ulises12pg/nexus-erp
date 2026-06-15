import { Router } from 'express';
import { getDb } from '../config/database.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const sectorId = req.user.sector_id;

    // Inventory stats
    const inventoryStats = db.prepare('SELECT COUNT(*) as total_products, SUM(stock * cost_price) as total_value, SUM(CASE WHEN stock <= min_stock AND min_stock > 0 THEN 1 ELSE 0 END) as low_stock_count FROM products WHERE sector_id = ? AND active = 1').get(sectorId);

    // Employee stats
    const employeeStats = db.prepare('SELECT COUNT(*) as total_employees, SUM(base_salary) as total_salary_base FROM employees WHERE sector_id = ? AND active = 1').get(sectorId);

    // Expense stats (current month)
    const expenseStats = db.prepare("SELECT SUM(amount) as total_expenses, COUNT(*) as expense_count, SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount, SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount FROM expenses WHERE sector_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')").get(sectorId);

    // Supplier stats
    const supplierStats = db.prepare("SELECT COUNT(*) as total_suppliers, AVG(rating) as avg_rating, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count FROM suppliers WHERE sector_id = ?").get(sectorId);

    // Supply stats
    const supplyStats = db.prepare('SELECT COUNT(*) as total_supplies, SUM(CASE WHEN stock <= reorder_point AND reorder_point > 0 THEN 1 ELSE 0 END) as reorder_needed FROM supplies WHERE sector_id = ? AND active = 1').get(sectorId);

    // Travel stats
    const travelStats = db.prepare("SELECT COUNT(*) as total_requests, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(estimated_budget) as total_budget, SUM(actual_cost) as total_actual FROM travel_requests WHERE sector_id = ?").get(sectorId);

    // Recent activity
    const recentActivity = db.prepare('SELECT al.*, u.full_name as user_name FROM audit_log al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.timestamp DESC LIMIT 10').all();

    // Expense trend (last 6 months)
    const expenseTrend = db.prepare("SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses WHERE sector_id = ? AND status = 'approved' GROUP BY month ORDER BY month DESC LIMIT 6").all(sectorId);

    // Top 5 products by value
    const topProducts = db.prepare('SELECT name, sku, stock, stock * cost_price as value FROM products WHERE sector_id = ? AND active = 1 ORDER BY value DESC LIMIT 5').all(sectorId);

    // Payroll latest
    const latestPayroll = db.prepare('SELECT * FROM payroll_periods WHERE sector_id = ? ORDER BY period_start DESC LIMIT 1').get(sectorId);

    // Notifications
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC LIMIT 5').all(req.user.id);

    res.json({
      inventory: inventoryStats,
      employees: employeeStats,
      expenses: expenseStats,
      suppliers: supplierStats,
      supplies: supplyStats,
      travel: travelStats,
      recentActivity,
      expenseTrend: expenseTrend.reverse(),
      topProducts,
      latestPayroll,
      notifications
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
