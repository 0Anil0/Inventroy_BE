import { Router } from 'express';
import { POController } from '../controllers/po.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/purchase-orders', POController.getAll);
router.get('/purchase-orders/:id', POController.getById);
router.post('/purchase-orders', POController.create);
router.post('/purchase-orders/:id/receive', POController.receiveStock);

export default router;
