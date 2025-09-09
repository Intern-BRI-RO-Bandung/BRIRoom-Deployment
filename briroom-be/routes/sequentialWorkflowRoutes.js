// Sequential Workflow Routes - BPMN Process yang berurutan
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import {
  // Admin IT functions (Step 1: Validation & Zoom)
  getPendingRequests,
  validateAndProcessZoom,
  rejectRequest,
  getAdminItStats,
  
  // Logistik functions (Step 2: Room Approval)
  getValidatedRequests,
  approveRoomRequest,
  rejectRoomRequest,
  getLogistikStats
} from '../controllers/sequentialWorkflowController.js';

const router = express.Router();

/**
 * SEQUENTIAL BPMN WORKFLOW ROUTES:
 * 
 * 1. Admin IT Routes (Step 1)
 * 2. Logistik Routes (Step 2)
 */

// ===== ADMIN IT ROUTES (Step 1: Initial Validation & Zoom Processing) =====

// Get all pending requests for Admin IT to validate
router.get('/admin-it/pending', authenticate, roleMiddleware(['admin_it']), getPendingRequests);

// Admin IT validates and processes zoom (approves zoom and forwards to logistik if needed)
router.post('/admin-it/validate/:id', authenticate, roleMiddleware(['admin_it']), validateAndProcessZoom);

// Admin IT rejects request during initial validation
router.post('/admin-it/reject/:id', authenticate, roleMiddleware(['admin_it']), rejectRequest);

// Admin IT dashboard stats
router.get('/admin-it/dashboard', authenticate, roleMiddleware(['admin_it']), getAdminItStats);

// ===== LOGISTIK ROUTES (Step 2: Room Approval) =====

// Get requests that have been validated by Admin IT and need room approval
router.get('/logistik/validated', authenticate, roleMiddleware(['logistik']), getValidatedRequests);

// Logistik approves room request
router.post('/logistik/approve-room/:id', authenticate, roleMiddleware(['logistik']), approveRoomRequest);

// Logistik rejects room request
router.post('/logistik/reject-room/:id', authenticate, roleMiddleware(['logistik']), rejectRoomRequest);

// Logistik dashboard stats
router.get('/logistik/dashboard', authenticate, roleMiddleware(['logistik']), getLogistikStats);

export default router;
