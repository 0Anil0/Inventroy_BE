import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
      }

      const data = await AuthService.login(username, password);
      res.json({
        success: true,
        token: data.token,
        user: data.user,
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Authentication failed' });
    }
  }

  public static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ success: false, message: 'Username and password are required' });
        return;
      }

      const data = await AuthService.signup(username, email, password);
      res.status(201).json({
        success: true,
        token: data.token,
        user: data.user,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Registration failed' });
    }
  }

  public static async getCurrentUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);
      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'User not found' });
    }
  }
}
