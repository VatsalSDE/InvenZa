import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Apply JWT protection to all AI routes
router.use(requireAuth);

router.get('/anomaly-check', aiController.getAnomalyCheck);
router.get('/dealer-risk-scores', aiController.getDealerRiskScores);
router.get('/restock-suggestions', aiController.getRestockSuggestions);
router.get('/morning-digest', aiController.getMorningDigest);

export default router;
