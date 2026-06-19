const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('nexus_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('nexus_token', token);
    else localStorage.removeItem('nexus_token');
  }

  getToken() {
    return this.token || localStorage.getItem('nexus_token');
  }

  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Request failed');
    }

    // Handle file downloads — return both blob and headers
    const contentType = response.headers.get('content-type');
    if (path.includes('/export/') || (contentType && (contentType.includes('spreadsheet') || contentType.includes('pdf')))) {
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      return { blob, disposition };
    }

    const data = await response.json();
    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }

  // Auth
  login(username, password) { return this.post('/auth/login', { username, password }); }
  register(data) { return this.post('/auth/register', data); }
  getProfile() { return this.get('/auth/me'); }
  updateProfile(data) { return this.put('/auth/profile', data); }
  getUsers() { return this.get('/auth/users'); }

  // Dashboard
  getDashboardStats() { return this.get('/dashboard/stats'); }

  // Inventory
  getProducts(params = '') { return this.get(`/inventory/products${params ? '?' + params : ''}`); }
  createProduct(data) { return this.post('/inventory/products', data); }
  updateProduct(id, data) { return this.put(`/inventory/products/${id}`, data); }
  deleteProduct(id) { return this.delete(`/inventory/products/${id}`); }
  getMovements(params = '') { return this.get(`/inventory/movements${params ? '?' + params : ''}`); }
  createMovement(data) { return this.post('/inventory/movements', data); }
  getCategories() { return this.get('/inventory/categories'); }
  createCategory(data) { return this.post('/inventory/categories', data); }

  // Payroll
  getEmployees(params = '') { return this.get(`/payroll/employees${params ? '?' + params : ''}`); }
  createEmployee(data) { return this.post('/payroll/employees', data); }
  updateEmployee(id, data) { return this.put(`/payroll/employees/${id}`, data); }
  deleteEmployee(id) { return this.delete(`/payroll/employees/${id}`); }
  getPayrollPeriods(params = '') { return this.get(`/payroll/periods${params ? '?' + params : ''}`); }
  createPayrollPeriod(data) { return this.post('/payroll/periods', data); }
  deletePayrollPeriod(id) { return this.delete(`/payroll/periods/${id}`); }
  calculatePayroll(period_id) { return this.post('/payroll/calculate', { period_id }); }
  closePayroll(id) { return this.put(`/payroll/periods/${id}/close`); }
  getPayrollDetails(id) { return this.get(`/payroll/periods/${id}/details`); }

  // Expenses
  getExpenses(params = '') { return this.get(`/expenses${params ? '?' + params : ''}`); }
  createExpense(data) { return this.post('/expenses', data); }
  updateExpense(id, data) { return this.put(`/expenses/${id}`, data); }
  approveExpense(id, approved, reason) { return this.put(`/expenses/${id}/approve`, { approved, reason }); }
  deleteExpense(id) { return this.delete(`/expenses/${id}`); }
  getExpenseCategories() { return this.get('/expenses/categories'); }
  createExpenseCategory(data) { return this.post('/expenses/categories', data); }
  getExpenseSummary() { return this.get('/expenses/summary'); }

  // Supplies
  getSupplies(params = '') { return this.get(`/supplies${params ? '?' + params : ''}`); }
  createSupply(data) { return this.post('/supplies', data); }
  updateSupply(id, data) { return this.put(`/supplies/${id}`, data); }
  deleteSupply(id) { return this.delete(`/supplies/${id}`); }
  getSupplyOrders(params = '') { return this.get(`/supplies/orders${params ? '?' + params : ''}`); }
  createSupplyOrder(data) { return this.post('/supplies/orders', data); }
  receiveSupplyOrder(id) { return this.put(`/supplies/orders/${id}/receive`); }

  // Suppliers
  getSuppliers(params = '') { return this.get(`/suppliers${params ? '?' + params : ''}`); }
  getSupplier(id) { return this.get(`/suppliers/${id}`); }
  createSupplier(data) { return this.post('/suppliers', data); }
  updateSupplier(id, data) { return this.put(`/suppliers/${id}`, data); }
  deleteSupplier(id) { return this.delete(`/suppliers/${id}`); }
  evaluateSupplier(id, data) { return this.post(`/suppliers/${id}/evaluate`, data); }

  // Travel
  getTravelRequests(params = '') { return this.get(`/travel/requests${params ? '?' + params : ''}`); }
  createTravelRequest(data) { return this.post('/travel/requests', data); }
  updateTravelRequest(id, data) { return this.put(`/travel/requests/${id}`, data); }
  approveTravelRequest(id, approved, reason) { return this.put(`/travel/requests/${id}/approve`, { approved, reason }); }
  getTravelExpenses(id) { return this.get(`/travel/requests/${id}/expenses`); }
  createTravelExpense(data) { return this.post('/travel/expenses', data); }

  // Settings
  getSectors() { return this.get('/settings/sectors'); }
  getSector(id) { return this.get(`/settings/sector/${id}`); }
  updateSector(id, data) { return this.put(`/settings/sector/${id}`, data); }
  getCustomFields(module) { return this.get(`/settings/custom-fields${module ? '?module=' + module : ''}`); }
  createCustomField(data) { return this.post('/settings/custom-fields', data); }
  getAuditLog(params = '') { return this.get(`/settings/audit-log${params ? '?' + params : ''}`); }

  // Export — direct browser download (bypasses Vite proxy to preserve Content-Disposition / MIME type)
  exportData(module, format) {
    const token = this.getToken();
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    // Build a direct URL to the backend (port 3001), passing JWT as query param.
    // This lets the browser handle the file download natively — no fetch/blob needed,
    // which means the OS sees the correct Content-Type + filename with extension.
    const backendUrl = `http://localhost:3001/api/export/${module}/${format}?token=${encodeURIComponent(token)}`;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = backendUrl;
    a.download = `NEXUS_${module}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 500);
    // Return resolved promise so callers can await and show success toast
    return Promise.resolve();
  }

  // Direct Sales
  getSales(params = '') { return this.get(`/sales${params ? '?' + params : ''}`); }
  getSale(id) { return this.get(`/sales/${id}`); }
  createSale(data) { return this.post('/sales', data); }
}

const api = new ApiService();
export default api;
