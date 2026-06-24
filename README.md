# NEXUS ERP — Sistema de Gestión Empresarial Multi-Sector

<div align="center">

**Plataforma modular fullstack premium de planificación de recursos empresariales, optimizada con una interfaz moderna y adaptada a múltiples sectores comerciales.**

`React 18` · `Vite` · `Express` · `SQLite` · `JWT` · `Recharts` · `Nixpacks`

</div>

---

## 🚀 Inicio Rápido (Desarrollo Local)

### Requisitos Previos
- **Node.js**: Versión 18 o superior instalada.
- **NPM**: Gestor de paquetes incluido con Node.js.

### Automatización desde el Directorio Raíz
El proyecto cuenta con scripts unificados en la raíz para agilizar el desarrollo local sin tener que navegar manualmente por las carpetas:

```bash
# 1. Instalar dependencias de frontend y backend en un solo paso
npm run install:all

# 2. Iniciar el servidor backend en modo desarrollo (puerto 3001 con auto-recarga)
npm run dev:server

# 3. En otra terminal, iniciar el cliente React en modo desarrollo (puerto 5173 con HMR)
npm run dev:client
```

Alternativamente, puedes compilar los assets del frontend localmente con:
```bash
npm run build
```

---

## 🔑 Sistema de Accesos y Roles (RBAC)

NEXUS ERP implementa un control de acceso basado en roles (**Role-Based Access Control - RBAC**) que restringe dinámicamente las vistas del frontend y las llamadas a los endpoints de la API del backend.

### Niveles de Roles en el Sistema

1. **Super Admin**: Acceso irrestricto de administración global, permitiendo cambiar configuraciones en cualquier sector y módulo.
2. **Admin**: Acceso completo dentro de su sector asignado, con capacidad para ajustar módulos y campos personalizados.
3. **Manager**: Permisos completos de creación, edición y visualización de registros operativos dentro de su sector.
4. **Operador**: Permisos restringidos para registrar transacciones y movimientos diarios (ej. entradas/salidas de stock), sin acceso a la configuración ni eliminaciones.
5. **Viewer**: Acceso exclusivamente de lectura, ideal para análisis de KPIs, generación de reportes y exportación de documentos.

### Credenciales de Demostración (Sectores Preconfigurados)

La base de datos se semilla de manera automática en el primer arranque con los siguientes usuarios preconfigurados:

| Usuario | Contraseña | Rol | Sector Predeterminado |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | Super Admin | Transporte y Logística |
| `carlos.mendez` | `admin123` | Admin | Transporte y Logística |
| `ana.garcia` | `admin123` | Manager | Transporte y Logística |
| `roberto.tlapa` | `admin123` | Admin | Tlapalería / Materiales |
| `maria.cemento` | `admin123` | Admin | Planta Cementera |
| `operator1` | `admin123` | Operador | Transporte y Logística |
| `viewer1` | `admin123` | Viewer | Transporte y Logística |

---

## 🏭 Sectores Preconfigurados y Personalización

NEXUS ERP está diseñado para adaptarse instantáneamente a diversos modelos de negocio mediante su sistema de **Configuración Dinámica de Módulos y Campos Personalizados**:

1. **Transporte y Logística**: Control de combustible, mantenimiento de camiones, itinerarios y asignación de operadores.
2. **Tlapalería / Materiales**: Ventas rápidas en mostrador (Punto de Venta), seguimiento de stock crítico en ferretería y control de reorden.
3. **Planta Cementera**: Registro de turnos de producción, entrada de materias primas y control de mezclas.
4. **Alquiler de Maquinaria**: Gestión de mantenimiento preventivo y control del costo por horas de uso de equipos pesados.
5. **Metalurgia**: Gestión de lotes, aleaciones químicas y órdenes de producción.

---

## 🎨 Interfaz Premium y Últimos Cambios

El frontend cuenta con un sofisticado **sistema de diseño con tema oscuro de lujo y cristalografía (glassmorphism)** que ofrece una experiencia fluida con micro-animaciones integradas en CSS:

### 🌟 Última Actualización: Favicon Oficial SVG
* **Icono Personalizado**: Se ha creado un favicon dinámico en [nexus-icon.svg](file:///c:/Users/ulica/.gemini/antigravity-ide/scratch/nexus-erp/client/public/nexus-icon.svg) dentro de los assets estáticos del cliente.
* **Detalles Técnicos:**
  * Diseñado en formato SVG nativo para asegurar la máxima nitidez y escalabilidad en todas las resoluciones de pantalla y dispositivos.
  * Geometría moderna con el logotipo de la **N** en cintas entrelazadas con gradientes de transición (`#6366f1` Indigo $\rightarrow$ `#8b5cf6` Purple $\rightarrow$ `#a78bfa` Lavender).
  * Incluye una red de nodos interconectados (símbolo de la integración modular ERP) y un núcleo central ("Power Core") brillante con efecto de brillo luminoso (`feGaussianBlur`).
  * Estructurado con sombras proyectadas en 3D para lograr contraste en cualquier tema del navegador (pestañas oscuras o claras).
  * Integrado a nivel global en la cabecera HTML mediante la ruta estática `/nexus-icon.svg`.

---

## 🚀 Despliegue y Arquitectura en Producción

### Arquitectura de Producción
En un entorno de producción (`NODE_ENV=production`), NEXUS ERP funciona de forma consolidada e independiente:

1. **Servicio Estático**: El servidor Express (`server/app.js`) detecta la presencia del directorio compilado del cliente (`client/dist`). Al encontrarlo, sirve de manera estática todos los recursos de la SPA (HTML, JS, CSS, e imágenes).
2. **SPA Fallback**: El backend implementa una regla comodín (`app.get('*')`) para redirigir cualquier petición que no pertenezca a la API al index de React, gestionando el enrutamiento directamente en el cliente con React Router.
3. **Base de Datos SQLite Persistente**: Utiliza un motor SQLite local. En producción, la base de datos se ubica en `server/data/nexus.db`. Para garantizar que la base de datos no se corrompa y se persista tras cambios repentinos, el backend incluye un middleware que guarda automáticamente el estado de la base de datos a disco ante cualquier petición mutadora (`POST`, `PUT`, `DELETE` o `PATCH`).

### Configuración para Despliegues en la Nube (Railway / Nixpacks)

El repositorio incluye soporte nativo para despliegues automatizados basados en contenedores Nixpacks (como los utilizados en plataformas como Railway):

* **[nixpacks.toml](file:///c:/Users/ulica/.gemini/antigravity-ide/scratch/nexus-erp/nixpacks.toml)**:
  * **Configuración del Entorno**: Configura e inicializa Node.js 20.
  * **Fase de Instalación**: Ejecuta `npm install` de forma recursiva tanto para la API del servidor como para el cliente React.
  * **Fase de Construcción**: Compila el bundle de producción del cliente React mediante `npm run build` en el frontend, generando la carpeta `/client/dist`.
  * **Fase de Inicio**: Ejecuta el script de semilla de base de datos (`seeds/seed.js`) para garantizar que la base de datos exista y esté poblada, e inicia la aplicación Express en modo producción.
* **[railway.toml](file:///c:/Users/ulica/.gemini/antigravity-ide/scratch/nexus-erp/railway.toml)**:
  * Declara a Nixpacks como el motor de compilación predeterminado.
  * Define políticas de reinicio robustas (`ON_FAILURE` con hasta 10 reintentos) para el servicio web en producción.

---

## 📦 Estructura del Proyecto

```
nexus-erp/
├── client/                     # Módulo Frontend (React + Vite)
│   ├── public/                 # Recursos Estáticos Compilados
│   │   └── nexus-icon.svg      # [NUEVO] Favicon oficial premium SVG
│   ├── src/
│   │   ├── App.jsx             # Vista Principal SPA (Core + 6 Módulos)
│   │   ├── index.css           # Hoja de estilos del Design System v2.0
│   │   ├── i18n.js             # Diccionario y traducción (ES / EN)
│   │   └── services/
│   │       └── api.js          # Proveedor del Cliente HTTP REST
│   └── index.html              # Archivo de entrada HTML de la SPA
├── server/                     # Módulo Backend (NodeJS + Express)
│   ├── config/
│   │   └── database.js         # Driver y arranque de SQLite
│   ├── data/                   # Directorio de persistencia SQLite
│   ├── middleware/
│   │   ├── auth.js             # Middleware de validación JWT
│   │   └── rbac.js             # Restricción de permisos y roles
│   ├── routes/                 # Controladores y Endpoints de Módulo
│   ├── seeds/
│   │   └── seed.js             # Semilla inicial con base de datos demo
│   └── app.js                  # Inicializador y servidor HTTP Express
├── nixpacks.toml               # Configuración de compilación Nixpacks
├── railway.toml                # Instrucciones de despliegue Railway
└── package.json                # Scripts unificados de administración local
```

---

## 🔑 Endpoints Clave de la API

El servidor REST proporciona las siguientes rutas protegidas por token JWT de portador (`Authorization: Bearer <token>`):

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Inicia sesión y retorna el token JWT de acceso. |
| **POST** | `/api/auth/register` | Registra un nuevo usuario en la plataforma. |
| **GET** | `/api/dashboard/stats` | Retorna los KPIs consolidados y tendencias del sector. |
| **GET** | `/api/inventory/products` | Lista el catálogo de inventario con filtros de stock. |
| **POST** | `/api/inventory/movements` | Registra entradas o salidas del inventario de productos. |
| **POST** | `/api/payroll/calculate` | Ejecuta el cálculo automático de nómina (IMSS, ISR, etc.). |
| **PUT** | `/api/expenses/:id/approve` | Permite a Administradores/Managers autorizar gastos operativos. |
| **POST** | `/api/suppliers/:id/evaluate` | Registra el puntaje cualitativo y de cumplimiento de un proveedor. |
| **GET** | `/api/export/:module/:format` | Genera reportes dinámicos del módulo en formato `.xlsx` o `.pdf`. |
| **PUT** | `/api/settings/sector/:id` | Ajusta los módulos activos y campos custom del sector de negocio. |

---

## 📄 Licencia

MIT
