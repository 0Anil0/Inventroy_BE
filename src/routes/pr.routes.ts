import { Router } from 'express';
import { PRController } from '../controllers/pr.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/purchase-requisitions', PRController.getAll);
router.get('/purchase-requisitions/:id', PRController.getById);
router.post('/purchase-requisitions', PRController.create);
router.put('/purchase-requisitions/:id/review', PRController.reviewAndApprove);
router.post('/purchase-requisitions/:id/convert-to-po', PRController.convertToPO);
router.delete('/purchase-requisitions/:id', PRController.delete);

export default router;
