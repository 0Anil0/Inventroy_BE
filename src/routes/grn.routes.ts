import { Router } from 'express';
import { getGRNs, getGRNById, createGRN } from '../controllers/grn.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getGRNs);
router.get('/:id', getGRNById);
router.post('/', createGRN);

export default router;
