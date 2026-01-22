import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthController } from '../controllers/authController';

const router = express.Router();
const authController = new AuthController();

// POST /api/auth/register - Register new user
router.post('/register', asyncHandler(authController.register.bind(authController)));

// POST /api/auth/login - Login user
router.post('/login', asyncHandler(authController.login.bind(authController)));

// POST /api/auth/logout - Logout user
router.post('/logout', asyncHandler(authController.logout.bind(authController)));

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));

// POST /api/auth/forgot-password - Initiate password reset
router.post('/forgot-password', asyncHandler(authController.forgotPassword.bind(authController)));

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', asyncHandler(authController.resetPassword.bind(authController)));

export default router;