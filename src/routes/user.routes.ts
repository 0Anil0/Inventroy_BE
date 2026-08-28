import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Protect all user management endpoints with authentication token middleware
router.use(authenticateToken);

router.get('/users', UserController.getUsers);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

router.get('/roles', UserController.getRoles);
router.post('/roles', UserController.createRole);
router.put('/roles/:id', UserController.updateRole);
router.delete('/roles/:id', UserController.deleteRole);

export default router;
