import { Router } from 'express';
import { validate, schemas } from '../middleware/validation';
import {
  login,
  refreshToken,
  verifyToken,
  logout
} from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with Podium API
 * 
 * Body:
 * {
 *   "userId": "user_id_from_podium",
 *   "token": "token_from_podium"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "jwt_token_for_reports_service",
 *     "expiresIn": "24h",
 *     "tokenType": "Bearer",
 *     "user": {
 *       "id": "user_id",
 *       "email": "user@example.com",
 *       "name": "User Name"
 *     }
 *   }
 * }
 */
router.post('/login', login);

/**
 * POST /api/auth/refresh
 * Refresh JWT token if near expiration
 * 
 * Headers:
 * Authorization: Bearer <current_jwt_token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "new_jwt_token",
 *     "expiresIn": "24h",
 *     "tokenType": "Bearer"
 *   }
 * }
 */
router.post('/refresh', refreshToken);

/**
 * GET /api/auth/verify
 * Verify current JWT token validity
 * 
 * Headers:
 * Authorization: Bearer <jwt_token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "userId": "user_id",
 *     "expiresIn": 86400,
 *     "userData": { ... }
 *   }
 * }
 */
router.get('/verify', verifyToken);

/**
 * POST /api/auth/logout
 * Logout user (mainly for logging purposes)
 * 
 * Headers:
 * Authorization: Bearer <jwt_token> (optional)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Logged out successfully"
 *   }
 * }
 */
router.post('/logout', logout);

export default router;