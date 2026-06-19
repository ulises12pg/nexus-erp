import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, getDb } from './config/database.js';
import { authMiddleware } from './middleware/auth.js';

// Routes
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import payrollRoutes from './routes/payroll.js';
import expenseRoutes from './routes/expenses.js';
import supplyRoutes from './routes/supplies.js';
import supplierRoutes from './routes/suppliers.js';
import travelRoutes from './routes/travel.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import exportRoutes from './routes/export.js';
import salesRoutes from './routes/sales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware to save DB after write operations
app.use((req, res, next) => {
  const originalEnd = res.end;
  res.end = function(...args) {
    if (['POST','PUT','DELETE','PATCH'].includes(req.method)) {
      try { getDb().save(); } catch(e) { /* db might not be ready */ }
    }
    return originalEnd.apply(this, args);
  };
  next();
});

// Public routes
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login' || req.path === '/register') return next();
  authMiddleware(req, res, next);
}, authRoutes);

// Protected routes
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/payroll', authMiddleware, payrollRoutes);
app.use('/api/expenses', authMiddleware, expenseRoutes);
app.use('/api/supplies', authMiddleware, supplyRoutes);
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/travel', authMiddleware, travelRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/export', authMiddleware, exportRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
async function start() {
  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Initialize database
  await initDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║          NEXUS ERP — Backend Server          ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  🚀 Server running on port ${PORT}              ║`);
    console.log(`║  📡 API: http://localhost:${PORT}/api            ║`);
    console.log('║  💾 Database: SQLite (data/nexus.db)         ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });

export default app;
