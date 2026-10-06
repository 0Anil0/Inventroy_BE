import { Router } from 'express';
import { PlantController } from '../controllers/plant.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken); // Secure all plant routes

router.get('/plants', PlantController.getPlants);
router.get('/plants/:id', PlantController.getPlantById);
router.post('/plants', PlantController.createPlant);
router.put('/plants/:id', PlantController.updatePlant);
router.delete('/plants/:id', PlantController.deletePlant);

export default router;
