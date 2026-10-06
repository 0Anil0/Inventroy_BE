import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth.utils';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  plantId?: number;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token missing' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    
    const plantIdHeader = req.headers['x-plant-id'];
    if (plantIdHeader) {
      req.plantId = parseInt(plantIdHeader as string, 10);
    }
    
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};
