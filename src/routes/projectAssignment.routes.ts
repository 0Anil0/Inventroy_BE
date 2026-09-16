import { Router } from 'express';
import { ProjectAssignmentController } from '../controllers/projectAssignment.controller';

const router = Router();

router.get('/', ProjectAssignmentController.getAll);
router.get('/:id', ProjectAssignmentController.getById);
router.post('/', ProjectAssignmentController.create);
router.put('/:id', ProjectAssignmentController.update);
router.delete('/:id', ProjectAssignmentController.delete);

export default router;
