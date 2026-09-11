import { Router } from 'express';
import { POController } from '../controllers/po.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/purchase-orders', POController.getAll);
router.get('/purchase-orders/item-tracking', POController.getItemTracking);
router.get('/purchase-orders/:id', POController.getById);
router.post('/purchase-orders', POController.create);
router.put('/purchase-orders/:id', POController.update);
router.post('/purchase-orders/:id/approve', POController.approve);
router.post('/purchase-orders/:id/reject', POController.reject);
router.post('/purchase-orders/:id/receive', POController.receiveStock);
router.delete('/purchase-orders/:id', POController.delete);

export default router;
