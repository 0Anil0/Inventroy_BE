import { Request, Response, NextFunction } from 'express';
import { TermsAndConditionsService } from '../services/terms-and-conditions.service';

export class TermsAndConditionsController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await TermsAndConditionsService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
      });

      res.json({
        success: true,
        templates: result.templates,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await TermsAndConditionsService.getById(Number(id));
      res.json({ success: true, template });
    } catch (error) {
      next(error);
    }
  }

  public static async getDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await TermsAndConditionsService.getDefault();
      res.json({ success: true, template });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, payment_terms, inco_terms, content, is_default } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
      }

      const template = await TermsAndConditionsService.create({
        title,
        payment_terms,
        inco_terms,
        content,
        is_default,
      });

      res.status(201).json({
        success: true,
        message: 'Terms & Conditions template created successfully',
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, payment_terms, inco_terms, content, is_default } = req.body;

      const template = await TermsAndConditionsService.update(Number(id), {
        title,
        payment_terms,
        inco_terms,
        content,
        is_default,
      });

      res.json({
        success: true,
        message: 'Terms & Conditions template updated successfully',
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await TermsAndConditionsService.setDefault(Number(id));

      res.json({
        success: true,
        message: 'Default Terms & Conditions template updated',
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await TermsAndConditionsService.delete(Number(id));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
