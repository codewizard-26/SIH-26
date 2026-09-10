import { Router } from 'express';
import * as productController from './product.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { productCreateSchema, productIdParamSchema } from './product.schema.js';

const router = Router();

router.post('/', validate(productCreateSchema, 'body'), productController.handleCreateProduct);
router.get('/', productController.handleGetAllProducts);
router.get('/:id', validate(productIdParamSchema, 'params'), productController.handleGetProductById);

export default router;
