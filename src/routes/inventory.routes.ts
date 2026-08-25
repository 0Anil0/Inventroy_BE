import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/inventory/project/:projectId', InventoryController.getByProjectId);
router.post('/inventory/adjust', InventoryController.adjustQuantity);
router.post('/inventory/batch-adjust', InventoryController.batchAdjustQuantity);

export default router;
