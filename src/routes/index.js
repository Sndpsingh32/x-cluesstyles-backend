import { Router } from 'express';
import userRouter from './user.routes.js';
import { healthcheck } from '../controllers/health.controller.js';

const router = Router();
router.get('/health', healthcheck);
router.use('/users', userRouter);

export default router;
