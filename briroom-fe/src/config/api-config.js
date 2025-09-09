// API Configuration for BRIRoom Frontend
export const API_CONFIG = {
  // Environment-based URL
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.briroom.com/api'  // Ganti dengan production URL
    : 'http://localhost:5001/api',   // Development URL
    
  // All available endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify',
    
    // Public endpoints
    HEALTH: '/health',
    SCHEDULE: '/requests/schedule',
    
    // User endpoints
    MY_REQUESTS: '/requests/me',
    CREATE_REQUEST: '/requests',
    UPDATE_REQUEST: '/requests/me/{id}',
    CANCEL_REQUEST: '/requests/me/{id}/cancel',
    
    // Admin endpoints  
    ALL_REQUESTS: '/requests/all',
    ROOM_REQUESTS: '/requests/room-requests',
    ZOOM_REQUESTS: '/requests/zoom-requests',
    
    // Approval endpoints
    APPROVE_ROOM: '/requests/room/{id}/approve',
    REJECT_ROOM: '/requests/room/{id}/reject',
    APPROVE_ZOOM: '/requests/zoom/{id}/approve',
    REJECT_ZOOM: '/requests/zoom/{id}/reject'
  },
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Request timeout (ms)
  TIMEOUT: 10000
};

// Helper function untuk authenticated requests
export const apiRequest = async (endpoint, options = {}) => {
  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  
  // Prepare request config
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.HEADERS,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };
  
  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  config.signal = controller.signal;
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error - server may be down');
    }
    
    throw error;
  }
};

// Specific API functions for common operations
export const authAPI = {
  login: (credentials) => 
    apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return Promise.resolve({ success: true });
  }
};

export const requestsAPI = {
  getSchedule: () => 
    apiRequest(API_CONFIG.ENDPOINTS.SCHEDULE),
    
  getMyRequests: () => 
    apiRequest(API_CONFIG.ENDPOINTS.MY_REQUESTS),
    
  createRequest: (requestData) => 
    apiRequest(API_CONFIG.ENDPOINTS.CREATE_REQUEST, {
      method: 'POST',
      body: JSON.stringify(requestData)
    }),
    
  cancelRequest: (requestId) => 
    apiRequest(API_CONFIG.ENDPOINTS.CANCEL_REQUEST.replace('{id}', requestId), {
      method: 'PATCH'
    })
};

export const adminAPI = {
  getAllRequests: () => 
    apiRequest(API_CONFIG.ENDPOINTS.ALL_REQUESTS),
    
  approveRoom: (requestId, notes = '') => 
    apiRequest(API_CONFIG.ENDPOINTS.APPROVE_ROOM.replace('{id}', requestId), {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    }),
    
  approveZoom: (requestId, notes = '') => 
    apiRequest(API_CONFIG.ENDPOINTS.APPROVE_ZOOM.replace('{id}', requestId), {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    })
};

// Error handler helper
export const handleAPIError = (error, defaultMessage = 'Something went wrong') => {
  console.error('API Error:', error);
  
  // Return user-friendly message
  if (error.message.includes('Network error')) {
    return 'Cannot connect to server. Please check your internet connection.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (error.message.includes('401')) {
    return 'Please login again.';
  }
  
  if (error.message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }
  
  return error.message || defaultMessage;
};

export default API_CONFIG;