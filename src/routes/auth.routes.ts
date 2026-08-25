import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.post('/signup', AuthController.signup);
router.get('/me', authenticateToken, AuthController.getCurrentUser);

export default router;
