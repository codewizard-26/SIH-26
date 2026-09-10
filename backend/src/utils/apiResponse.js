/**
 * Standard API Success Response Builder
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 */
export const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard API Error Response Builder
 * @param {import('express').Response} res
 * @param {string} code
 * @param {string} message
 * @param {any} details
 * @param {number} statusCode
 */
export const errorResponse = (res, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', details = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: details || [],
    },
  });
};
