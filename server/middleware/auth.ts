import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'centralized-admin-secret-key-2026';

export interface JwtPayload {
  id: string; // Changed from number to string for MongoDB ObjectIds
  username: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Express middleware to authenticate requests via Bearer JWT token
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-access-token'] as string | undefined);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided',
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
}
