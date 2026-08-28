import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  public static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
    }
  }

  public static async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await UserService.getAllRoles();
      res.json({ success: true, roles });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch roles' });
    }
  }

  public static async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Role name is required' });
        return;
      }
      const role = await UserService.createRole({ name, description });
      res.status(201).json({ success: true, role });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create role' });
    }
  }

  public static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { name, description } = req.body;
      const role = await UserService.updateRole(id, { name, description });
      res.json({ success: true, role });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update role' });
    }
  }

  public static async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await UserService.deleteRole(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete role' });
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password, role_id } = req.body;

      if (!username || !password || !role_id) {
        res.status(400).json({ success: false, message: 'Username, password, and role are required' });
        return;
      }

      const user = await UserService.createUser({
        username,
        email,
        passwordPayload: password,
        role_id: parseInt(String(role_id), 10),
      });

      res.status(201).json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create user' });
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = String(req.params.id);
      const id = parseInt(idParam, 10);
      const { username, email, password, role_id } = req.body;

      const user = await UserService.updateUser(id, {
        username,
        email,
        passwordPayload: password,
        role_id: role_id ? parseInt(String(role_id), 10) : undefined,
      });

      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to update user' });
    }
  }

  public static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = String(req.params.id);
      const id = parseInt(idParam, 10);
      const result = await UserService.deleteUser(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete user' });
    }
  }
}
