import express from 'express';
import { getMyNotifications,
    markAsRead,
 } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';


const router = express.Router();

router.get('/me', authenticate, getMyNotifications);

export default router;
