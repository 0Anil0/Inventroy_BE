import { Request, Response, NextFunction } from 'express';
import { ProjectAssignmentService } from '../services/projectAssignment.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ProjectAssignmentController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const to_project_id =
        req.query.to_project_id && req.query.to_project_id !== 'null' && req.query.to_project_id !== 'undefined'
          ? parseInt(String(req.query.to_project_id), 10)
          : undefined;
      const from_date = req.query.from_date ? String(req.query.from_date) : undefined;
      const to_date = req.query.to_date ? String(req.query.to_date) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

      const plant_id = (req as AuthenticatedRequest).plantId;
      if (!plant_id) {
        res.status(400).json({ success: false, message: 'Plant selection is required' });
        return;
      }

      const result = await ProjectAssignmentService.getAll({
        search,
        to_project_id,
        from_date,
        to_date,
        page,
        limit,
        plant_id,
      });

      res.json({
        success: true,
        assignments: result.assignments,
        total: result.total,
        totalAssignmentsCount: result.totalAssignmentsCount,
        uniqueProjectsAssigned: result.uniqueProjectsAssigned,
        totalUnitsDispatched: result.totalUnitsDispatched,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const assignment = await ProjectAssignmentService.getById(id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Project assignment record not found' });
        return;
      }
      res.json({ success: true, assignment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from_project_id, to_project_id, assigned_to_person, notes, items } = req.body;
      const userId = (req as any).user?.id;

      if (!to_project_id || !assigned_to_person || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'to_project_id, assigned_to_person, and a non-empty array of items are required',
        });
        return;
      }

      const plant_id = (req as AuthenticatedRequest).plantId;
      if (!plant_id) {
        res.status(400).json({ success: false, message: 'Plant selection is required' });
        return;
      }

      const assignment = await ProjectAssignmentService.create({
        from_project_id,
        to_project_id: parseInt(String(to_project_id), 10),
        assigned_to_person: String(assigned_to_person),
        notes: notes ? String(notes) : undefined,
        created_by_user_id: userId,
        items: items.map((i: any) => ({
          item_type_id: parseInt(String(i.item_type_id), 10),
          lot_id: i.lot_id ? parseInt(String(i.lot_id), 10) : undefined,
          quantity: parseFloat(String(i.quantity)),
        })),
        plant_id,
      });

      res.status(201).json({
        success: true,
        message: `Project Material Assignment ${assignment?.assignment_no} created successfully`,
        assignment,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const plant_id = (req as AuthenticatedRequest).plantId;
      if (!plant_id) {
        res.status(400).json({ success: false, message: 'Plant selection is required' });
        return;
      }
      const assignment = await ProjectAssignmentService.update(id, { ...req.body, plant_id });
      res.json({
        success: true,
        message: `Assignment ${assignment?.assignment_no} updated successfully`,
        assignment,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const plant_id = (req as AuthenticatedRequest).plantId;
      if (!plant_id) {
        res.status(400).json({ success: false, message: 'Plant selection is required' });
        return;
      }
      const result = await ProjectAssignmentService.delete(id, plant_id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
