import { Router } from 'express';
import { asyncHandler } from '../middleware/auth';
import { SiteBanner } from '../models/SiteBanner';

const router = Router();

router.get('/banner', asyncHandler(async (_req, res) => {
  const banner = await SiteBanner.findOne({ key: 'homepage' }).select('-_id -key -createdAt -updatedAt -__v').lean();
  return res.json({ data: banner ?? null });
}));

export default router;
