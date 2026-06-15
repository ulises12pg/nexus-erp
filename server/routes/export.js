import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { getDb } from '../config/database.js';

const router = Router();

// GET /api/export/:module/:format
router.get('/:module/:format', async (req, res) => {
  try {
    const db = getDb();
    const { module, format } = req.params;
    const sectorId = req.user.sector_id;
    let data = [];
    let columns = [];
    let title = '';

    switch (module) {
      case 'inventory':
        data = db.prepare('SELECT p.sku, p.name, p.stock, p.unit, p.cost_price, p.sale_price, p.min_stock, p.max_stock, pc.name as category FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.sector_id = ? AND p.active = 1 ORDER BY p.name').all(sectorId);
        columns = [
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Producto', key: 'name', width: 30 },
          { header: 'Categoría', key: 'category', width: 20 },
          { header: 'Stock', key: 'stock', width: 12 },
          { header: 'Unidad', key: 'unit', width: 10 },
          { header: 'Costo', key: 'cost_price', width: 15 },
          { header: 'Precio Venta', key: 'sale_price', width: 15 },
          { header: 'Mín', key: 'min_stock', width: 10 },
          { header: 'Máx', key: 'max_stock', width: 10 }
        ];
        title = 'Reporte de Inventario';
        break;

      case 'employees':
        data = db.prepare('SELECT employee_code, full_name, position, department, base_salary, hire_date, email, phone FROM employees WHERE sector_id = ? AND active = 1 ORDER BY full_name').all(sectorId);
        columns = [
          { header: 'Código', key: 'employee_code', width: 12 },
          { header: 'Nombre', key: 'full_name', width: 30 },
          { header: 'Puesto', key: 'position', width: 20 },
          { header: 'Departamento', key: 'department', width: 20 },
          { header: 'Salario Base', key: 'base_salary', width: 15 },
          { header: 'Fecha Ingreso', key: 'hire_date', width: 15 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Teléfono', key: 'phone', width: 15 }
        ];
        title = 'Reporte de Empleados';
        break;

      case 'expenses':
        data = db.prepare("SELECT e.date, e.description, ec.name as category, e.amount, e.department, e.payment_method, e.status, u.full_name as submitted_by FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id LEFT JOIN users u ON e.submitted_by = u.id WHERE e.sector_id = ? ORDER BY e.date DESC").all(sectorId);
        columns = [
          { header: 'Fecha', key: 'date', width: 12 },
          { header: 'Descripción', key: 'description', width: 30 },
          { header: 'Categoría', key: 'category', width: 20 },
          { header: 'Monto', key: 'amount', width: 15 },
          { header: 'Departamento', key: 'department', width: 15 },
          { header: 'Método Pago', key: 'payment_method', width: 15 },
          { header: 'Estado', key: 'status', width: 12 },
          { header: 'Solicitado por', key: 'submitted_by', width: 20 }
        ];
        title = 'Reporte de Gastos Operativos';
        break;

      case 'suppliers':
        data = db.prepare('SELECT company_name, contact_name, email, phone, city, state, category, rating, status FROM suppliers WHERE sector_id = ? ORDER BY company_name').all(sectorId);
        columns = [
          { header: 'Empresa', key: 'company_name', width: 25 },
          { header: 'Contacto', key: 'contact_name', width: 20 },
          { header: 'Email', key: 'email', width: 25 },
          { header: 'Teléfono', key: 'phone', width: 15 },
          { header: 'Ciudad', key: 'city', width: 15 },
          { header: 'Estado', key: 'state', width: 15 },
          { header: 'Categoría', key: 'category', width: 15 },
          { header: 'Rating', key: 'rating', width: 10 },
          { header: 'Status', key: 'status', width: 10 }
        ];
        title = 'Reporte de Proveedores';
        break;

      case 'supplies':
        data = db.prepare('SELECT s.code, s.name, s.category, s.stock, s.unit, s.reorder_point, s.unit_cost, sup.company_name as supplier FROM supplies s LEFT JOIN suppliers sup ON s.preferred_supplier_id = sup.id WHERE s.sector_id = ? AND s.active = 1 ORDER BY s.name').all(sectorId);
        columns = [
          { header: 'Código', key: 'code', width: 12 },
          { header: 'Insumo', key: 'name', width: 30 },
          { header: 'Categoría', key: 'category', width: 20 },
          { header: 'Stock', key: 'stock', width: 10 },
          { header: 'Unidad', key: 'unit', width: 10 },
          { header: 'Punto Reorden', key: 'reorder_point', width: 15 },
          { header: 'Costo Unit.', key: 'unit_cost', width: 12 },
          { header: 'Proveedor', key: 'supplier', width: 25 }
        ];
        title = 'Reporte de Insumos';
        break;

      case 'travel':
        data = db.prepare('SELECT tr.destination, tr.origin, tr.purpose, tr.start_date, tr.end_date, tr.estimated_budget, tr.actual_cost, tr.status, e.full_name as employee FROM travel_requests tr JOIN employees e ON tr.employee_id = e.id WHERE tr.sector_id = ? ORDER BY tr.start_date DESC').all(sectorId);
        columns = [
          { header: 'Empleado', key: 'employee', width: 20 },
          { header: 'Destino', key: 'destination', width: 20 },
          { header: 'Origen', key: 'origin', width: 15 },
          { header: 'Propósito', key: 'purpose', width: 25 },
          { header: 'Inicio', key: 'start_date', width: 12 },
          { header: 'Fin', key: 'end_date', width: 12 },
          { header: 'Presupuesto', key: 'estimated_budget', width: 15 },
          { header: 'Costo Real', key: 'actual_cost', width: 15 },
          { header: 'Estado', key: 'status', width: 12 }
        ];
        title = 'Reporte de Viajes';
        break;

      default:
        return res.status(400).json({ error: 'Invalid module.' });
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NEXUS ERP';
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet(title);
      worksheet.columns = columns;

      // Header styling
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      worksheet.getRow(1).alignment = { horizontal: 'center' };

      data.forEach(row => worksheet.addRow(row));

      // Alternating row colors
      for (let i = 2; i <= data.length + 1; i++) {
        if (i % 2 === 0) {
          worksheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${module}_report.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${module}_report.pdf`);
      doc.pipe(res);

      // Title
      doc.fontSize(18).fillColor('#6366F1').text(title, { align: 'center' });
      doc.fontSize(10).fillColor('#666').text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
      doc.moveDown(1);

      // Simple table
      const pageWidth = doc.page.width - 80;
      const colWidth = pageWidth / Math.min(columns.length, 8);
      const startX = 40;
      let y = doc.y;

      // Header
      doc.fontSize(8).fillColor('#FFFFFF');
      doc.rect(startX, y, pageWidth, 18).fill('#6366F1');
      columns.slice(0, 8).forEach((col, i) => {
        doc.fillColor('#FFFFFF').text(col.header, startX + i * colWidth + 4, y + 4, { width: colWidth - 8, lineBreak: false });
      });
      y += 20;

      // Rows
      data.forEach((row, idx) => {
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }
        if (idx % 2 === 0) doc.rect(startX, y, pageWidth, 16).fill('#F3F4F6');
        doc.fontSize(7).fillColor('#333');
        columns.slice(0, 8).forEach((col, i) => {
          const val = row[col.key] != null ? String(row[col.key]) : '';
          doc.text(val.substring(0, 30), startX + i * colWidth + 4, y + 3, { width: colWidth - 8, lineBreak: false });
        });
        y += 16;
      });

      doc.end();
    } else {
      res.status(400).json({ error: 'Format must be "excel" or "pdf".' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
