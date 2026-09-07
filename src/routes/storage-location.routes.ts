import { Router } from 'express';
import { StorageLocationController } from '../controllers/storage-location.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/storage-shelves', StorageLocationController.getAllShelves);
router.post('/storage-shelves', StorageLocationController.createShelf);
router.put('/storage-shelves/:id', StorageLocationController.updateShelf);
router.delete('/storage-shelves/:id', StorageLocationController.deleteShelf);

router.post('/storage-racks', StorageLocationController.createRack);
router.put('/storage-racks/:id', StorageLocationController.updateRack);
router.delete('/storage-racks/:id', StorageLocationController.deleteRack);

export default router;
