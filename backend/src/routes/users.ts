import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { UserController } from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/users - Get users (admin/facility_manager only)
router.get('/', 
  roleMiddleware(['admin', 'facility_manager', 'operations_director']),
  asyncHandler(userController.getUsers.bind(userController))
);

// GET /api/users/profile - Get current user profile
router.get('/profile', asyncHandler(userController.getProfile.bind(userController)));

// PUT /api/users/profile - Update current user profile
router.put('/profile', asyncHandler(userController.updateProfile.bind(userController)));

// GET /api/users/:id - Get specific user
router.get('/:id', asyncHandler(userController.getUserById.bind(userController)));

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', 
  roleMiddleware(['admin']),
  asyncHandler(userController.updateUser.bind(userController))
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', 
  roleMiddleware(['admin']),
  asyncHandler(userController.deleteUser.bind(userController))
);

export default router;