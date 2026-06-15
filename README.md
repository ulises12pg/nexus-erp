# NEXUS ERP — Sistema de Gestión Empresarial Multi-Sector

<div align="center">

**Sistema ERP fullstack modular, escalable y adaptable para múltiples giros empresariales**

`React` · `Express` · `SQLite` · `JWT` · `Recharts`

</div>

---

## 🚀 Quick Start

### Requisitos previos
- Node.js 18+

### Instalación

```bash
# 1. Clonar/navegar al proyecto
cd nexus-erp

# 2. Instalar dependencias del backend
cd server
npm install

# 3. Cargar datos de ejemplo
npm run seed

# 4. Iniciar el backend (puerto 3001)
npm start

# 5. En otra terminal, instalar dependencias del frontend
cd ../client
npm install

# 6. Iniciar el frontend (puerto 5173)
npm run dev
```

Abrir **http://localhost:5173** en el navegador.

### Credenciales de Demo

| Usuario | Contraseña | Rol | Sector |
|---------|-----------|-----|--------|
| `admin` | `admin123` | Super Admin | Transporte |
| `carlos.mendez` | `admin123` | Admin | Transporte |
| `ana.garcia` | `admin123` | Manager | Transporte |
| `roberto.tlapa` | `admin123` | Admin | Tlapalería |
| `maria.cemento` | `admin123` | Admin | Cementera |
| `operator1` | `admin123` | Operador | Transporte |
| `viewer1` | `admin123` | Viewer | Transporte |

---

## 📦 Módulos

| Módulo | Funcionalidades |
|--------|----------------|
| **📊 Dashboard** | KPIs en tiempo real, gráficos de tendencias, top productos, actividad reciente |
| **📦 Inventarios** | CRUD productos, movimientos entrada/salida, categorías, alertas de stock bajo |
| **💰 Nóminas** | Empleados, períodos de nómina, cálculo automático (IMSS, ISR), cierre |
| **📊 Gastos** | Registro de gastos, aprobación/rechazo, categorías, resumen por período |
| **🔧 Insumos** | Catálogo de insumos, punto de reorden, órdenes de compra, recepción |
| **🏢 Proveedores** | Directorio, evaluación con scoring, historial de compras |
| **✈️ Viajes** | Solicitudes, aprobación, control de gastos de viaje, itinerarios |
| **⚙️ Configuración** | Sectores, módulos activos, campos personalizados, usuarios, auditoría |

---

## 🏭 Sectores Preconfigurados

1. **Transporte y Logística** — Rutas, combustible, operadores
2. **Tlapalería / Materiales** — Punto de venta, ferretería
3. **Planta Cementera** — Producción, turnos, materias primas
4. **Alquiler de Maquinaria** — Horas máquina, mantenimiento
5. **Metalurgia** — Aleaciones, lotes de producción

---

## 🌐 Características

- **🌍 Bilingüe** — Interfaz completa en Español e Inglés
- **💱 MXN** — Formato de moneda mexicana y fechas DD/MM/AAAA
- **📤 Exportar** — Reportes en Excel (.xlsx) y PDF para todos los módulos
- **🔐 Auth JWT** — Autenticación segura con 5 niveles de roles
- **🎨 UI Premium** — Tema oscuro glassmorphism, micro-animaciones
- **📱 Responsive** — Funciona en desktop, tablet y móvil
- **🔧 Configurable** — Activar/desactivar módulos por sector sin código
- **📋 Campos custom** — Campos personalizados por sector y módulo

---

## 🏗️ Arquitectura

```
nexus-erp/
├── client/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx       # Aplicación principal + 6 módulos
│   │   ├── index.css     # Design system completo
│   │   ├── i18n.js       # Sistema de internacionalización
│   │   └── services/
│   │       └── api.js    # Capa de servicios API
│   └── ...
├── server/               # Backend (Express + SQLite)
│   ├── config/
│   │   └── database.js   # Configuración SQLite
│   ├── middleware/
│   │   ├── auth.js       # JWT middleware
│   │   └── rbac.js       # Control de acceso por roles
│   ├── routes/
│   │   ├── auth.js       # Autenticación
│   │   ├── inventory.js  # Inventarios
│   │   ├── payroll.js    # Nóminas
│   │   ├── expenses.js   # Gastos
│   │   ├── supplies.js   # Insumos
│   │   ├── suppliers.js  # Proveedores
│   │   ├── travel.js     # Viajes
│   │   ├── settings.js   # Configuración
│   │   ├── dashboard.js  # Dashboard stats
│   │   └── export.js     # Exportación PDF/Excel
│   └── seeds/
│       └── seed.js       # Datos de ejemplo (3 sectores)
└── README.md
```

---

## 🔑 API REST Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Registro |
| GET | `/api/dashboard/stats` | KPIs del dashboard |
| GET/POST | `/api/inventory/products` | Productos |
| POST | `/api/inventory/movements` | Movimientos de inventario |
| GET/POST | `/api/payroll/employees` | Empleados |
| POST | `/api/payroll/calculate` | Calcular nómina |
| GET/POST | `/api/expenses` | Gastos operativos |
| PUT | `/api/expenses/:id/approve` | Aprobar/rechazar gasto |
| GET/POST | `/api/supplies` | Insumos |
| GET/POST | `/api/suppliers` | Proveedores |
| POST | `/api/suppliers/:id/evaluate` | Evaluar proveedor |
| GET/POST | `/api/travel/requests` | Solicitudes de viaje |
| GET | `/api/export/:module/:format` | Exportar (excel/pdf) |
| GET/PUT | `/api/settings/sector/:id` | Configuración sectorial |

---

## 📄 Licencia

MIT
