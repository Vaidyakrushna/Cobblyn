const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  // Add auth token from localStorage if available
  let token = localStorage.getItem('cobblyn_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(url, config);

  // If unauthorized (401) and we haven't already retried this request, try refreshing the token
  if (response.status === 401 && !options._retry && path !== '/api/auth/login' && path !== '/api/auth/refresh') {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.token;
          if (newToken) {
            localStorage.setItem('cobblyn_token', newToken);
          }
          isRefreshing = false;
          onRefreshed(newToken);
        } else {
          isRefreshing = false;
          localStorage.removeItem('cobblyn_token');
          onRefreshed(null);
        }
      } catch (err) {
        isRefreshing = false;
        localStorage.removeItem('cobblyn_token');
        onRefreshed(null);
      }
    }

    // Queue this request to retry once refreshing finishes
    const retryOriginalRequest = new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken) => {
        if (newToken) {
          // Update local authorization header and retry
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiFetch(path, { ...options, _retry: true }));
        } else {
          reject(new Error("Session expired. Please log in again."));
        }
      });
    });

    return retryOriginalRequest;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(formatApiErrorDetail(data.detail));
  }

  return response.json();
}

export const api = {
  // Generic request method for ad-hoc API calls
  request: (path, options = {}) => apiFetch(`/api${path}`, options),

  // Auth
  register: (data) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  getMe: () => apiFetch('/api/auth/me'),
  refreshToken: () => apiFetch('/api/auth/refresh', { method: 'POST' }),
  resendVerification: (data) => apiFetch('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => apiFetch(`/api/products/${id}`),
  createProduct: (data) => apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => apiFetch(`/api/products/${id}`, { method: 'DELETE' }),

  // Schedule a Visit
  scheduleVisit: (data) => apiFetch('/api/visits/schedule', { method: 'POST', body: JSON.stringify(data) }),
  myVisits: () => apiFetch('/api/visits/my'),
  cancelMyVisit: (visitId) => apiFetch(`/api/visits/my/${visitId}/cancel`, { method: 'PATCH' }),
  rescheduleMyVisit: (visitId, data) => apiFetch(`/api/visits/my/${visitId}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) }),
  listVisits: (params = '') => apiFetch(`/api/visits${params}`),
  updateVisitStatus: (id, status) => apiFetch(`/api/visits/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteVisit: (id) => apiFetch(`/api/visits/${id}`, { method: 'DELETE' }),

  // Banners
  listBanners: (params = '') => {
    let qs = '';
    if (typeof params === 'boolean') {
      qs = params ? '?active_only=true' : '';
    } else if (typeof params === 'string') {
      qs = params;
    }
    return apiFetch(`/api/banners${qs}`);
  },
  createBanner: (data) => apiFetch('/api/banners', { method: 'POST', body: JSON.stringify(data) }),
  updateBanner: (id, data) => apiFetch(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanner: (id) => apiFetch(`/api/banners/${id}`, { method: 'DELETE' }),

  // Image upload (admin)
  uploadImage: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('cobblyn_token');
    const res = await fetch(`${API_BASE}/api/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed (${res.status})`);
    }
    return res.json();
  },

  // Reviews
  listReviews: (productId) => apiFetch(`/api/reviews/product/${productId}`),
  createReview: (productId, data) => apiFetch(`/api/reviews/product/${productId}`, { method: 'POST', body: JSON.stringify({ product_id: productId, ...data }) }),
  deleteReview: (id) => apiFetch(`/api/reviews/${id}`, { method: 'DELETE' }),

  // Coupons
  listCoupons: () => apiFetch('/api/coupons'),
  createCoupon: (data) => apiFetch('/api/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id, data) => apiFetch(`/api/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id) => apiFetch(`/api/coupons/${id}`, { method: 'DELETE' }),
  validateCoupon: (code, subtotal) => apiFetch('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),

  // Returns
  listReturns: (params = '') => apiFetch(`/api/returns${params}`),
  createReturn: (data) => apiFetch('/api/returns', { method: 'POST', body: JSON.stringify(data) }),
  updateReturnStatus: (id, body) => apiFetch(`/api/returns/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Analytics
  analyticsSizes: (params = '') => apiFetch(`/api/admin/analytics/sizes${params}`),
  analyticsReturnRate: () => apiFetch('/api/admin/analytics/return-rate'),
  analyticsSizeMismatch: () => apiFetch('/api/admin/analytics/size-mismatch'),
  analyticsPopularColors: () => apiFetch('/api/admin/analytics/popular-customizations'),

  // Admin Users (RBAC)
  listAdminUsers: () => apiFetch('/api/admin/users'),
  updateUserRole: (id, role) => apiFetch(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  blockUser: (id, blocked) => apiFetch(`/api/admin/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked }) }),

  // Wishlist Move to Cart
  wishlistMoveToCart: (productId, body) => apiFetch(`/api/wishlist/${productId}/move-to-cart`, { method: 'POST', body: JSON.stringify(body) }),

  // Bulk uploads
  bulkUploadProducts: async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const token = localStorage.getItem('cobblyn_token');
    const res = await fetch(`${API_BASE}/api/admin/bulk/products`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Upload failed`); }
    return res.json();
  },
  bulkUploadInventory: async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const token = localStorage.getItem('cobblyn_token');
    const res = await fetch(`${API_BASE}/api/admin/bulk/inventory`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Upload failed`); }
    return res.json();
  },
  uploadImage: async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const token = localStorage.getItem('cobblyn_token');
    const res = await fetch(`${API_BASE}/api/uploads/image`, { 
      method: 'POST', 
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}, 
      body: fd 
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(formatApiErrorDetail(e.detail) || `Upload failed`); }
    return res.json();
  },

  // Cart
  getCart: () => apiFetch('/api/cart'),
  addToCart: (data) => apiFetch('/api/cart/add', { method: 'POST', body: JSON.stringify(data) }),
  updateCart: (data) => apiFetch('/api/cart/update', { method: 'PUT', body: JSON.stringify(data) }),
  removeFromCart: (data) => apiFetch(`/api/cart/remove`, { method: 'POST', body: JSON.stringify(data) }),
  clearCart: () => apiFetch('/api/cart/clear', { method: 'DELETE' }),

  // Wishlist
  getWishlist: () => apiFetch('/api/wishlist'),
  addToWishlist: (productId) => apiFetch('/api/wishlist/add', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
  removeFromWishlist: (productId) => apiFetch(`/api/wishlist/remove?product_id=${productId}`, { method: 'DELETE' }),
  checkWishlist: (productId) => apiFetch(`/api/wishlist/check/${productId}`),
  wishlistMoveToCart: (productId, data) => apiFetch(`/api/wishlist/${productId}/move-to-cart`, { method: 'POST', body: JSON.stringify(data) }),

  // Admin Dashboard
  adminDashboard: (params = '') => apiFetch(`/api/admin/dashboard${params}`),

  // Materials
  getMaterials: (params = '') => apiFetch(`/api/materials${params}`),
  createMaterial: (data) => apiFetch('/api/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => apiFetch(`/api/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => apiFetch(`/api/materials/${id}`, { method: 'DELETE' }),

  // Pricing Rules
  getRules: () => apiFetch('/api/rules'),
  createRule: (data) => apiFetch('/api/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id, data) => apiFetch(`/api/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id) => apiFetch(`/api/rules/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data) => apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params = '') => apiFetch(`/api/orders${params}`),
  getOrder: (id) => apiFetch(`/api/orders/${id}`),
  updateOrderStatus: (id, data) => apiFetch(`/api/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  directModifyOrder: (id, data) => apiFetch(`/api/orders/${id}/direct-modify`, { method: 'PUT', body: JSON.stringify(data) }),
  proposeOrderModification: (id, data) => apiFetch(`/api/orders/${id}/propose-modification`, { method: 'POST', body: JSON.stringify(data) }),
  approveOrderModification: (id) => apiFetch(`/api/orders/${id}/approve-modification`, { method: 'POST' }),
  rejectOrderModification: (id) => apiFetch(`/api/orders/${id}/reject-modification`, { method: 'POST' }),
  calculateOrderPrice: (id, data) => apiFetch(`/api/orders/${id}/calculate-price`, { method: 'POST', body: JSON.stringify(data) }),
  recordOrderPayment: (id, data) => apiFetch(`/api/orders/${id}/record-payment`, { method: 'POST', body: JSON.stringify(data) }),
  payOutstandingBalance: (id, paymentMethod) => apiFetch(`/api/orders/${id}/pay-outstanding`, { method: 'POST', body: JSON.stringify({ payment_method: paymentMethod }) }),
  updateOrderOperational: (id, data) => apiFetch(`/api/orders/${id}/operational`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers (Admin)
  getCustomers: (params = '') => apiFetch(`/api/customers${params}`),
  getCustomer: (id) => apiFetch(`/api/customers/${id}`),
  getFitProfile: (id) => apiFetch(`/api/customers/${id}/fit-profile`),
  updateFitProfile: (id, data) => apiFetch(`/api/customers/${id}/fit-profile`, { method: 'PUT', body: JSON.stringify(data) }),

  // Support Tickets
  createTicket: (data) => apiFetch('/api/customers/me/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getMyTickets: () => apiFetch('/api/customers/me/tickets'),
  adminGetTickets: (params = '') => apiFetch(`/api/customers/admin/tickets${params}`),
  adminReplyTicket: (id, data) => apiFetch(`/api/customers/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateTicketStatus: (id, status) => apiFetch(`/api/customers/admin/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  customerReplyTicket: (id, data) => apiFetch(`/api/customers/me/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  createDraftModification: (ticketId, data) => apiFetch(`/api/customers/admin/tickets/${ticketId}/draft-modification`, { method: 'POST', body: JSON.stringify(data) }),
  confirmDraftModification: (ticketId) => apiFetch(`/api/customers/me/tickets/${ticketId}/confirm-draft`, { method: 'POST' }),
  rejectDraftModification: (ticketId) => apiFetch(`/api/customers/me/tickets/${ticketId}/reject-draft`, { method: 'POST' }),

  // Account (Customer Dashboard)
  getProfile: () => apiFetch('/api/account/profile'),
  updateProfile: (data) => apiFetch('/api/account/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => apiFetch('/api/account/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getAddresses: () => apiFetch('/api/account/addresses'),
  addAddress: (data) => apiFetch('/api/account/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (id, data) => apiFetch(`/api/account/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAddress: (id) => apiFetch(`/api/account/addresses/${id}`, { method: 'DELETE' }),
  getPaymentMethods: () => apiFetch('/api/account/payment-methods'),
  addPaymentMethod: (data) => apiFetch('/api/account/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
  deletePaymentMethod: (id) => apiFetch(`/api/account/payment-methods/${id}`, { method: 'DELETE' }),
  getMyOrders: (params = '') => apiFetch(`/api/account/orders${params}`),
  getMyOrder: (id) => apiFetch(`/api/account/orders/${id}`),
  getOrderInvoice: (id) => apiFetch(`/api/account/orders/${id}/invoice`),
  submitOrderFeedback: (orderId, data) => apiFetch(`/api/orders/${orderId}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  getReferralStats: () => apiFetch('/api/referrals/stats'),


  // Inventory (Admin)
  getInventoryStats: () => apiFetch('/api/admin/inventory/stats'),
  getInventory: (params = '') => apiFetch(`/api/admin/inventory${params}`),
  getInventoryItem: (id) => apiFetch(`/api/admin/inventory/${id}`),
  updateStock: (id, data) => apiFetch(`/api/admin/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  restockSize: (id, data) => apiFetch(`/api/admin/inventory/${id}/restock`, { method: 'POST', body: JSON.stringify(data) }),
  seedInventory: () => apiFetch('/api/admin/inventory/seed', { method: 'POST' }),

  // Production & Factory (Admin + Worker)
  getProductionStats: () => apiFetch('/api/admin/production/stats'),
  getProductionJobs: (params = '') => apiFetch(`/api/admin/production/jobs${params}`),
  getProductionJob: (id) => apiFetch(`/api/admin/production/jobs/${id}`),
  createProductionJob: (data) => apiFetch('/api/admin/production/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateProductionStage: (id, data) => apiFetch(`/api/admin/production/jobs/${id}/stage`, { method: 'PUT', body: JSON.stringify(data) }),
  assignWorker: (id, data) => apiFetch(`/api/admin/production/jobs/${id}/assign`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTechPack: (id, data) => apiFetch(`/api/admin/production/jobs/${id}/tech-pack`, { method: 'PUT', body: JSON.stringify(data) }),
  getWorkers: () => apiFetch('/api/admin/production/workers'),
  addWorker: (data) => apiFetch('/api/admin/production/workers', { method: 'POST', body: JSON.stringify(data) }),
  removeWorker: (id) => apiFetch(`/api/admin/production/workers/${id}`, { method: 'DELETE' }),
  getVendors: () => apiFetch('/api/admin/vendors'),
  getVendorFulfilled: (vendorId) => apiFetch(`/api/admin/vendors/${vendorId}/fulfilled`),
  submitVendorFeedback: (vendorId, jobId, data) => apiFetch(`/api/admin/vendors/${vendorId}/fulfilled/${jobId}/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  updateJobOperational: (id, data) => apiFetch(`/api/admin/production/jobs/${id}/operational`, { method: 'PUT', body: JSON.stringify(data) }),

  // Scheduled Visits
  scheduleVisit: (data) => apiFetch('/api/visits/schedule', { method: 'POST', body: JSON.stringify(data) }),
  myVisits: () => apiFetch('/api/visits/my'),
  cancelMyVisit: (id) => apiFetch(`/api/visits/my/${id}/cancel`, { method: 'PATCH' }),
  rescheduleMyVisit: (id, data) => apiFetch(`/api/visits/my/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) }),
  listVisits: (params = '') => apiFetch(`/api/visits${params}`),
  updateVisitStatus: (id, status) => apiFetch(`/api/visits/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteVisit: (id) => apiFetch(`/api/visits/${id}`, { method: 'DELETE' }),

  // Accessories (Admin + Storefront)
  getAccessories: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/accessories${qs ? '?' + qs : ''}`);
  },
  getAccessory: (id) => apiFetch(`/api/accessories/${id}`),
  createAccessory: (data) => apiFetch('/api/accessories', { method: 'POST', body: JSON.stringify(data) }),
  updateAccessory: (id, data) => apiFetch(`/api/accessories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccessory: (id) => apiFetch(`/api/accessories/${id}`, { method: 'DELETE' }),
  bulkUploadAccessories: async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const token = localStorage.getItem('cobblyn_token');
    const res = await fetch(`${API_BASE}/api/accessories/bulk/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Upload failed'); }
    return res.json();
  },
  getAuditLogs: (params = '') => apiFetch(`/api/admin/audit-logs${params}`),

  // Vendor Portal
  getVendorPortal: (token) => apiFetch(`/api/vendor/portal/${token}`),
  confirmVendorJob: (token, jobId) => apiFetch(`/api/vendor/portal/${token}/jobs/${jobId}/confirm`, { method: 'POST' }),
  rejectVendorJob: (token, jobId) => apiFetch(`/api/vendor/portal/${token}/jobs/${jobId}/reject`, { method: 'POST' }),
  updateVendorJobStage: (token, jobId, data) => apiFetch(`/api/vendor/portal/${token}/jobs/${jobId}/stage`, { method: 'PUT', body: JSON.stringify(data) }),

  // Serviceable Pincodes & Dynamic Capacities
  getPincodesSettings: () => apiFetch('/api/visits/settings/pincodes'),
  addPincodeSettings: (data) => apiFetch('/api/visits/settings/pincodes', { method: 'POST', body: JSON.stringify(data) }),
  updatePincodeSettings: (pinCode, data) => apiFetch(`/api/visits/settings/pincodes/${pinCode}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePincodeSettings: (pinCode) => apiFetch(`/api/visits/settings/pincodes/${pinCode}`, { method: 'DELETE' }),
};

export default api;
