import { Router } from 'express';
import { ItemDescriptionController } from '../controllers/item-description.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/item-descriptions', ItemDescriptionController.getAll);
router.post('/item-descriptions', ItemDescriptionController.create);
router.put('/item-descriptions/:id', ItemDescriptionController.update);
router.delete('/item-descriptions/:id', ItemDescriptionController.delete);

export default router;
