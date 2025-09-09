// BPMN Workflow Routes - Routes sesuai BPMN diagram
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import {
  // Admin IT functions
  getAdminItDashboard,
  getPendingRequestsForAdminIt,
  adminItValidateRequest,
  adminItRejectRequest,
  
  // Logistik functions
  getLogistikDashboard,
  getValidatedRequestsForLogistik,
  logistikApproveRoom,
  logistikRejectRoom
} from '../controllers/bpmnWorkflowController.js';

const router = express.Router();

/**
 * BPMN WORKFLOW ROUTES
 * 
 * Sesuai dengan BPMN diagram:
 * 1. User submit request → status: 'pending'
 * 2. Admin IT validate & check zoom → status: 'validated_by_admin' (for room requests) or 'approved' (for zoom-only)
 * 3. Logistik approve/reject room → status: 'approved'/'rejected'
 */

// ===== ADMIN IT ROUTES (Lane Tengah - Sistem Web/Admin IT) =====

// Dashboard untuk Admin IT
router.get('/admin-it/dashboard', authenticate, roleMiddleware(['admin_it']), getAdminItDashboard);

// Lihat semua pending requests yang perlu validasi
router.get('/admin-it/pending-requests', authenticate, roleMiddleware(['admin_it']), getPendingRequestsForAdminIt);

// Validate request (approve zoom + forward to logistik jika perlu)
router.post('/admin-it/validate/:id', authenticate, roleMiddleware(['admin_it']), adminItValidateRequest);

// Reject request pada tahap validasi
router.post('/admin-it/reject/:id', authenticate, roleMiddleware(['admin_it']), adminItRejectRequest);

// ===== LOGISTIK ROUTES (Lane Bawah - Logistik) =====

// Dashboard untuk Logistik
router.get('/logistik/dashboard', authenticate, roleMiddleware(['logistik']), getLogistikDashboard);

// Lihat requests yang sudah divalidasi Admin IT dan perlu approval ruangan
router.get('/logistik/validated-requests', authenticate, roleMiddleware(['logistik']), getValidatedRequestsForLogistik);

// Approve room request
router.post('/logistik/approve-room/:id', authenticate, roleMiddleware(['logistik']), logistikApproveRoom);

// Reject room request
router.post('/logistik/reject-room/:id', authenticate, roleMiddleware(['logistik']), logistikRejectRoom);

export default router;
