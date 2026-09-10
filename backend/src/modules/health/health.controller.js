import { successResponse } from '../../utils/apiResponse.js';
import { pool } from '../../db/index.js';

export const getHealth = async (req, res, next) => {
  try {
    let dbStatus = 'NOT_CONFIGURED';

    if (pool) {
      try {
        await pool.query('SELECT 1');
        dbStatus = 'CONNECTED';
      } catch (err) {
        dbStatus = `DISCONNECTED: ${err.message}`;
      }
    }

    const healthData = {
      status: 'HEALTHY',
      service: 'AI-Powered Packaged Commodity Compliance Scanner',
      problemStatement: 'SIH26034',
      statutoryReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
    };

    return successResponse(res, healthData, 'System operational');
  } catch (error) {
    next(error);
  }
};
