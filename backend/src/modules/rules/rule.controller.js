import * as ruleService from './rule.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const handleGetAllRules = (req, res, next) => {
  try {
    const { category } = req.query;
    const rules = ruleService.getAllRules(category);
    return successResponse(res, rules, 'Statutory compliance rules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetRuleById = (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = ruleService.getRuleById(id);
    if (!rule) {
      return errorResponse(res, 'RULE_NOT_FOUND', `Statutory rule '${id}' not found in registry`, [], 404);
    }
    return successResponse(res, rule, 'Statutory rule retrieved successfully');
  } catch (error) {
    next(error);
  }
};
