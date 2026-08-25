import { Router } from 'express';
import { UnitController } from '../controllers/unit.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/units', UnitController.getAll);
router.get('/units/:id', UnitController.getById);
router.post('/units', UnitController.create);
router.put('/units/:id', UnitController.update);
router.delete('/units/:id', UnitController.delete);

export default router;
