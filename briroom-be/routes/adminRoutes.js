import express from 'express';
import {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllZoomLinks,
  createZoomLink,
  updateZoomLink,
  deleteZoomLink,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Zoom Link routes - only admin_it
router.get('/zoom-links', authenticate, authorize('admin_it'), getAllZoomLinks);
router.post('/zoom-links', authenticate, authorize('admin_it'), createZoomLink);
router.put('/zoom-links/:id', authenticate, authorize('admin_it'), updateZoomLink);
router.delete('/zoom-links/:id', authenticate, authorize('admin_it'), deleteZoomLink);

// Room routes - accessible by both admin_it and logistik
router.get('/rooms', authenticate, authorize('admin_it', 'logistik'), getAllRooms);
router.post('/rooms', authenticate, authorize('admin_it', 'logistik'), createRoom);
router.put('/rooms/:id', authenticate, authorize('admin_it', 'logistik'), updateRoom);
router.delete('/rooms/:id', authenticate, authorize('admin_it', 'logistik'), deleteRoom);

export default router;
