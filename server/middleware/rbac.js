// Role-Based Access Control Middleware
const ROLE_HIERARCHY = {
  superadmin: 5,
  admin: 4,
  manager: 3,
  operator: 2,
  viewer: 1
};

const MODULE_PERMISSIONS = {
  superadmin: ['*'],
  admin: ['inventory', 'payroll', 'expenses', 'supplies', 'suppliers', 'travel', 'settings', 'dashboard'],
  manager: ['inventory', 'payroll', 'expenses', 'supplies', 'suppliers', 'travel', 'dashboard'],
  operator: ['inventory', 'expenses', 'supplies', 'suppliers', 'travel', 'dashboard'],
  viewer: ['dashboard']
};

const ACTION_PERMISSIONS = {
  superadmin: ['create', 'read', 'update', 'delete', 'approve', 'export', 'configure'],
  admin: ['create', 'read', 'update', 'delete', 'approve', 'export'],
  manager: ['create', 'read', 'update', 'approve', 'export'],
  operator: ['create', 'read', 'update'],
  viewer: ['read']
};

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

export function requireModule(moduleName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const allowed = MODULE_PERMISSIONS[req.user.role] || [];
    if (!allowed.includes('*') && !allowed.includes(moduleName)) {
      return res.status(403).json({ error: `No access to module: ${moduleName}` });
    }
    next();
  };
}

export function requireAction(action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const allowed = ACTION_PERMISSIONS[req.user.role] || [];
    if (!allowed.includes(action)) {
      return res.status(403).json({ error: `Permission denied for action: ${action}` });
    }
    next();
  };
}

export function canAccess(role, moduleName, action) {
  const modules = MODULE_PERMISSIONS[role] || [];
  const actions = ACTION_PERMISSIONS[role] || [];
  const hasModule = modules.includes('*') || modules.includes(moduleName);
  const hasAction = actions.includes(action);
  return hasModule && hasAction;
}

export default { requireRole, requireModule, requireAction, canAccess };
