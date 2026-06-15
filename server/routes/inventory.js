import { Router } from 'express';
import { getDb } from '../config/database.js';
import { requireModule } from '../middleware/rbac.js';

const router = Router();

// GET /api/inventory/products
router.get('/products', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const { search, category, low_stock, page = 1, limit = 50 } = req.query;
    const sectorId = req.user.sector_id;
    let query = 'SELECT p.*, pc.name as category_name FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.sector_id = ?';
    const params = [sectorId];

    if (search) { query += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category) { query += ' AND p.category_id = ?'; params.push(category); }
    if (low_stock === 'true') { query += ' AND p.stock <= p.min_stock AND p.min_stock > 0'; }

    const total = db.prepare(query.replace('SELECT p.*, pc.name as category_name', 'SELECT COUNT(*) as count')).get(...params).count;
    query += ' ORDER BY p.updated_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const products = db.prepare(query).all(...params);
    res.json({ data: products, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory/products
router.post('/products', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const { sku, name, description, category_id, unit, stock, min_stock, max_stock, cost_price, sale_price, location, custom_data } = req.body;
    const sectorId = req.user.sector_id;

    const result = db.prepare(
      'INSERT INTO products (sector_id, sku, name, description, category_id, unit, stock, min_stock, max_stock, cost_price, sale_price, location, custom_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).run(sectorId, sku, name, description, category_id, unit || 'pza', stock || 0, min_stock || 0, max_stock || 0, cost_price || 0, sale_price || 0, location, JSON.stringify(custom_data || {}));

    if (stock > 0) {
      db.prepare('INSERT INTO inventory_movements (product_id, sector_id, type, quantity, previous_stock, new_stock, reason, user_id) VALUES (?,?,?,?,?,?,?,?)')
        .run(result.lastInsertRowid, sectorId, 'entry', stock, 0, stock, 'Initial stock', req.user.id);
    }

    db.prepare('INSERT INTO audit_log (user_id, action, module, record_id, changes) VALUES (?,?,?,?,?)')
      .run(req.user.id, 'create', 'inventory', result.lastInsertRowid, JSON.stringify({ name, sku }));

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/inventory/products/:id
router.put('/products/:id', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const { name, description, category_id, unit, min_stock, max_stock, cost_price, sale_price, location, custom_data, active } = req.body;

    db.prepare(`UPDATE products SET name=COALESCE(?,name), description=COALESCE(?,description), category_id=COALESCE(?,category_id), 
      unit=COALESCE(?,unit), min_stock=COALESCE(?,min_stock), max_stock=COALESCE(?,max_stock), cost_price=COALESCE(?,cost_price), 
      sale_price=COALESCE(?,sale_price), location=COALESCE(?,location), custom_data=COALESCE(?,custom_data), active=COALESCE(?,active), 
      updated_at=datetime('now') WHERE id=? AND sector_id=?`)
      .run(name, description, category_id, unit, min_stock, max_stock, cost_price, sale_price, location, custom_data ? JSON.stringify(custom_data) : null, active, req.params.id, req.user.sector_id);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/inventory/products/:id
router.delete('/products/:id', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE products SET active = 0, updated_at = datetime("now") WHERE id = ? AND sector_id = ?').run(req.params.id, req.user.sector_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory/movements
router.post('/movements', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const { product_id, type, quantity, reason, reference_doc } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND sector_id = ?').get(product_id, req.user.sector_id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const newStock = type === 'entry' ? product.stock + quantity : product.stock - quantity;
    if (newStock < 0) return res.status(400).json({ error: 'Insufficient stock.' });

    db.prepare('UPDATE products SET stock = ?, updated_at = datetime("now") WHERE id = ?').run(newStock, product_id);
    const result = db.prepare(
      'INSERT INTO inventory_movements (product_id, sector_id, type, quantity, previous_stock, new_stock, reason, reference_doc, user_id) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(product_id, req.user.sector_id, type, quantity, product.stock, newStock, reason, reference_doc, req.user.id);

    const movement = db.prepare('SELECT * FROM inventory_movements WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(movement);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/inventory/movements
router.get('/movements', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const { product_id, type, page = 1, limit = 50 } = req.query;
    let query = 'SELECT im.*, p.name as product_name, p.sku FROM inventory_movements im JOIN products p ON im.product_id = p.id WHERE im.sector_id = ?';
    const params = [req.user.sector_id];
    if (product_id) { query += ' AND im.product_id = ?'; params.push(product_id); }
    if (type) { query += ' AND im.type = ?'; params.push(type); }
    query += ' ORDER BY im.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const movements = db.prepare(query).all(...params);
    res.json({ data: movements });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/inventory/categories
router.get('/categories', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM product_categories WHERE sector_id = ? ORDER BY name').all(req.user.sector_id);
    res.json(categories);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory/categories
router.post('/categories', requireModule('inventory'), (req, res) => {
  try {
    const db = getDb();
    const { name, description, parent_id } = req.body;
    const result = db.prepare('INSERT INTO product_categories (sector_id, name, description, parent_id) VALUES (?,?,?,?)').run(req.user.sector_id, name, description, parent_id);
    const cat = db.prepare('SELECT * FROM product_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
