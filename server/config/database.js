import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'nexus.db');

let db = null;
let SQL = null;

// Wrapper to make sql.js API compatible with better-sqlite3 style
class DbWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const lastId = self._db.exec("SELECT last_insert_rowid() as id")[0];
        const changes = self._db.getRowsModified();
        return { lastInsertRowid: lastId ? lastId.values[0][0] : 0, changes };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          results.push(row);
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql) {
    this._db.exec(sql);
  }

  pragma(str) {
    try { this._db.exec(`PRAGMA ${str}`); } catch(e) { /* ignore */ }
  }

  transaction(fn) {
    return (...args) => {
      this._db.exec('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        this._db.exec('COMMIT');
        return result;
      } catch (e) {
        this._db.exec('ROLLBACK');
        throw e;
      }
    };
  }

  save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function getDbAsync() {
  if (db) return db;
  if (!SQL) SQL = await initSqlJs();
  
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }
  
  db = new DbWrapper(sqlDb);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export async function initDatabase() {
  const dbw = await getDbAsync();

  dbw.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      sector_id INTEGER,
      avatar_url TEXT,
      language TEXT DEFAULT 'es',
      active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'building',
      active_modules TEXT DEFAULT '["inventory","payroll","expenses","supplies","suppliers","travel"]',
      config TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS custom_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      module TEXT NOT NULL,
      field_name TEXT NOT NULL,
      field_label_es TEXT NOT NULL,
      field_label_en TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'text',
      required INTEGER DEFAULT 0,
      options TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      unit TEXT DEFAULT 'pza',
      stock REAL DEFAULT 0,
      min_stock REAL DEFAULT 0,
      max_stock REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      location TEXT,
      custom_data TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      sector_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      previous_stock REAL,
      new_stock REAL,
      reason TEXT,
      reference_doc TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      employee_code TEXT,
      full_name TEXT NOT NULL,
      position TEXT,
      department TEXT,
      base_salary REAL DEFAULT 0,
      hire_date TEXT,
      tax_id TEXT,
      social_security TEXT,
      bank_account TEXT,
      email TEXT,
      phone TEXT,
      emergency_contact TEXT,
      custom_data TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payroll_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      period_type TEXT DEFAULT 'quincenal',
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      payment_date TEXT,
      status TEXT DEFAULT 'draft',
      total_gross REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      total_net REAL DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      approved_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payroll_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      days_worked REAL DEFAULT 15,
      base_salary REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      overtime_pay REAL DEFAULT 0,
      bonuses REAL DEFAULT 0,
      deductions_imss REAL DEFAULT 0,
      deductions_isr REAL DEFAULT 0,
      deductions_other REAL DEFAULT 0,
      deductions_detail TEXT DEFAULT '{}',
      perceptions_detail TEXT DEFAULT '{}',
      gross_pay REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      net_pay REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      budget_limit REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      category_id INTEGER,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      department TEXT,
      payment_method TEXT DEFAULT 'transfer',
      receipt_number TEXT,
      receipt_url TEXT,
      status TEXT DEFAULT 'pending',
      submitted_by INTEGER,
      approved_by INTEGER,
      approval_date TEXT,
      rejection_reason TEXT,
      notes TEXT,
      custom_data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      category_id INTEGER,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      spent REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      code TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      unit TEXT DEFAULT 'pza',
      stock REAL DEFAULT 0,
      reorder_point REAL DEFAULT 0,
      preferred_supplier_id INTEGER,
      unit_cost REAL DEFAULT 0,
      specs TEXT DEFAULT '{}',
      custom_data TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supply_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      supply_id INTEGER NOT NULL,
      supplier_id INTEGER,
      quantity REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      order_date TEXT DEFAULT (datetime('now')),
      estimated_delivery TEXT,
      actual_delivery TEXT,
      notes TEXT,
      created_by INTEGER
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      tax_id TEXT,
      category TEXT,
      payment_terms TEXT DEFAULT '30 days',
      rating REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      documents TEXT DEFAULT '[]',
      custom_data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supplier_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      quality_score REAL DEFAULT 0,
      delivery_score REAL DEFAULT 0,
      price_score REAL DEFAULT 0,
      service_score REAL DEFAULT 0,
      overall_score REAL DEFAULT 0,
      comments TEXT,
      evaluator_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS travel_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      origin TEXT,
      purpose TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      estimated_budget REAL DEFAULT 0,
      actual_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      transport_type TEXT,
      accommodation TEXT,
      itinerary TEXT DEFAULT '[]',
      notes TEXT,
      submitted_by INTEGER,
      approved_by INTEGER,
      approval_date TEXT,
      custom_data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS travel_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'MXN',
      date TEXT NOT NULL,
      receipt_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id INTEGER,
      changes TEXT DEFAULT '{}',
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      module TEXT,
      read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  dbw.save();
  console.log('✅ Database initialized successfully');
  return dbw;
}

// Auto-save every 30 seconds
setInterval(() => {
  if (db) {
    try { db.save(); } catch(e) { /* ignore */ }
  }
}, 30000);

export default { getDb, getDbAsync, initDatabase };
