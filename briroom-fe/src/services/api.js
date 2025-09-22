import axios from 'axios';

// Base configuration
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const API_BASE_URL = '/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Adding token to request:', config.url);
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.baseURL + config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config?.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });

    // Hanya redirect ke /login jika 401 dan endpoint-nya BUKAN /auth/login
    if (
      error.response?.status === 401 &&
      !(error.config?.url?.endsWith('/auth/login'))
    ) {
      console.warn('🚪 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile')
};

// Request API
export const requestAPI = {
  create: (requestData) => api.post('/requests', requestData),
  getAll: () => api.get('/requests'),
  getUserRequests: () => api.get('/requests/me'),
  getById: (id) => api.get(`/requests/${id}`),
  getUserRequestById: (id) => api.get(`/requests/me/${id}`),
  updateUserRequest: (id, data) => api.put(`/requests/me/${id}`, data),
  cancelUserRequest: (id) => api.patch(`/requests/me/${id}/cancel`),
  updateStatus: (id, statusData) => api.put(`/requests/${id}/status`, statusData)
};

// Admin IT APIAPI_BASE_URL
export const adminItAPI = {
  getDashboard: () => api.get('/workflow/admin-it/dashboard'),
  getZoomRequests: () => api.get('/workflow/admin-it/zoom-requests'),
  getZoomLinks: () => api.get('/resources/zoom/available'),
  approveZoom: (id, zoomData) => api.put(`/workflow/admin-it/approve-zoom/${id}`, zoomData),
  rejectZoom: (id, reason) => api.put(`/workflow/admin-it/reject-zoom/${id}`, { reason })
};

// Logistik API
export const logistikAPI = {
  getDashboard: () => api.get('/workflow/logistik/dashboard'),
  getRoomRequests: () => api.get('/workflow/logistik/room-requests'),
  getRoomRequestsHistory: () => api.get('/requests/room-requests?history=true'),
  approveRoom: (id, roomData) => api.patch(`/workflow/logistik/room/${id}/approve`, roomData),
  rejectRoom: (id, reason) => api.patch(`/workflow/logistik/room/${id}/reject`, reason),
  // New consistency functions (similar to adminAPI)
  approveRoomRequest: (id, data) => api.patch(`/workflow/logistik/room/${id}/approve`, data),
  rejectRoomRequest: (id, data) => api.patch(`/workflow/logistik/room/${id}/reject`, data),
  getRooms: () => api.get('/admin/rooms'),
  createRoom: (data) => api.post('/admin/rooms', data),
  updateRoom: (id, data) => api.put(`/admin/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/admin/rooms/${id}`)
};

// Resource API
export const resourceAPI = {
  getAvailableRooms: (params) => api.get('/resources/rooms/available', { params }),
  getAvailableZoom: (params) => api.get('/resources/zoom/available', { params })
};

// Admin API
export const adminAPI = {
  getAllBookings: () => api.get('/admin/bookings'),
  getAllRequests: () => api.get('/requests/all'),
  getZoomLinks: () => api.get('/admin/zoom-links'),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
  approveRequest: (id, data) => api.patch(`/requests/admin/${id}/approve`, data),
  rejectRequest: (id, data) => api.patch(`/requests/admin/${id}/reject`, data),
  createZoomLink: (data) => api.post('/admin/zoom-links', data),
  updateZoomLink: (id, data) => api.put(`/admin/zoom-links/${id}`, data),
  deleteZoomLink: (id) => api.delete(`/admin/zoom-links/${id}`)
};

// Export API
export const exportAPI = {
  requestsPdf: (params) => api.get('/requests/export/pdf', { params, responseType: 'blob' })
};

// BPMN API
export const bpmnAPI = {
  getWorkflows: () => api.get('/bpmn/workflows'),
  createWorkflow: (data) => api.post('/bpmn/workflows', data),
  updateWorkflow: (id, data) => api.put(`/bpmn/workflows/${id}`, data),
  deleteWorkflow: (id) => api.delete(`/bpmn/workflows/${id}`),
  
  // Logistik BPMN functions
  getLogistikDashboard: () => api.get('/workflow/logistik/dashboard'),
  getValidatedRequestsForLogistik: () => api.get('/workflow/logistik/validated-requests'),
  logistikApproveRoom: (id, data) => api.patch(`/workflow/logistik/room/${id}/approve`, data),
  logistikRejectRoom: (id, data) => api.patch(`/workflow/logistik/room/${id}/reject`, data),
  getAvailableRooms: (params) => api.get('/resources/rooms/available', { params }),
  
  // Admin IT BPMN functions  
  getAdminItDashboard: () => api.get('/workflow/admin-it/dashboard'),
  adminItApproveZoom: (id, data) => api.patch(`/workflow/admin-it/zoom/${id}/approve`, data),
  adminItRejectZoom: (id, data) => api.patch(`/workflow/admin-it/zoom/${id}/reject`, data),
  getAvailableZoom: (params) => api.get('/resources/zoom/available', { params })
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getMyBookings: () => api.get('/requests/me'),
  createBooking: (data) => api.post('/requests', data),
  updateBooking: (id, data) => api.put(`/requests/me/${id}`, data),
  cancelBooking: (id) => api.patch(`/requests/me/${id}/cancel`)
};

export default api;