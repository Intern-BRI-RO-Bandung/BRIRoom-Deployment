// routes/workflowRoutes.js
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import {
  // Logistik functions (Room approval)
  getRoomRequests,
  approveRoomRequest,
  rejectRoomRequest,
  
  // Admin IT functions (Zoom approval)
  getZoomRequests,
  approveZoomRequest,
  rejectZoomRequest,
  getAdminItDashboard
} from '../controllers/workflowController.js';

const router = express.Router();

// ===== LOGISTIK ROUTES (Room Approval) =====
// Hanya logistik yang bisa akses route ini
router.get('/logistik/room-requests', 
  authenticate, 
  roleMiddleware(['logistik']), 
  getRoomRequests
);

router.patch('/logistik/room/:id/approve', 
  authenticate, 
  roleMiddleware(['logistik']), 
  approveRoomRequest
);

router.patch('/logistik/room/:id/reject', 
  authenticate, 
  roleMiddleware(['logistik']), 
  rejectRoomRequest
);

// ===== ADMIN IT ROUTES (Zoom Approval) =====
// Hanya admin_it yang bisa akses route ini
router.get('/admin-it/zoom-requests', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  getZoomRequests
);

router.patch('/admin-it/zoom/:id/approve', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  approveZoomRequest
);

router.patch('/admin-it/zoom/:id/reject', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  rejectZoomRequest
);

router.get('/admin-it/dashboard', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  getAdminItDashboard
);

export default router;
