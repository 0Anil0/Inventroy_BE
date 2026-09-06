import { Router } from 'express';
import { TermsAndConditionsController } from '../controllers/terms-and-conditions.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/terms-and-conditions', TermsAndConditionsController.getAll);
router.get('/terms-and-conditions/default', TermsAndConditionsController.getDefault);
router.get('/terms-and-conditions/:id', TermsAndConditionsController.getById);
router.post('/terms-and-conditions', TermsAndConditionsController.create);
router.put('/terms-and-conditions/:id', TermsAndConditionsController.update);
router.put('/terms-and-conditions/:id/set-default', TermsAndConditionsController.setDefault);
router.delete('/terms-and-conditions/:id', TermsAndConditionsController.delete);

export default router;
