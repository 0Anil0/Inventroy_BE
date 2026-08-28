import { Router } from 'express';
import { MaterialIssueController } from '../controllers/material-issue.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/material-issues', MaterialIssueController.getAll);
router.get('/material-issues/:id', MaterialIssueController.getById);
router.post('/material-issues', MaterialIssueController.create);

export default router;
