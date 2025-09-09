// middleware/roleMiddleware.js
export const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin_it') {
    next();
  } else {
    res.status(403).json({ message: 'Akses hanya untuk admin IT' });
  }
};

export const authorizeLogistik = (req, res, next) => {
  if (req.user && req.user.role === 'logistik') {
    next();
  } else {
    res.status(403).json({ message: 'Akses hanya untuk logistik' });
  }
};

export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user information' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Akses ditolak. Role yang diizinkan: ${allowedRoles.join(', ')}`,
        userRole: req.user.role
      });
    }
    
    next();
  };
};