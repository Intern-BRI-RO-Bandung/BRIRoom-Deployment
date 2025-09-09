import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// ✅ ROUTE PALING SEDERHANA
router.get('/test', (req, res) => {
  console.log('Auth test route hit');
  res.json({
    success: true,
    message: 'Auth routes working'
  });
});

// ✅ LOGIN ROUTE (POST) - Use authController
router.post('/login', login);

export default router;