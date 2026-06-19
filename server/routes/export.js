import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { getDb } from '../config/database.js';

const router = Router();

// ─── Brand palette ────────────────────────────────────────────────────────────
const BRAND = {
  navy:      'FF001F3F',  // deepest navy
  blue:      'FF003366',  // corporate blue
  accent:    'FF0066CC',  // bright accent
  silver:    'FFF0F4F8',  // light row alternate
  border:    'FFD1DCE8',  // subtle grid border
  text:      'FF1A2332',  // near-black text
  textLight: 'FF5B7082',  // muted label
  white:     'FFFFFFFF',
};

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
          { header: 'SKU',          key: 'sku',         width: 14 },
          { header: 'Producto',     key: 'name',        width: 32 },
          { header: 'Categoría',    key: 'category',    width: 20 },
          { header: 'Stock',        key: 'stock',       width: 10 },
          { header: 'Unidad',       key: 'unit',        width: 10 },
          { header: 'Costo',        key: 'cost_price',  width: 15 },
          { header: 'Precio Venta', key: 'sale_price',  width: 15 },
          { header: 'Mín',          key: 'min_stock',   width: 10 },
          { header: 'Máx',          key: 'max_stock',   width: 10 },
        ];
        title = 'Reporte de Inventario';
        break;

      case 'employees':
        data = db.prepare('SELECT employee_code, full_name, position, department, base_salary, hire_date, email, phone FROM employees WHERE sector_id = ? AND active = 1 ORDER BY full_name').all(sectorId);
        columns = [
          { header: 'Código',        key: 'employee_code', width: 12 },
          { header: 'Nombre',        key: 'full_name',     width: 30 },
          { header: 'Puesto',        key: 'position',      width: 20 },
          { header: 'Departamento',  key: 'department',    width: 20 },
          { header: 'Salario Base',  key: 'base_salary',   width: 15 },
          { header: 'Fecha Ingreso', key: 'hire_date',     width: 15 },
          { header: 'Email',         key: 'email',         width: 28 },
          { header: 'Teléfono',      key: 'phone',         width: 15 },
        ];
        title = 'Reporte de Empleados';
        break;

      case 'expenses':
        data = db.prepare("SELECT e.date, e.description, ec.name as category, e.amount, e.department, e.payment_method, e.status, u.full_name as submitted_by FROM expenses e LEFT JOIN expense_categories ec ON e.category_id = ec.id LEFT JOIN users u ON e.submitted_by = u.id WHERE e.sector_id = ? ORDER BY e.date DESC").all(sectorId);
        columns = [
          { header: 'Fecha',          key: 'date',           width: 13 },
          { header: 'Descripción',    key: 'description',    width: 30 },
          { header: 'Categoría',      key: 'category',       width: 20 },
          { header: 'Monto',          key: 'amount',         width: 14 },
          { header: 'Departamento',   key: 'department',     width: 18 },
          { header: 'Método Pago',    key: 'payment_method', width: 15 },
          { header: 'Estado',         key: 'status',         width: 12 },
          { header: 'Solicitado por', key: 'submitted_by',   width: 22 },
        ];
        title = 'Reporte de Gastos Operativos';
        break;

      case 'suppliers':
        data = db.prepare('SELECT company_name, contact_name, email, phone, city, state, category, rating, status FROM suppliers WHERE sector_id = ? ORDER BY company_name').all(sectorId);
        columns = [
          { header: 'Empresa',   key: 'company_name',  width: 26 },
          { header: 'Contacto',  key: 'contact_name',  width: 22 },
          { header: 'Email',     key: 'email',         width: 28 },
          { header: 'Teléfono', key: 'phone',          width: 15 },
          { header: 'Ciudad',    key: 'city',          width: 16 },
          { header: 'Estado',    key: 'state',         width: 14 },
          { header: 'Categoría', key: 'category',      width: 16 },
          { header: 'Rating',    key: 'rating',        width: 10 },
          { header: 'Status',    key: 'status',        width: 12 },
        ];
        title = 'Reporte de Proveedores';
        break;

      case 'supplies':
        data = db.prepare('SELECT s.code, s.name, s.category, s.stock, s.unit, s.reorder_point, s.unit_cost, sup.company_name as supplier FROM supplies s LEFT JOIN suppliers sup ON s.preferred_supplier_id = sup.id WHERE s.sector_id = ? AND s.active = 1 ORDER BY s.name').all(sectorId);
        columns = [
          { header: 'Código',        key: 'code',          width: 13 },
          { header: 'Insumo',        key: 'name',          width: 30 },
          { header: 'Categoría',     key: 'category',      width: 20 },
          { header: 'Stock',         key: 'stock',         width: 10 },
          { header: 'Unidad',        key: 'unit',          width: 10 },
          { header: 'Punto Reorden', key: 'reorder_point', width: 15 },
          { header: 'Costo Unit.',   key: 'unit_cost',     width: 13 },
          { header: 'Proveedor',     key: 'supplier',      width: 26 },
        ];
        title = 'Reporte de Insumos';
        break;

      case 'travel':
        data = db.prepare('SELECT tr.destination, tr.origin, tr.purpose, tr.start_date, tr.end_date, tr.estimated_budget, tr.actual_cost, tr.status, e.full_name as employee FROM travel_requests tr JOIN employees e ON tr.employee_id = e.id WHERE tr.sector_id = ? ORDER BY tr.start_date DESC').all(sectorId);
        columns = [
          { header: 'Empleado',      key: 'employee',          width: 22 },
          { header: 'Destino',       key: 'destination',       width: 18 },
          { header: 'Origen',        key: 'origin',            width: 14 },
          { header: 'Propósito',     key: 'purpose',           width: 26 },
          { header: 'Inicio',        key: 'start_date',        width: 13 },
          { header: 'Fin',           key: 'end_date',          width: 13 },
          { header: 'Presupuesto',   key: 'estimated_budget',  width: 15 },
          { header: 'Costo Real',    key: 'actual_cost',       width: 15 },
          { header: 'Estado',        key: 'status',            width: 12 },
        ];
        title = 'Reporte de Viajes de Negocio';
        break;

      case 'sales':
        data = db.prepare('SELECT s.created_at, s.id, s.customer_name, s.payment_method, u.full_name as creator, s.total FROM direct_sales s LEFT JOIN users u ON s.created_by = u.id WHERE s.sector_id = ? ORDER BY s.created_at DESC').all(sectorId);
        columns = [
          { header: 'Fecha',        key: 'created_at',     width: 22 },
          { header: 'Folio',        key: 'id',             width: 10 },
          { header: 'Cliente',      key: 'customer_name',  width: 26 },
          { header: 'Método Pago',  key: 'payment_method', width: 16 },
          { header: 'Vendedor',     key: 'creator',        width: 26 },
          { header: 'Total',        key: 'total',          width: 15 },
        ];
        title = 'Reporte de Ventas Directas';
        break;

      default:
        return res.status(400).json({ error: 'Módulo no válido.' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXCEL
    // ─────────────────────────────────────────────────────────────────────────
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NEXUS ERP';
      workbook.lastModifiedBy = 'NEXUS ERP';
      workbook.created = new Date();
      workbook.modified = new Date();
      const worksheet = workbook.addWorksheet(title, {
        views: [{ showGridLines: false }],
        pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
      });

      // ── Column widths ──
      worksheet.columns = columns.map(col => ({ key: col.key, width: col.width || 14 }));

      const colCount = columns.length;
      const lastCol = String.fromCharCode(64 + colCount);

      // ── Row 1: Main Title ──
      worksheet.mergeCells(`A1:${lastCol}1`);
      const r1 = worksheet.getRow(1);
      r1.height = 40;
      const c1 = r1.getCell(1);
      c1.value = '⬛ NEXUS ERP';
      c1.font = { name: 'Calibri', size: 20, bold: true, color: { argb: BRAND.white } };
      c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.navy } };
      c1.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 };

      // ── Row 2: Report sub-title ──
      worksheet.mergeCells(`A2:${lastCol}2`);
      const r2 = worksheet.getRow(2);
      r2.height = 26;
      const c2 = r2.getCell(1);
      c2.value = title.toUpperCase();
      c2.font = { name: 'Calibri', size: 13, bold: true, color: { argb: BRAND.white } };
      c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.blue } };
      c2.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 };

      // ── Row 3: Meta info ──
      worksheet.mergeCells(`A3:${lastCol}3`);
      const r3 = worksheet.getRow(3);
      r3.height = 18;
      const c3 = r3.getCell(1);
      const now = new Date();
      c3.value = `Generado el ${now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${now.toLocaleTimeString('es-MX')}   |   ${data.length} registro(s)`;
      c3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: BRAND.textLight } };
      c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F9FC' } };
      c3.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 };

      // ── Spacer Row 4 ──
      const r4 = worksheet.getRow(4);
      r4.height = 6;
      worksheet.mergeCells(`A4:${lastCol}4`);
      r4.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.navy } };

      // ── Row 5: Column Headers ──
      const headerRow = worksheet.getRow(5);
      headerRow.height = 28;
      columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.header.toUpperCase();
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: BRAND.white } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.accent } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
        cell.border = {
          bottom: { style: 'medium', color: { argb: BRAND.navy } },
          right: { style: 'hair', color: { argb: BRAND.white } },
        };
      });

      // ── Data Rows ──
      const CURRENCY_KEYS = new Set(['cost_price', 'sale_price', 'base_salary', 'amount', 'estimated_budget', 'actual_cost', 'unit_cost', 'total']);
      const NUMERIC_KEYS  = new Set(['stock', 'min_stock', 'max_stock', 'rating', 'reorder_point']);
      const CENTER_KEYS   = new Set(['sku', 'employee_code', 'code', 'date', 'hire_date', 'start_date', 'end_date', 'status', 'id', 'created_at', 'unit', 'phone', 'payment_method']);

      data.forEach((row, rowIndex) => {
        const dataRow = worksheet.addRow(columns.map(col => {
          const val = row[col.key];
          if (CURRENCY_KEYS.has(col.key)) return typeof val === 'number' ? val : parseFloat(val) || 0;
          if (NUMERIC_KEYS.has(col.key)) return typeof val === 'number' ? val : parseInt(val) || 0;
          return val ?? '';
        }));

        dataRow.height = 20;
        const isAlt = rowIndex % 2 === 1;

        columns.forEach((col, colIdx) => {
          const cell = dataRow.getCell(colIdx + 1);

          // Background
          if (isAlt) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.silver } };
          }

          // Format
          if (CURRENCY_KEYS.has(col.key)) {
            cell.numFmt = '"$"#,##0.00';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else if (NUMERIC_KEYS.has(col.key)) {
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else if (CENTER_KEYS.has(col.key)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          }

          // Border
          cell.border = {
            bottom: { style: 'hair', color: { argb: BRAND.border } },
            right:  { style: 'hair', color: { argb: BRAND.border } },
          };

          cell.font = { name: 'Calibri', size: 9.5, color: { argb: BRAND.text } };
        });
      });

      // ── Totals footer row for currency columns ──
      if (data.length > 0) {
        const totalRow = worksheet.addRow([]);
        totalRow.height = 22;
        const hasCurrencyCol = columns.some(c => CURRENCY_KEYS.has(c.key));
        if (hasCurrencyCol) {
          columns.forEach((col, colIdx) => {
            const cell = totalRow.getCell(colIdx + 1);
            if (colIdx === 0) {
              cell.value = 'TOTAL';
              cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: BRAND.white } };
            } else if (CURRENCY_KEYS.has(col.key)) {
              const dataStartRow = 6; // Row 5 is header, data starts at 6
              const dataEndRow = 5 + data.length;
              cell.value = { formula: `SUM(${String.fromCharCode(64 + colIdx + 1)}${dataStartRow}:${String.fromCharCode(64 + colIdx + 1)}${dataEndRow})` };
              cell.numFmt = '"$"#,##0.00';
              cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: BRAND.white } };
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.navy } };
            cell.border = { top: { style: 'medium', color: { argb: BRAND.accent } } };
          });
        }
      }

      // ── Auto-width refinement ──
      columns.forEach((col, colIdx) => {
        let maxLen = col.header.length + 2;
        data.forEach(row => {
          const val = row[col.key];
          if (val != null) {
            const str = CURRENCY_KEYS.has(col.key)
              ? `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
              : String(val);
            if (str.length > maxLen) maxLen = str.length;
          }
        });
        worksheet.getColumn(colIdx + 1).width = Math.min(Math.max(maxLen + 2, col.width || 12), 45);
      });

      // ─── Send as buffer (reliable cross-browser download) ───────────────────
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `NEXUS_${module}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.byteLength);
      res.setHeader('Cache-Control', 'no-cache');
      res.end(Buffer.from(buffer));

    // ─────────────────────────────────────────────────────────────────────────
    // PDF
    // ─────────────────────────────────────────────────────────────────────────
    } else if (format === 'pdf') {
      const chunks = [];
      const doc = new PDFDocument({
        margin: 40,
        size: 'letter',
        layout: 'landscape',
        bufferPages: true,
        info: {
          Title: title,
          Author: 'NEXUS ERP',
          Subject: `Reporte Oficial — ${title}`,
          Creator: 'NEXUS ERP v1.0',
        },
      });

      // Collect into buffer instead of streaming (ensures proper Content-Length)
      doc.on('data', chunk => chunks.push(chunk));

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const marginX = 40;
      const contentW = pageW - marginX * 2;

      // ── Column proportions ──
      let colWidths = {};
      switch (module) {
        case 'inventory':
          colWidths = { sku: 0.09, name: 0.24, category: 0.14, stock: 0.07, unit: 0.07, cost_price: 0.12, sale_price: 0.12, min_stock: 0.07, max_stock: 0.08 };
          break;
        case 'employees':
          colWidths = { employee_code: 0.09, full_name: 0.22, position: 0.15, department: 0.13, base_salary: 0.11, hire_date: 0.10, email: 0.20 };
          break;
        case 'expenses':
          colWidths = { date: 0.10, description: 0.22, category: 0.12, amount: 0.10, department: 0.12, payment_method: 0.10, status: 0.09, submitted_by: 0.15 };
          break;
        case 'suppliers':
          colWidths = { company_name: 0.19, contact_name: 0.15, email: 0.18, phone: 0.10, city: 0.10, state: 0.08, category: 0.09, rating: 0.05, status: 0.06 };
          break;
        case 'supplies':
          colWidths = { code: 0.09, name: 0.24, category: 0.13, stock: 0.08, unit: 0.07, reorder_point: 0.11, unit_cost: 0.11, supplier: 0.17 };
          break;
        case 'travel':
          colWidths = { employee: 0.14, destination: 0.12, origin: 0.10, purpose: 0.17, start_date: 0.09, end_date: 0.09, estimated_budget: 0.10, actual_cost: 0.10, status: 0.09 };
          break;
        case 'sales':
          colWidths = { created_at: 0.20, id: 0.08, customer_name: 0.22, payment_method: 0.14, creator: 0.22, total: 0.14 };
          break;
        default:
          columns.forEach(col => { colWidths[col.key] = 1 / columns.length; });
      }

      const CURRENCY_KEYS = new Set(['cost_price', 'sale_price', 'base_salary', 'amount', 'estimated_budget', 'actual_cost', 'unit_cost', 'total']);
      const NUMERIC_KEYS  = new Set(['stock', 'min_stock', 'max_stock', 'rating', 'reorder_point']);
      const CENTER_KEYS   = new Set(['sku', 'employee_code', 'code', 'date', 'hire_date', 'start_date', 'end_date', 'status', 'id', 'created_at', 'unit', 'phone', 'payment_method']);

      // ── Page header ──
      const drawPageHeader = () => {
        // Navy bar
        doc.rect(0, 0, pageW, 52).fill('#001F3F');
        // Brand mark square
        doc.rect(marginX, 10, 32, 32).fill('#0066CC');
        doc.fontSize(15).fillColor('#FFFFFF').font('Helvetica-Bold')
          .text('N', marginX + 9, 17, { width: 32, align: 'center', lineBreak: false });
        // Brand name
        doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold')
          .text('NEXUS ERP', marginX + 40, 14, { lineBreak: false });
        // Report title
        doc.fontSize(10).fillColor('#A0BCCC').font('Helvetica')
          .text(title.toUpperCase(), marginX + 40, 31, { lineBreak: false });
        // Date top-right
        const dateStr = `${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        doc.fontSize(8).fillColor('#7090A0').font('Helvetica')
          .text(dateStr, pageW - marginX - 120, 22, { width: 120, align: 'right', lineBreak: false });

        // Accent stripe below header
        doc.rect(0, 52, pageW, 3).fill('#0066CC');
      };

      // ── Table column header band ──
      const drawTableHeader = (startY) => {
        doc.rect(marginX, startY, contentW, 20).fill('#003366');
        doc.fontSize(7.5).fillColor('#FFFFFF').font('Helvetica-Bold');
        let cx = marginX;
        columns.forEach(col => {
          const w = (colWidths[col.key] ?? (1 / columns.length)) * contentW;
          doc.text(col.header.toUpperCase(), cx + 3, startY + 6, { width: w - 6, align: 'center', lineBreak: false });
          cx += w;
        });
        return startY + 20;
      };

      // ── Page footer ──
      const drawPageFooter = (pageNum, totalPages) => {
        doc.rect(marginX, pageH - 30, contentW, 0.5).fill('#003366');
        doc.fontSize(7.5).fillColor('#003366').font('Helvetica')
          .text(
            `NEXUS ERP  ·  ${title}  ·  Página ${pageNum} de ${totalPages}  ·  Generado el ${new Date().toLocaleDateString('es-MX')}`,
            marginX, pageH - 22,
            { width: contentW, align: 'center', lineBreak: false }
          );
      };

      // ── Draw first page header ──
      drawPageHeader();
      let y = 68;
      y = drawTableHeader(y);

      // ── Rows ──
      const ROW_H = 18;
      data.forEach((row, idx) => {
        if (y > pageH - 55) {
          doc.addPage();
          drawPageHeader();
          y = 68;
          y = drawTableHeader(y);
        }

        // Alternating row background
        if (idx % 2 === 0) {
          doc.rect(marginX, y, contentW, ROW_H).fill('#F0F4F8');
        }

        // Subtle row divider
        doc.moveTo(marginX, y + ROW_H)
           .lineTo(marginX + contentW, y + ROW_H)
           .strokeColor('#D1DCE8').lineWidth(0.3).stroke();

        doc.fontSize(7.5).fillColor('#1A2332').font('Helvetica');
        let cx = marginX;
        columns.forEach(col => {
          const w = (colWidths[col.key] ?? (1 / columns.length)) * contentW;
          let val = row[col.key] != null ? String(row[col.key]) : '—';

          if (CURRENCY_KEYS.has(col.key) && val !== '—') {
            val = `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          } else if (NUMERIC_KEYS.has(col.key) && val !== '—') {
            val = Number(val).toLocaleString('es-MX');
          } else if ((col.key === 'date' || col.key === 'hire_date' || col.key === 'start_date' || col.key === 'end_date' || col.key === 'created_at') && val !== '—') {
            try {
              const d = new Date(val);
              if (!isNaN(d.getTime())) val = d.toLocaleDateString('es-MX');
            } catch (_) {}
          }

          let align = 'left';
          if (CURRENCY_KEYS.has(col.key) || NUMERIC_KEYS.has(col.key)) align = 'right';
          else if (CENTER_KEYS.has(col.key)) align = 'center';

          doc.text(val, cx + 3, y + 5, { width: w - 6, align, lineBreak: false, ellipsis: true });
          cx += w;
        });

        y += ROW_H;
      });

      // ── Currency totals row at end of last page ──
      const hasCurrencyCol = columns.some(c => CURRENCY_KEYS.has(c.key));
      if (hasCurrencyCol && data.length > 0) {
        if (y > pageH - 70) {
          doc.addPage();
          drawPageHeader();
          y = 68;
        }
        doc.rect(marginX, y, contentW, 20).fill('#001F3F');
        doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
        let cx = marginX;
        columns.forEach(col => {
          const w = (colWidths[col.key] ?? (1 / columns.length)) * contentW;
          let val = '';
          if (col === columns[0]) {
            val = 'TOTAL';
          } else if (CURRENCY_KEYS.has(col.key)) {
            const sum = data.reduce((acc, r) => acc + (parseFloat(r[col.key]) || 0), 0);
            val = `$${sum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          }
          if (val) {
            doc.text(val, cx + 3, y + 6, { width: w - 6, align: CURRENCY_KEYS.has(col.key) ? 'right' : 'center', lineBreak: false });
          }
          cx += w;
        });
        y += 20;
      }

      // ── Flush all pages, then add footers ──
      doc.flushPages();
      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;
      for (let i = pageRange.start; i < pageRange.start + totalPages; i++) {
        doc.switchToPage(i);
        drawPageFooter(i - pageRange.start + 1, totalPages);
      }

      doc.end();

      // Collect the full buffer and send
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const filename = `NEXUS_${module}_${new Date().toISOString().slice(0, 10)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.end(pdfBuffer);
      });

    } else {
      res.status(400).json({ error: 'El formato debe ser "excel" o "pdf".' });
    }
  } catch (err) {
    console.error('[export] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
