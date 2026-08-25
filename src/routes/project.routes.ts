import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/projects', ProjectController.getAll);
router.post('/projects', ProjectController.create);
router.put('/projects/:id', ProjectController.update);
router.delete('/projects/:id', ProjectController.delete);

export default router;
