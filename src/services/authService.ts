import jwt, { SignOptions,JwtPayload } from 'jsonwebtoken';
import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface PodiumUser {
  id: string;
  token: string;
}

export interface ValidatedUser {
  userId: string;
  isValid: boolean;
  userData?: any;
}

export interface JWTPayload {
  userId: string;

}

export interface RefreshResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export class AuthService {
  private readonly podiumApiUrl = 'https://stage-api.plataformapodium.com/api/user/';
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string = '24h';

  constructor() {
    this.jwtSecret = config.jwtSecret || 'fallback-secret-change-in-production';

    if (!config.jwtSecret) {
      logger.warn('JWT_SECRET not set in environment variables. Using fallback secret.');
    }
  }

  /**
   * Validates user credentials against Podium API
   * @param userId - User ID from client
   * @param token - Token from client
   * @returns Promise<ValidatedUser> - Validation result
   */
  async validateUserWithPodium(userId: string, token: string): Promise<ValidatedUser> {
    try {
      logger.info('Validating user with Podium API', { userId, tokenLength: token.length });

      const response = await axios.get(`${this.podiumApiUrl}${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });

      if (response.status === 200 && response.data) {
        logger.info('User validation successful', { userId, status: response.status });

        return {
          userId,
          isValid: true,
          userData: response.data
        };
      } else {
        logger.warn('User validation failed - Invalid response', {
          userId,
          status: response.status
        });

        return {
          userId,
          isValid: false
        };
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 401 || status === 403) {
          logger.warn('User validation failed - Unauthorized', {
            userId,
            status,
            message
          });
        } else if (status === 404) {
          logger.warn('User validation failed - User not found', {
            userId,
            status
          });
        } else {
          logger.error('User validation failed - API error', {
            userId,
            status,
            message,
            url: error.config?.url
          });
        }
      } else {
        logger.error('User validation failed - Unexpected error', {
          userId,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      return {
        userId,
        isValid: false
      };
    }
  }

  /**
   * Generates a new JWT token for validated user
   * @param userId - Validated user ID
   * @param userData - Optional user data to include in token
   * @returns string - JWT token
   */
  generateJWT(userId: string, userData?: any): string {
    try {
      const payload: JWTPayload = {
        userId,

      };

      // Add user data if provided (but keep token size reasonable)
      if (userData) {
        (payload as any).userData = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          // Add only essential fields to keep token size manageable
        };
      }
      const options: SignOptions = {
        expiresIn: this.jwtExpiresIn,
        issuer: "formarte-reports",
        audience: "formarte-users",
      };
      const token = jwt.sign(payload, this.jwtSecret, options);

      logger.info('JWT token generated successfully', {
        userId,
        expiresIn: this.jwtExpiresIn
      });

      return token;

    } catch (error) {
      logger.error('Failed to generate JWT token', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verifies and decodes a JWT token
   * @param token - JWT token to verify
   * @returns JWTPayload | null - Decoded payload or null if invalid
   */
  verifyJWT(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'formarte-reports',
        audience: 'formarte-users'
      }) as JWTPayload;

      logger.debug('JWT token verified successfully', { userId: decoded.userId });

      return decoded;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('JWT token expired', { expiredAt: error.expiredAt });
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid JWT token', { error: error.message });
      } else {
        logger.error('JWT verification failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }

      return null;
    }
  }

  /**
   * Complete authentication flow: validate with Podium and generate JWT
   * @param userId - User ID from client
   * @param podiumToken - Token from client
   * @returns Promise<{success: boolean, token?: string, error?: string}>
   */
  async authenticateUser(userId: string, podiumToken: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
    userData?: any;
  }> {
    try {
      // Validate input
      if (!userId || !podiumToken) {
        return {
          success: false,
          error: 'Missing userId or token'
        };
      }

      // Validate user with Podium API
      const validation = await this.validateUserWithPodium(userId, podiumToken);

      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid user credentials'
        };
      }

      // Generate JWT token for our service
      const jwtToken = this.generateJWT(userId, validation.userData);

      logger.info('User authentication completed successfully', { userId });

      return {
        success: true,
        token: jwtToken,
        userData: validation.userData
      };

    } catch (error) {
      logger.error('Authentication process failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: 'Authentication process failed'
      };
    }
  }


  /**
   * Refreshes a JWT token if it's valid but near expiration
   * @param token - Current JWT token
   * @returns Promise<{success: boolean, token?: string, error?: string}>
   */

async refreshToken(token: string): Promise<RefreshResponse> {
  try {
    const decoded = this.verifyJWT(token) as JwtPayload & { userId: string; userData?: any };

    if (!decoded) {
      return { success: false, error: "Invalid token" };
    }

    // ⏳ Verificar tiempo restante
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (decoded.exp ?? 0) - now;
    const twoHours = 2 * 60 * 60;

    if (timeUntilExpiry > twoHours) {
      return { success: false, error: "Token does not need refresh yet" };
    }

    // 🔑 Generar nuevo token
    const newToken = this.generateJWT(decoded.userId, decoded.userData);

    logger.info("JWT token refreshed successfully", { userId: decoded.userId });

    return { success: true, token: newToken };
  } catch (error) {
    logger.error("Token refresh failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return { success: false, error: "Token refresh failed" };
  }
}
  /**
   * Validates that a user has access to the reports service
   * @param userId - User ID to check
   * @returns boolean - Whether user has access
   */
  hasReportsAccess(userId: string): boolean {
    // Add any additional business logic here
    // For now, any validated user has access
    return true;
  }
}

// Singleton instance
export const authService = new AuthService();