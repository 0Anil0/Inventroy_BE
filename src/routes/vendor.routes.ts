import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/vendors', VendorController.getAll);
router.post('/vendors', VendorController.create);
router.put('/vendors/:id', VendorController.update);
router.delete('/vendors/:id', VendorController.delete);

export default router;
