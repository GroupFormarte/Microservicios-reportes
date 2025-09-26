import { Request, Response, NextFunction } from 'express';
import { jwtAuth, apiKeyAuth, hybridAuth, optionalJwtAuth } from '../auth';
import { AuthService } from '../../services/authService';

// Mock the AuthService
jest.mock('../../services/authService');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('jwtAuth middleware', () => {
    it('should authenticate valid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_jwt_token'
      };

      const mockVerifyResult = {
        valid: true,
        userId: 'user123',
        userData: { id: 'user123', name: 'Test User' }
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await jwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'user123',
        userData: { id: 'user123', name: 'Test User' }
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      await jwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authorization header required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject malformed authorization header', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      await jwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };

      const mockVerifyResult = {
        valid: false,
        error: 'Invalid token'
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await jwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockRejectedValue(new Error('Service error'));
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await jwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal authentication error'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('apiKeyAuth middleware', () => {
    beforeEach(() => {
      process.env.API_KEY = 'test_api_key';
    });

    it('should authenticate valid API key', () => {
      mockRequest.headers = {
        'x-api-key': 'test_api_key'
      };

      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'api_key_user',
        type: 'api_key'
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject request without API key header', () => {
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'API key required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid API key', () => {
      mockRequest.headers = {
        'x-api-key': 'invalid_key'
      };

      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API key'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle missing API_KEY environment variable', () => {
      delete process.env.API_KEY;

      mockRequest.headers = {
        'x-api-key': 'any_key'
      };

      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'API key authentication not configured'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('hybridAuth middleware', () => {
    beforeEach(() => {
      process.env.API_KEY = 'test_api_key';
    });

    it('should authenticate with valid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_jwt_token'
      };

      const mockVerifyResult = {
        valid: true,
        userId: 'user123',
        userData: { id: 'user123', name: 'Test User' }
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await hybridAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'user123',
        userData: { id: 'user123', name: 'Test User' }
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should authenticate with valid API key when JWT fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_jwt_token',
        'x-api-key': 'test_api_key'
      };

      const mockVerifyResult = {
        valid: false,
        error: 'Invalid JWT token'
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await hybridAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'api_key_user',
        type: 'api_key'
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should authenticate with API key only', async () => {
      mockRequest.headers = {
        'x-api-key': 'test_api_key'
      };

      await hybridAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'api_key_user',
        type: 'api_key'
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject when both JWT and API key are invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_jwt_token',
        'x-api-key': 'invalid_api_key'
      };

      const mockVerifyResult = {
        valid: false,
        error: 'Invalid JWT token'
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await hybridAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. Provide valid JWT token or API key.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject when no authentication is provided', async () => {
      await hybridAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required. Provide valid JWT token or API key.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalJwtAuth middleware', () => {
    it('should set user data with valid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_jwt_token'
      };

      const mockVerifyResult = {
        valid: true,
        userId: 'user123',
        userData: { id: 'user123', name: 'Test User' }
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await optionalJwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({
        id: 'user123',
        userData: { id: 'user123', name: 'Test User' }
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      await optionalJwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without authentication when invalid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };

      const mockVerifyResult = {
        valid: false,
        error: 'Invalid token'
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockResolvedValue(mockVerifyResult);
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await optionalJwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };

      const mockAuthService = new AuthService();
      (mockAuthService.verifyJWTToken as jest.Mock).mockRejectedValue(new Error('Service error'));
      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

      await optionalJwtAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});