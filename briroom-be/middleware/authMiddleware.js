import jwt from 'jsonwebtoken';
import db from '../config/db.js'; // Pastikan path ini benar

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Auth check:', {
      hasHeader: !!authHeader,
      hasToken: !!token,
      endpoint: req.originalUrl
    });

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'briroom_secret_key');
    console.log('✅ Token decoded for user:', decoded.id);
    
    // Get fresh user data from database
    const userResult = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return res.status(403).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    req.user = userResult.rows[0];
    console.log('👤 User authenticated:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('🔍 Authorization check:', {
      userRole: req.user?.role,
      allowedRoles,
      endpoint: req.originalUrl
    });
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Access denied: User role "${req.user.role}" not allowed`);
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
        allowedRoles: allowedRoles
      });
    }
    
    console.log('✅ Authorization passed');
    next();
  };
};

// Alias untuk kompatibilitas
export const authenticateToken = authenticate;
export const authorizeRoles = authorize;