import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/index';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest {
  userId: string;
  token: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    expiresIn: string;
    tokenType: string;
    user?: {
      id: string;
      email?: string;
      name?: string;
    };
  };
  error?: string;
}

/**
 * POST /api/auth/login
 * Authenticates user with Podium API and returns JWT token for reports service
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { userId, token }: AuthRequest = req.body;

  // Validate request body
  if (!userId || !token) {
    logger.warn('Authentication attempt with missing credentials', {
      hasUserId: !!userId,
      hasToken: !!token,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse = {
      success: false,
      error: 'Missing required fields: userId and token'
    };

    return res.status(400).json(response);
  }

  logger.info('Authentication attempt started', {
    userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    // Authenticate user with Podium API
    const authResult = await authService.authenticateUser(userId, token);

    if (!authResult.success) {
      logger.warn('Authentication failed', {
        userId,
        error: authResult.error,
        ip: req.ip
      });

      const response: ApiResponse = {
        success: false,
        error: authResult.error || 'Authentication failed'
      };

      return res.status(401).json(response);
    }

    // Successful authentication
    logger.info('User authenticated successfully', {
      userId,
      ip: req.ip
    });

    const response: AuthResponse = {
      success: true,
      data: {
        accessToken: authResult.token!,
        expiresIn: '24h',
        tokenType: 'Bearer',
        user: authResult.userData ? {
          id: authResult.userData.id,
          email: authResult.userData.email,
          name: authResult.userData.name
        } : undefined
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Authentication process error', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });

    const response: ApiResponse = {
      success: false,
      error: 'Internal authentication error'
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/auth/refresh
 * Refreshes JWT token if near expiration
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse = {
      success: false,
      error: 'Missing or invalid Authorization header'
    };

    return res.status(401).json(response);
  }

  const currentToken = authHeader.substring(7);

  try {
    const refreshResult = await authService.refreshToken(currentToken);

    if (!refreshResult.success) {
      logger.info('Token refresh declined', {
        error: refreshResult.error,
        ip: req.ip
      });

      const response: ApiResponse = {
        success: false,
        error: refreshResult.error || 'Token refresh failed'
      };

      return res.status(400).json(response);
    }

    logger.info('Token refreshed successfully', {
      ip: req.ip
    });

    const response: AuthResponse = {
      success: true,
      data: {
        accessToken: refreshResult.token!,
        expiresIn: '24h',
        tokenType: 'Bearer'
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Token refresh error', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip
    });

    const response: ApiResponse = {
      success: false,
      error: 'Token refresh failed'
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/auth/verify
 * Verifies current JWT token validity
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const response: ApiResponse = {
      success: false,
      error: "Missing or invalid Authorization header",
    };
    return res.status(401).json(response);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = authService.verifyJWT(token) as JwtPayload & {
      userId: string;
      userData?: any;
    };

    if (!decoded) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid or expired token",
      };
      return res.status(401).json(response);
    }

    // ⏳ Tiempo hasta expiración
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (decoded.exp ?? 0) - now;

    const response: ApiResponse = {
      success: true,
      data: {
        valid: true,
        userId: decoded.userId,
        expiresIn: timeUntilExpiry,
        userData: decoded.userData,
      },
    };

    return res.json(response);
  } catch (error) {
    logger.error("Token verification error", {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
    });

    const response: ApiResponse = {
      success: false,
      error: "Token verification failed",
    };

    return res.status(500).json(response);
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint (mainly for logging purposes since JWT is stateless)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  // Try to get user info from token for logging
  let userId = 'unknown';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = authService.verifyJWT(token);
      if (decoded) {
        userId = decoded.userId;
      }
    } catch (error) {
      // Ignore errors during logout
    }
  }

  logger.info('User logout', {
    userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const response: ApiResponse = {
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  };

  res.json(response);
});