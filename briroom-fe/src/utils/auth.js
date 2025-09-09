import { USER_ROLES } from './constants';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

export const getUserRole = () => {
  const user = getUser();
  return user?.role;
};

export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};

// Get dashboard route based on user role
export const getDashboardRoute = (role) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return '/admin/dashboard';
    case USER_ROLES.LOGISTIK:
      return '/logistik/dashboard';
    case USER_ROLES.USER:
    default:
      return '/user/dashboard';
  }
};

// Export USER_ROLES for convenience
export { USER_ROLES };