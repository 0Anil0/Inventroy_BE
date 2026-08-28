import { Router } from 'express';
import { StockMovementController } from '../controllers/stock-movement.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/stock-movements', StockMovementController.getMovements);

export default router;
