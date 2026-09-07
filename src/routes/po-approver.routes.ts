import { Router } from 'express';
import { POApproverController } from '../controllers/po-approver.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/po-approvers', POApproverController.getAll);
router.post('/po-approvers', POApproverController.create);
router.put('/po-approvers/:id', POApproverController.update);
router.delete('/po-approvers/:id', POApproverController.delete);

export default router;
