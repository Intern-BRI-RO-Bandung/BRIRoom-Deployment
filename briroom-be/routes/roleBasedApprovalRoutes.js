// routes/roleBasedApprovalRoutes.js
import express from 'express';
import { 
  approveZoomRequest, 
  rejectZoomRequest, 
  approveRoomRequest, 
  rejectRoomRequest,
  getAvailableZoomAccounts,
  getAvailableRooms
} from '../controllers/roleBasedApprovalController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Admin IT Routes (untuk zoom approvals)
router.patch('/zoom/:id/approve', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  approveZoomRequest
);

router.patch('/zoom/:id/reject', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  rejectZoomRequest
);

router.get('/zoom/available', 
  authenticate, 
  roleMiddleware(['admin_it']), 
  getAvailableZoomAccounts
);

// Logistik Routes (untuk room approvals)
router.patch('/room/:id/approve', 
  authenticate, 
  roleMiddleware(['logistik']), 
  approveRoomRequest
);

router.patch('/room/:id/reject', 
  authenticate, 
  roleMiddleware(['logistik']), 
  rejectRoomRequest
);

router.get('/room/available', 
  authenticate, 
  roleMiddleware(['logistik']), 
  getAvailableRooms
);

export default router;
