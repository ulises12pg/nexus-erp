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
          { header: 'Costo Costo.', key: 'unit_cost', width: 12 },
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

      // Ensure gridlines are visible
      worksheet.views = [{ showGridLines: true }];

      worksheet.columns = columns.map(col => ({
        ...col,
        style: {
          font: { name: 'Arial', size: 10 },
          alignment: { vertical: 'middle' }
        }
      }));

      // Add Title row
      worksheet.mergeCells('A1:' + String.fromCharCode(64 + columns.length) + '1');
      const titleRow = worksheet.getRow(1);
      titleRow.height = 35;
      const titleCell = titleRow.getCell(1);
      titleCell.value = title.toUpperCase();
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002147' } }; // Dark Corporate Blue
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Add Metadata row
      worksheet.mergeCells('A2:' + String.fromCharCode(64 + columns.length) + '2');
      const metaRow = worksheet.getRow(2);
      metaRow.height = 20;
      const metaCell = metaRow.getCell(1);
      metaCell.value = `Generado el: ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')} | NEXUS ERP`;
      metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
      metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      metaCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Spacer
      worksheet.addRow([]);
      worksheet.getRow(3).height = 10;

      // Table Headers
      const headerRow = worksheet.getRow(4);
      headerRow.height = 30;
      columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header.toUpperCase();
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003366' } }; // Secondary Corporate Blue
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF002147' } },
          left: { style: 'thin', color: { argb: 'FF002147' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF002147' } }
        };
      });

      // Data Rows
      data.forEach((row, rowIndex) => {
        const newRow = worksheet.addRow(row);
        newRow.height = 20;

        columns.forEach((col, colIdx) => {
          const cell = newRow.getCell(colIdx + 1);
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          const isNumeric = ['stock', 'min_stock', 'max_stock', 'rating', 'reorder_point'].includes(col.key);
          const isCurrency = ['cost_price', 'sale_price', 'base_salary', 'amount', 'estimated_budget', 'actual_cost', 'unit_cost'].includes(col.key);

          if (isNumeric) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          } else if (isCurrency) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '$#,##0.00';
          } else if (['sku', 'employee_code', 'code', 'date', 'hire_date', 'start_date', 'end_date', 'status'].includes(col.key)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }

          if (rowIndex % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
        });
      });

      // Auto-fit Columns
      columns.forEach((col, colIdx) => {
        let maxLen = col.header.length;
        data.forEach(row => {
          const val = row[col.key];
          if (val != null) {
            let formatted = String(val);
            if (['cost_price', 'sale_price', 'base_salary', 'amount', 'estimated_budget', 'actual_cost', 'unit_cost'].includes(col.key)) {
              formatted = `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            }
            if (formatted.length > maxLen) maxLen = formatted.length;
          }
        });
        worksheet.getColumn(colIdx + 1).width = Math.min(Math.max(maxLen + 4, col.width || 12), 40);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${module}_report.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'letter', layout: 'landscape', bufferPages: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${module}_report.pdf`);
      doc.pipe(res);

      const pageWidth = doc.page.width - 80;
      const startX = 40;

      let colWidths = {};
      switch (module) {
        case 'inventory':
          colWidths = { sku: 0.10, name: 0.25, category: 0.15, stock: 0.08, unit: 0.08, cost_price: 0.11, sale_price: 0.11, min_stock: 0.06, max_stock: 0.06 };
          break;
        case 'employees':
          colWidths = { employee_code: 0.10, full_name: 0.22, position: 0.16, department: 0.14, base_salary: 0.11, hire_date: 0.10, email: 0.17 };
          break;
        case 'expenses':
          colWidths = { date: 0.10, description: 0.22, category: 0.14, amount: 0.11, department: 0.12, payment_method: 0.11, status: 0.10, submitted_by: 0.10 };
          break;
        case 'suppliers':
          colWidths = { company_name: 0.20, contact_name: 0.15, email: 0.18, phone: 0.11, city: 0.10, state: 0.08, category: 0.08, rating: 0.05, status: 0.05 };
          break;
        case 'supplies':
          colWidths = { code: 0.10, name: 0.24, category: 0.14, stock: 0.08, unit: 0.08, reorder_point: 0.10, unit_cost: 0.10, supplier: 0.16 };
          break;
        case 'travel':
          colWidths = { employee: 0.15, destination: 0.13, origin: 0.10, purpose: 0.18, start_date: 0.09, end_date: 0.09, estimated_budget: 0.09, actual_cost: 0.09, status: 0.08 };
          break;
        default:
          colWidths = {};
          columns.forEach(col => colWidths[col.key] = 1 / columns.length);
      }

      const drawHeader = () => {
        doc.rect(0, 0, doc.page.width, 60).fill('#002147'); // Corporate Blue Header Band
        doc.fontSize(18).fillColor('#FFFFFF').text('NEXUS ERP', startX, 20, { bold: true });
        doc.fontSize(14).fillColor('#E2E8F0').text(title.toUpperCase(), startX + 150, 22, { bold: true });
        doc.fontSize(9).fillColor('#CBD5E1').text(`Fecha: ${new Date().toLocaleDateString('es-MX')}  |  Reporte Oficial`, doc.page.width - startX - 250, 25, { align: 'right', width: 250 });
      };

      drawHeader();

      let y = 80;

      const drawTableHeader = (startY) => {
        doc.fontSize(8).fillColor('#FFFFFF');
        doc.rect(startX, startY, pageWidth, 22).fill('#003366'); // Secondary Corporate Blue
        
        let currentX = startX;
        columns.forEach(col => {
          const w = (colWidths[col.key] || (1 / columns.length)) * pageWidth;
          doc.fillColor('#FFFFFF').text(
            col.header.toUpperCase(), 
            currentX + 4, 
            startY + 7, 
            { width: w - 8, align: 'center', lineBreak: false }
          );
          currentX += w;
        });
        return startY + 22;
      };

      y = drawTableHeader(y);

      data.forEach((row, idx) => {
        if (y > doc.page.height - 70) {
          doc.addPage();
          drawHeader();
          y = drawTableHeader(80);
        }

        if (idx % 2 === 0) {
          doc.rect(startX, y, pageWidth, 20).fill('#F8FAFC');
        }

        doc.moveTo(startX, y + 20).lineTo(startX + pageWidth, y + 20).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fontSize(7.5).fillColor('#334155');
        let currentX = startX;
        columns.forEach(col => {
          const w = (colWidths[col.key] || (1 / columns.length)) * pageWidth;
          let val = row[col.key] != null ? String(row[col.key]) : '';
          
          const isCurrency = ['cost_price', 'sale_price', 'base_salary', 'amount', 'estimated_budget', 'actual_cost', 'unit_cost'].includes(col.key);
          const isNumeric = ['stock', 'min_stock', 'max_stock', 'rating', 'reorder_point'].includes(col.key);
          
          if (isCurrency && val !== '') {
            val = `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          } else if (isNumeric && val !== '') {
            val = Number(val).toLocaleString('es-MX');
          } else if (col.key === 'date' || col.key === 'hire_date' || col.key === 'start_date' || col.key === 'end_date') {
            try {
              if (val) {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                  val = d.toLocaleDateString('es-MX');
                }
              }
            } catch(e) {}
          }

          let align = 'left';
          if (isCurrency || isNumeric) align = 'right';
          else if (['sku', 'employee_code', 'code', 'date', 'hire_date', 'start_date', 'end_date', 'status'].includes(col.key)) align = 'center';

          doc.text(
            val, 
            currentX + 4, 
            y + 6, 
            { width: w - 8, align: align, lineBreak: false }
          );
          currentX += w;
        });

        y += 20;
      });

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(startX, doc.page.height - 40).lineTo(startX + pageWidth, doc.page.height - 40).strokeColor('#002147').lineWidth(1).stroke();
        doc.fontSize(8).fillColor('#002147').text(
          `Página ${i + 1} de ${range.count} | NEXUS ERP — Reporte Oficial`, 
          startX, 
          doc.page.height - 30, 
          { align: 'center', width: pageWidth }
        );
      }

      doc.end();
    } else {
      res.status(400).json({ error: 'Format must be "excel" or "pdf".' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
