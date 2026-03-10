import { verifyAccessToken } from '../utils/jwtUtils.js';
import User from '../models/User.js';

/**
 * Protect routes - verify JWT access token
 * Adds user object to request if valid
 */
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token, authorization denied',
      });
    }

    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found, authorization denied',
      });
    }

    // Attach user to request
    req.user = user;
    
    // Debug logging
    console.log('[Auth] User authenticated:', {
      userId: user._id.toString(),
      email: user.email,
      tokenUserId: decoded.id,
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth - attach user if token is valid, but don't block
 * Useful for routes that work for both authenticated and guest users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
