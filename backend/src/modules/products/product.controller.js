import * as productService from './product.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const handleCreateProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return successResponse(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const handleGetAllProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();
    return successResponse(res, products, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      return errorResponse(res, 'PRODUCT_NOT_FOUND', `Product with ID ${id} not found`, [], 404);
    }
    return successResponse(res, product, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
};
