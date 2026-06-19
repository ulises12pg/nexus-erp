import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Delete existing DB to start fresh
const dbPath = path.join(dataDir, 'nexus.db');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const { initDatabase, getDb } = await import('../config/database.js');
await initDatabase();
const db = getDb();

console.log('🌱 Seeding database...');

// SECTORS
const sectors = [
  { name: 'Transporte y Logística', slug: 'transporte', description: 'Empresas de transporte de carga, mensajería y logística', icon: 'truck', modules: '["inventory","payroll","expenses","supplies","suppliers","travel"]' },
  { name: 'Tlapalería / Materiales', slug: 'tlapaleria', description: 'Tiendas de materiales de construcción, ferretería y tlapalerías', icon: 'wrench', modules: '["inventory","payroll","expenses","supplies","suppliers"]' },
  { name: 'Planta Cementera', slug: 'cementera', description: 'Plantas de producción de cemento y materiales industriales', icon: 'factory', modules: '["inventory","payroll","expenses","supplies","suppliers","travel"]' },
  { name: 'Alquiler de Maquinaria', slug: 'maquinaria', description: 'Renta y gestión de maquinaria pesada y equipo', icon: 'cog', modules: '["inventory","expenses","supplies","suppliers"]' },
  { name: 'Metalurgia', slug: 'metalurgia', description: 'Fundidoras, talleres metalúrgicos y procesamiento de metales', icon: 'flame', modules: '["inventory","payroll","expenses","supplies","suppliers"]' },
];
sectors.forEach(s => db.prepare('INSERT INTO sectors (name, slug, description, icon, active_modules) VALUES (?,?,?,?,?)').run(s.name, s.slug, s.description, s.icon, s.modules));

// USERS
const ph = bcrypt.hashSync('admin123', 12);
const users = [
  ['admin', 'admin@nexus-erp.com', 'Administrador General', 'superadmin', 1],
  ['carlos.mendez', 'carlos@nexus-erp.com', 'Carlos Méndez López', 'admin', 1],
  ['ana.garcia', 'ana@nexus-erp.com', 'Ana García Ruiz', 'manager', 1],
  ['roberto.tlapa', 'roberto@nexus-erp.com', 'Roberto Hernández', 'admin', 2],
  ['maria.cemento', 'maria@nexus-erp.com', 'María Sánchez Vega', 'admin', 3],
  ['operator1', 'op1@nexus-erp.com', 'Juan Pérez Torres', 'operator', 1],
  ['viewer1', 'viewer@nexus-erp.com', 'Laura Martínez', 'viewer', 1],
];
users.forEach(u => db.prepare('INSERT INTO users (username, email, password_hash, full_name, role, sector_id) VALUES (?,?,?,?,?,?)').run(u[0], u[1], ph, u[2], u[3], u[4]));

// CUSTOM FIELDS
const cfs = [
  [1, 'inventory', 'vehicle_plate', 'Placa del Vehículo', 'Vehicle Plate', 'text'],
  [1, 'inventory', 'mileage', 'Kilometraje', 'Mileage', 'number'],
  [1, 'expenses', 'route', 'Ruta', 'Route', 'text'],
  [1, 'expenses', 'fuel_liters', 'Litros de Combustible', 'Fuel Liters', 'number'],
  [2, 'inventory', 'aisle', 'Pasillo', 'Aisle', 'text'],
  [2, 'inventory', 'brand', 'Marca', 'Brand', 'text'],
  [3, 'inventory', 'batch_number', 'Número de Lote', 'Batch Number', 'text'],
  [3, 'inventory', 'production_shift', 'Turno de Producción', 'Production Shift', 'select'],
  [3, 'supplies', 'chemical_composition', 'Composición Química', 'Chemical Composition', 'textarea'],
];
cfs.forEach((f,i) => db.prepare('INSERT INTO custom_fields (sector_id, module, field_name, field_label_es, field_label_en, field_type, sort_order) VALUES (?,?,?,?,?,?,?)').run(f[0], f[1], f[2], f[3], f[4], f[5], i));

// PRODUCT CATEGORIES
const cats1 = ['Refacciones', 'Llantas', 'Aceites y Lubricantes', 'Combustible', 'Herramientas'];
const cats2 = ['Pintura', 'Electricidad', 'Plomería', 'Ferretería', 'Adhesivos', 'Herramientas Manuales', 'Materiales de Construcción'];
const cats3 = ['Materia Prima', 'Refacciones Industriales', 'Combustibles', 'Empaques', 'Equipo de Seguridad'];
cats1.forEach(c => db.prepare('INSERT INTO product_categories (sector_id, name) VALUES (?,?)').run(1, c));
cats2.forEach(c => db.prepare('INSERT INTO product_categories (sector_id, name) VALUES (?,?)').run(2, c));
cats3.forEach(c => db.prepare('INSERT INTO product_categories (sector_id, name) VALUES (?,?)').run(3, c));

// PRODUCTS — Sector 1: Transporte
const prods1 = [
  ['TRN-001', 'Filtro de aceite Tractocamión', 1, 'pza', 45, 10, 100, 280, 0],
  ['TRN-002', 'Llanta 11R22.5 Bridgestone', 2, 'pza', 24, 8, 60, 8500, 0],
  ['TRN-003', 'Aceite Motor SAE 15W-40 (20L)', 3, 'cubeta', 18, 5, 40, 1650, 0],
  ['TRN-004', 'Diésel (litros)', 4, 'lt', 5000, 1000, 10000, 23.50, 0],
  ['TRN-005', 'Balatas de freno K16', 1, 'juego', 12, 4, 30, 1200, 0],
  ['TRN-006', 'Kit de clutch Eaton Fuller', 1, 'kit', 6, 2, 15, 12500, 0],
  ['TRN-007', 'Manguera radiador 2"', 1, 'pza', 15, 5, 30, 450, 0],
  ['TRN-008', 'Anticongelante (galón)', 3, 'galón', 30, 10, 50, 320, 0],
  ['TRN-009', 'Batería 12V HD Optima', 1, 'pza', 8, 3, 20, 4800, 0],
  ['TRN-010', 'Juego luces LED remolque', 1, 'juego', 10, 3, 25, 1800, 0],
];
prods1.forEach(p => db.prepare('INSERT INTO products (sector_id, sku, name, category_id, unit, stock, min_stock, max_stock, cost_price, sale_price) VALUES (?,?,?,?,?,?,?,?,?,?)').run(1, ...p));

// Products - Sector 2: Tlapalería
const prods2 = [
  ['TLP-001', 'Pintura Vinílica Comex 19L Blanco', 6, 'cubeta', 35, 10, 80, 850, 1150],
  ['TLP-002', 'Cable THW Cal. 12 (100m)', 7, 'rollo', 28, 8, 50, 680, 920],
  ['TLP-003', 'Tubo PVC 4" (6m)', 8, 'tramo', 42, 15, 100, 185, 280],
  ['TLP-004', 'Cemento Cruz Azul 50kg', 12, 'saco', 120, 30, 200, 195, 250],
  ['TLP-005', 'Varilla 3/8" (12m)', 12, 'pza', 200, 50, 500, 95, 135],
  ['TLP-006', 'Silicón transparente 280ml', 10, 'pza', 65, 20, 150, 65, 95],
  ['TLP-007', 'Taladro Bosch 550W', 11, 'pza', 8, 3, 20, 1250, 1680],
  ['TLP-008', 'Flexómetro Stanley 8m', 11, 'pza', 24, 8, 50, 145, 210],
];
prods2.forEach(p => db.prepare('INSERT INTO products (sector_id, sku, name, category_id, unit, stock, min_stock, max_stock, cost_price, sale_price) VALUES (?,?,?,?,?,?,?,?,?,?)').run(2, ...p));

// Products - Sector 3: Cementera
const prods3 = [
  ['CEM-001', 'Clinker (tonelada)', 13, 'ton', 850, 200, 2000, 1200, 0],
  ['CEM-002', 'Yeso Industrial (tonelada)', 13, 'ton', 120, 30, 300, 800, 0],
  ['CEM-003', 'Caliza Triturada (tonelada)', 13, 'ton', 2500, 500, 5000, 350, 0],
  ['CEM-004', 'Saco de Cemento 50kg', 16, 'saco', 15000, 3000, 30000, 120, 195],
  ['CEM-005', 'Rodamiento Molino Bolas', 14, 'pza', 4, 2, 10, 45000, 0],
  ['CEM-006', 'Carbón Mineral (tonelada)', 15, 'ton', 300, 100, 800, 2800, 0],
];
prods3.forEach(p => db.prepare('INSERT INTO products (sector_id, sku, name, category_id, unit, stock, min_stock, max_stock, cost_price, sale_price) VALUES (?,?,?,?,?,?,?,?,?,?)').run(3, ...p));

// EMPLOYEES
const emps = [
  [1, 'EMP-T001', 'Pedro Ramírez Soto', 'Chofer de Trailer', 'Operaciones', 18000, '2022-03-15'],
  [1, 'EMP-T002', 'Miguel Ángel Torres', 'Chofer de Trailer', 'Operaciones', 18000, '2021-08-01'],
  [1, 'EMP-T003', 'Josefina Ruiz Páez', 'Contadora', 'Finanzas', 25000, '2020-01-10'],
  [1, 'EMP-T004', 'Raúl Domínguez', 'Mecánico', 'Mantenimiento', 15000, '2023-02-20'],
  [1, 'EMP-T005', 'Fernando Castillo', 'Coordinador Logístico', 'Logística', 22000, '2021-11-01'],
  [1, 'EMP-T006', 'Sandra Morales', 'Asistente Administrativa', 'Administración', 12000, '2023-06-15'],
  [1, 'EMP-T007', 'Luis Enrique Vargas', 'Chofer de Rabon', 'Operaciones', 14000, '2024-01-08'],
  [1, 'EMP-T008', 'Gloria Estrada', 'Recursos Humanos', 'RH', 20000, '2022-07-01'],
  [2, 'EMP-TL01', 'Jorge Villanueva', 'Encargado de Tienda', 'Ventas', 14000, '2020-05-10'],
  [2, 'EMP-TL02', 'Adriana López', 'Cajera', 'Ventas', 9500, '2023-01-15'],
  [2, 'EMP-TL03', 'Martín Ochoa', 'Almacenista', 'Almacén', 10500, '2022-09-01'],
  [2, 'EMP-TL04', 'Daniela Rivas', 'Vendedora', 'Ventas', 9000, '2024-03-01'],
  [3, 'EMP-CE01', 'Ingeniero Carlos Huerta', 'Jefe de Planta', 'Producción', 45000, '2019-04-01'],
  [3, 'EMP-CE02', 'Técnico Ramón Aguilar', 'Operador de Molino', 'Producción', 16000, '2021-06-15'],
  [3, 'EMP-CE03', 'Ing. Patricia Mejía', 'Control de Calidad', 'Calidad', 32000, '2020-02-01'],
  [3, 'EMP-CE04', 'Supervisor José Lara', 'Supervisor de Turno', 'Producción', 22000, '2022-01-10'],
  [3, 'EMP-CE05', 'Héctor Navarro', 'Operador de Horno', 'Producción', 18000, '2023-03-20'],
];
emps.forEach(e => db.prepare('INSERT INTO employees (sector_id, employee_code, full_name, position, department, base_salary, hire_date) VALUES (?,?,?,?,?,?,?)').run(...e));

// SUPPLIERS
const sups = [
  [1, 'LlantasMax Nacional SA de CV', 'Ing. Roberto Salinas', 'ventas@llantasmax.com', '55-4321-8765', 'Monterrey', 'Nuevo León', 'Llantas', 4.5],
  [1, 'Lubricantes del Norte', 'Lic. Patricia Montes', 'patricia@lubnorte.com', '81-2345-6789', 'Saltillo', 'Coahuila', 'Lubricantes', 4.2],
  [1, 'AutoRefacciones Plus', 'Carlos Ibarra', 'cibarra@autorefplus.com', '33-8765-4321', 'Guadalajara', 'Jalisco', 'Refacciones', 3.8],
  [1, 'Gasolinera Central CDMX', 'Juan Martínez', 'admin@gascentral.com', '55-1122-3344', 'CDMX', 'CDMX', 'Combustible', 4.0],
  [2, 'Distribuidora Comex Centro', 'Sofía Reyes', 'sofia@comexcentro.com', '222-334-5566', 'Puebla', 'Puebla', 'Pintura', 4.7],
  [2, 'Materiales Jiménez e Hijos', 'Don Manuel Jiménez', 'mjimenez@matjimenez.com', '222-556-7788', 'Puebla', 'Puebla', 'Construcción', 4.3],
  [2, 'Eléctricos Nacionales SA', 'Ing. Laura Quintero', 'lquintero@elecnac.com', '55-9988-7766', 'CDMX', 'CDMX', 'Electricidad', 4.1],
  [3, 'Minera Caliza del Pacífico', 'Ing. Alejandro Sosa', 'asosa@mincalpac.com', '667-123-4567', 'Hermosillo', 'Sonora', 'Materia Prima', 4.6],
  [3, 'Carbones Industriales MX', 'Lic. Fernando Díaz', 'fdiaz@carbonesindustriales.com', '871-234-5678', 'Torreón', 'Coahuila', 'Combustible', 4.0],
  [3, 'Rodamientos SKF México', 'Ing. Marcela Fuentes', 'mfuentes@skf.mx', '55-2233-4455', 'CDMX', 'CDMX', 'Refacciones', 4.8],
];
sups.forEach(s => db.prepare('INSERT INTO suppliers (sector_id, company_name, contact_name, email, phone, city, state, category, rating, status) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...s, 'active'));

// EXPENSE CATEGORIES
const ecs = [
  [1, 'Combustible', 150000], [1, 'Mantenimiento Vehicular', 80000], [1, 'Peajes y Casetas', 45000], [1, 'Seguros', 60000], [1, 'Nómina', 200000],
  [2, 'Compra de Mercancía', 120000], [2, 'Renta de Local', 15000], [2, 'Servicios (Luz, Agua)', 8000], [2, 'Publicidad', 5000],
  [3, 'Materia Prima', 500000], [3, 'Energía Eléctrica', 200000], [3, 'Mantenimiento Industrial', 150000], [3, 'Transporte de Producto', 100000],
];
ecs.forEach(c => db.prepare('INSERT INTO expense_categories (sector_id, name, budget_limit) VALUES (?,?,?)').run(...c));

// EXPENSES
const exps = [
  [1, 1, 'Carga de diésel - Unidad TRK-05', 12500, '2026-06-01', 'Operaciones', 'approved', 'card'],
  [1, 1, 'Carga de diésel - Unidad TRK-12', 15200, '2026-06-03', 'Operaciones', 'approved', 'card'],
  [1, 2, 'Cambio de frenos Unidad TRK-05', 8900, '2026-06-05', 'Mantenimiento', 'approved', 'transfer'],
  [1, 3, 'Casetas ruta CDMX-Monterrey', 3200, '2026-06-07', 'Operaciones', 'pending', 'tag'],
  [1, 2, 'Servicio preventivo Unidad TRK-08', 6500, '2026-06-10', 'Mantenimiento', 'pending', 'transfer'],
  [2, 6, 'Pedido Comex - Pintura vinílica', 28500, '2026-06-02', 'Compras', 'approved', 'transfer'],
  [2, 7, 'Renta mensual local Junio', 15000, '2026-06-01', 'Administración', 'approved', 'transfer'],
  [2, 8, 'Recibo de luz Mayo', 4200, '2026-05-28', 'Administración', 'approved', 'transfer'],
  [3, 10, 'Compra caliza - 500 ton', 175000, '2026-06-01', 'Producción', 'approved', 'transfer'],
  [3, 11, 'Consumo eléctrico Mayo', 185000, '2026-05-30', 'Planta', 'approved', 'transfer'],
  [3, 12, 'Reparación banda transportadora', 45000, '2026-06-08', 'Mantenimiento', 'pending', 'transfer'],
];
exps.forEach(e => db.prepare('INSERT INTO expenses (sector_id, category_id, description, amount, date, department, status, payment_method, submitted_by) VALUES (?,?,?,?,?,?,?,?,?)').run(...e, 1));

// SUPPLIES
const supls = [
  [1, 'INS-T001', 'Aceite hidráulico AW-68', 'Lubricantes', 'lt', 200, 50, 45],
  [1, 'INS-T002', 'Manguera neumática 3/8"', 'Repuestos', 'mt', 100, 30, 35],
  [1, 'INS-T003', 'Fusibles 15A (caja 10)', 'Eléctrico', 'caja', 25, 10, 85],
  [2, 'INS-TL01', 'Bolsas de papel para empaque', 'Empaque', 'paquete', 50, 15, 120],
  [2, 'INS-TL02', 'Etiquetas de precio', 'Papelería', 'rollo', 12, 5, 45],
  [3, 'INS-CE01', 'Bolas de acero para molino', 'Producción', 'ton', 15, 5, 18000],
  [3, 'INS-CE02', 'Filtros manga colector', 'Filtración', 'pza', 40, 15, 2500],
  [3, 'INS-CE03', 'Refractario para horno', 'Producción', 'ton', 8, 3, 35000],
];
supls.forEach(s => db.prepare('INSERT INTO supplies (sector_id, code, name, category, unit, stock, reorder_point, unit_cost) VALUES (?,?,?,?,?,?,?,?)').run(...s));

// TRAVEL
const tvs = [
  [1, 5, 'Monterrey, NL', 'CDMX', 'Reunión con cliente Transportes del Norte', '2026-06-20', '2026-06-22', 8500, 'approved', 'flight'],
  [1, 3, 'Guadalajara, JAL', 'CDMX', 'Auditoría fiscal trimestral', '2026-07-01', '2026-07-03', 12000, 'pending', 'flight'],
  [3, 13, 'Alemania (Düsseldorf)', 'CDMX', 'Feria Industrial GIFA 2026', '2026-08-15', '2026-08-22', 85000, 'pending', 'flight'],
];
tvs.forEach(t => db.prepare('INSERT INTO travel_requests (sector_id, employee_id, destination, origin, purpose, start_date, end_date, estimated_budget, status, transport_type, submitted_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...t, 1));

// PAYROLL PERIODS
const pps = [
  [1, 'Quincena 1 - Junio 2026', 'quincenal', '2026-06-01', '2026-06-15', 'calculated', 0, 0, 0],
  [1, 'Quincena 2 - Mayo 2026', 'quincenal', '2026-05-16', '2026-05-31', 'closed', 0, 0, 0],
  [2, 'Quincena 1 - Junio 2026', 'quincenal', '2026-06-01', '2026-06-15', 'draft', 0, 0, 0],
];
pps.forEach(p => db.prepare('INSERT INTO payroll_periods (sector_id, name, period_type, period_start, period_end, status, total_gross, total_deductions, total_net, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)').run(...p, 1));

function seedCalculatePayroll(periodId, sectorId, status) {
  const employees = db.prepare('SELECT * FROM employees WHERE sector_id = ? AND active = 1').all(sectorId);
  db.prepare('DELETE FROM payroll_details WHERE period_id = ?').run(periodId);
  
  let totalGross = 0, totalDeductions = 0, totalNet = 0;
  const insertDetail = db.prepare(
    'INSERT INTO payroll_details (period_id, employee_id, days_worked, base_salary, overtime_hours, overtime_pay, bonuses, deductions_imss, deductions_isr, deductions_other, gross_pay, total_deductions, net_pay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
  );
  
  for (const emp of employees) {
    const dailySalary = emp.base_salary / 30;
    const daysWorked = 15;
    const basePay = dailySalary * daysWorked;
    const overtimePay = 0;
    const bonuses = 0;
    const grossPay = basePay + overtimePay + bonuses;
    const imss = grossPay * 0.025;
    const isr = grossPay > 15000 ? grossPay * 0.12 : grossPay * 0.08;
    const otherDed = 0;
    const totalDed = imss + isr + otherDed;
    const netPay = grossPay - totalDed;
    
    insertDetail.run(periodId, emp.id, daysWorked, basePay, 0, overtimePay, bonuses, imss, isr, otherDed, grossPay, totalDed, netPay);
    totalGross += grossPay; totalDeductions += totalDed; totalNet += netPay;
  }
  db.prepare('UPDATE payroll_periods SET total_gross = ?, total_deductions = ?, total_net = ?, status = ? WHERE id = ?')
    .run(totalGross, totalDeductions, totalNet, status, periodId);
}

// Pre-calculate payroll details for calculated/closed periods in Sector 1
seedCalculatePayroll(1, 1, 'calculated');
seedCalculatePayroll(2, 1, 'closed');

db.save();

console.log('✅ Seed completed successfully!');
console.log('');
console.log('📋 Demo credentials:');
console.log('   Super Admin:  admin / admin123');
console.log('   Admin Trans:  carlos.mendez / admin123');
console.log('   Manager:      ana.garcia / admin123');
console.log('   Admin Tlapa:  roberto.tlapa / admin123');
console.log('   Admin Cement: maria.cemento / admin123');
console.log('   Operator:     operator1 / admin123');
console.log('   Viewer:       viewer1 / admin123');
console.log('');
console.log('🏭 Sectors: Transporte, Tlapalería, Planta Cementera, Alquiler Maquinaria, Metalurgia');

process.exit(0);
