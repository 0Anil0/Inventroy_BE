import { Request, Response, NextFunction } from 'express';
import { ProjectAssignmentService } from '../services/projectAssignment.service';

export class ProjectAssignmentController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const to_project_id = req.query.to_project_id
        ? parseInt(String(req.query.to_project_id), 10)
        : undefined;

      const assignments = await ProjectAssignmentService.getAll({ to_project_id });
      res.json({ success: true, assignments });
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

      const assignment = await ProjectAssignmentService.create({
        from_project_id,
        to_project_id: parseInt(String(to_project_id), 10),
        assigned_to_person: String(assigned_to_person),
        notes: notes ? String(notes) : undefined,
        created_by_user_id: userId,
        items: items.map((i: any) => ({
          item_type_id: parseInt(String(i.item_type_id), 10),
          quantity: parseFloat(String(i.quantity)),
        })),
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
}
