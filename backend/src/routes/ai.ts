import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AIController } from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const aiController = new AIController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/ai/intake - Process natural language work order intake
router.post('/intake', asyncHandler(aiController.processWorkOrderIntake.bind(aiController)));

// POST /api/ai/dispatch - Get assignment recommendations
router.post('/dispatch', asyncHandler(aiController.getDispatchRecommendations.bind(aiController)));

// POST /api/ai/pm-suggest - Get PM template suggestions
router.post('/pm-suggest', asyncHandler(aiController.suggestPMTemplate.bind(aiController)));

// POST /api/ai/priority - Get priority recommendations
router.post('/priority', asyncHandler(aiController.suggestPriority.bind(aiController)));

// POST /api/ai/feedback - Provide feedback on AI recommendations
router.post('/feedback', asyncHandler(aiController.submitFeedback.bind(aiController)));

export default router;