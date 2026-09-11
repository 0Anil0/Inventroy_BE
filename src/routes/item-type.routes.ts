import { Router } from 'express';
import { ItemTypeController } from '../controllers/item-type.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/item-types', ItemTypeController.getAll);
router.post('/item-types', ItemTypeController.create);
router.post('/item-types/bulk-import', ItemTypeController.bulkImport);
router.put('/item-types/:id', ItemTypeController.update);
router.delete('/item-types/:id', ItemTypeController.delete);

export default router;

