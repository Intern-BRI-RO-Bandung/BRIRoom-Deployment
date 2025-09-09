import express from 'express';
import {
  getRequestsTest,
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  getRequestStatusLogs,
  getMyRequestById,
  updateMyRequest,
  cancelRequest,
  getSchedule,
  getRoomRequests,
  getZoomRequests,
  approveRoomRequest,
  rejectRoomRequest,
  adminApproveZoom,
  adminRejectZoom,
  approveRequest,
  rejectRequest,
  getPublicRequests,
  exportRequestsPdf,
} from '../controllers/requestController.js';

import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ADD this route at the top after router declaration
router.get('/test', authenticate, getRequestsTest);

// ✅ STATIC ROUTES FIRST (paling spesifik di atas)
router.get('/schedule', getSchedule);
router.get('/all', authenticate, authorize('admin_it', 'logistik'), getAllRequests);
router.get('/room-requests', authenticate, authorize('admin_it', 'logistik'), getRoomRequests);
router.get('/zoom-requests', authenticate, authorize('admin_it'), getZoomRequests);

// ➕ Export PDF (admin_it & logistik)
router.get('/export/pdf', authenticate, authorize('admin_it', 'logistik'), exportRequestsPdf);

// Public routes (no authentication required)
router.get('/public', getPublicRequests);

// ✅ USER SPECIFIC ROUTES (dengan prefix yang jelas)
router.post('/', authenticate, authorize('user'), createRequest);
router.get('/me', authenticate, authorize('user'), getMyRequests);
router.get('/me/:id', authenticate, authorize('user'), getMyRequestById);
router.put('/me/:id', authenticate, authorize('user'), updateMyRequest);
router.patch('/me/:id/cancel', authenticate, authorize('user'), cancelRequest);

// ✅ ROOM MANAGEMENT ROUTES (dengan prefix room)
router.patch('/room/:id/approve', authenticate, authorize('logistik'), approveRoomRequest);
router.patch('/room/:id/reject', authenticate, authorize('logistik'), rejectRoomRequest);

// ✅ ZOOM MANAGEMENT ROUTES (dengan prefix zoom)
router.patch('/zoom/:id/approve', authenticate, authorize('admin_it'), adminApproveZoom);
router.patch('/zoom/:id/reject', authenticate, authorize('admin_it'), adminRejectZoom);

// ✅ GENERAL ADMIN ROUTES (dengan prefix admin)
router.patch('/admin/:id/approve', authenticate, authorize('admin_it'), approveRequest);
router.patch('/admin/:id/reject', authenticate, authorize('admin_it'), rejectRequest);

// ✅ DYNAMIC ROUTES LAST (paling general di bawah)
router.get('/:id', authenticate, getRequestById);
router.get('/:id/logs', authenticate, getRequestStatusLogs);

export default router;