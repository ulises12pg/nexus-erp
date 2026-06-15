import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/sales
router.get('/', requireModule('sales'), (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 50 } = req.query;
    let query = 'SELECT s.*, u.full_name as creator FROM direct_sales s LEFT JOIN users u ON s.created_by = u.id WHERE s.sector_id = ? ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    const params = [req.user.sector_id, Number(limit), (Number(page) - 1) * Number(limit)];
    const sales = db.prepare(query).all(...params);
    res.json({ data: sales });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sales/:id
router.get('/:id', requireModule('sales'), (req, res) => {
  try {
    const db = getDb();
    const sale = db.prepare('SELECT * FROM direct_sales WHERE id = ? AND sector_id = ?').get(req.params.id, req.user.sector_id);
    if (!sale) return res.status(404).json({ error: 'Sale not found.' });
    
    const items = db.prepare('SELECT si.*, p.name as product_name, p.sku FROM direct_sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?').all(sale.id);
    res.json({ ...sale, items });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sales
router.post('/', requireModule('sales'), (req, res) => {
  try {
    const db = getDb();
    const { items, payment_method, customer_name, total } = req.body;
    
    if (!items || !items.length) return res.status(400).json({ error: 'Sale must have items.' });

    const createSale = db.transaction(() => {
      // 1. Create Sale
      const saleResult = db.prepare(
        'INSERT INTO direct_sales (sector_id, total, payment_method, customer_name, created_by) VALUES (?,?,?,?,?)'
      ).run(req.user.sector_id, total, payment_method || 'cash', customer_name, req.user.id);
      
      const saleId = saleResult.lastInsertRowid;

      // 2. Add Items & Update Stock
      const insertItem = db.prepare('INSERT INTO direct_sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)');
      const updateStock = db.prepare('UPDATE products SET stock = stock - ?, updated_at = datetime("now") WHERE id = ? AND sector_id = ?');
      const insertMovement = db.prepare('INSERT INTO inventory_movements (product_id, sector_id, type, quantity, previous_stock, new_stock, reason, reference_doc, user_id) VALUES (?,?,?,?,?,?,?,?,?)');
      
      for (const item of items) {
        insertItem.run(saleId, item.product_id, item.quantity, item.price, item.quantity * item.price);
        
        const product = db.prepare('SELECT stock FROM products WHERE id = ? AND sector_id = ?').get(item.product_id, req.user.sector_id);
        if (product) {
          const newStock = product.stock - item.quantity;
          updateStock.run(item.quantity, item.product_id, req.user.sector_id);
          insertMovement.run(item.product_id, req.user.sector_id, 'exit', item.quantity, product.stock, newStock, 'Direct Sale', `SALE-${saleId}`, req.user.id);
        }
      }
      return saleId;
    });

    const saleId = createSale();
    res.status(201).json({ success: true, saleId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
