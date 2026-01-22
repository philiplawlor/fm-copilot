import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

// Placeholder routes - will be implemented as needed
const router = express.Router();

router.get('/', asyncHandler(async (req: any, res: any) => {
  res.json({ success: true, data: [], message: 'Assets route - Coming soon' });
}));

export default router;