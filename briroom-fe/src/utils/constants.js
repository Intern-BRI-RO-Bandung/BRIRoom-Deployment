export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin_it', 
  LOGISTIK: 'logistik'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const BOOKING_TYPES = {
  ROOM: 'room',
  ZOOM: 'zoom',
  BOTH: 'both'
};

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const DEFAULT_ROOM_CAPACITY = 10;
export const MAX_ROOM_CAPACITY = 100;