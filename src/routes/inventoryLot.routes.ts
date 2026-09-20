import { Router } from 'express';
import { InventoryLotController } from '../controllers/inventoryLot.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/inventory/lots', authenticateToken, InventoryLotController.getAvailableLots);

export default router;
