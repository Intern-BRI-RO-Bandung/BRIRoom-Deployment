// routes/resourceRoutes.js
import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { 
  getAvailableRooms, 
  getOptimalRoom, 
  getAvailableZoom, 
  getOptimalZoom,
  checkResourceConflicts
} from '../controllers/resourceController.js';

const router = express.Router();

// ===== ROOM RESOURCE ROUTES =====
router.get('/rooms/available', authenticateToken, getAvailableRooms);
router.get('/rooms/optimal', authenticateToken, getOptimalRoom);

// ===== ZOOM RESOURCE ROUTES =====
router.get('/zoom/available', authenticateToken, getAvailableZoom);
router.get('/zoom/optimal', authenticateToken, getOptimalZoom);

// ===== UTILITY ROUTES =====
router.get('/conflicts', authenticateToken, checkResourceConflicts);

export default router;