import { Router } from 'express';
import * as ruleController from './rule.controller.js';

const router = Router();

router.get('/', ruleController.handleGetAllRules);
router.get('/:id', ruleController.handleGetRuleById);

export default router;
