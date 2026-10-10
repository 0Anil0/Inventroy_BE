import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth.utils';
import { Plant } from '../models/Plant';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  plantId?: number;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token missing' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    
    let targetPlantId: number | undefined;
    const plantIdHeader = req.headers['x-plant-id'];
    if (plantIdHeader) {
      const parsed = parseInt(plantIdHeader as string, 10);
      if (!isNaN(parsed)) {
        targetPlantId = parsed;
      }
    }

    // Verify if plantId exists in DB, otherwise fallback to first active plant
    if (targetPlantId) {
      const existingPlant = await Plant.findByPk(targetPlantId);
      if (existingPlant) {
        req.plantId = targetPlantId;
      }
    }

    if (!req.plantId) {
      const defaultPlant = await Plant.findOne({ where: { status: 'active' }, order: [['id', 'ASC']] });
      if (defaultPlant) {
        req.plantId = defaultPlant.id;
      } else {
        req.plantId = 1;
      }
    }
    
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};
