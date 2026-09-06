import { Router } from 'express';
import { MakeController } from '../controllers/make.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/makes', MakeController.getAll);
router.post('/makes', MakeController.create);
router.put('/makes/:id', MakeController.update);
router.delete('/makes/:id', MakeController.delete);

export default router;
