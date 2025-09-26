import request from 'supertest';
import express from 'express';
import { login, verify, refresh, logout } from '../authController';

// Create test app
const app = express();
app.use(express.json());
app.post('/login', login);
app.get('/verify', verify);
app.post('/refresh', refresh);
app.post('/logout', logout);

// Mock authService
jest.mock('../authController', () => {
  const originalModule = jest.requireActual('../authController');
  return {
    ...originalModule,
    // We'll override specific functions as needed in tests
  };
});

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockAuthResult = {
        success: true,
        accessToken: 'mock_jwt_token',
        expiresIn: '24h',
        tokenType: 'Bearer',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      // Mock the authService.authenticateUser method
      const mockAuthenticateUser = jest.fn().mockResolvedValue(mockAuthResult);
      
      jest.doMock('../../services/authService', () => ({
        AuthService: jest.fn().mockImplementation(() => ({
          authenticateUser: mockAuthenticateUser
        }))
      }));

      const response = await request(app)
        .post('/login')
        .send({
          userId: 'user123',
          token: 'valid_podium_token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          userId: 'user123'
          // missing token
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should reject login with invalid credentials', async () => {
      const mockAuthResult = {
        success: false,
        error: 'Invalid user credentials'
      };

      const mockAuthenticateUser = jest.fn().mockResolvedValue(mockAuthResult);
      
      jest.doMock('../../services/authService', () => ({
        AuthService: jest.fn().mockImplementation(() => ({
          authenticateUser: mockAuthenticateUser
        }))
      }));

      const response = await request(app)
        .post('/login')
        .send({
          userId: 'invalid_user',
          token: 'invalid_token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid user credentials');
    });

    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post('/login')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /verify', () => {
    it('should verify valid JWT token', async () => {
      const mockVerifyResult = {
        valid: true,
        userId: 'user123',
        expiresIn: 86400,
        userData: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      const mockVerifyJWTToken = jest.fn().mockResolvedValue(mockVerifyResult);
      
      jest.doMock('../../services/authService', () => ({
        AuthService: jest.fn().mockImplementation(() => ({
          verifyJWTToken: mockVerifyJWTToken
        }))
      }));

      const response = await request(app)
        .get('/verify')
        .set('Authorization', 'Bearer valid_jwt_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authorization header required');
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/verify')
        .set('Authorization', 'InvalidHeader');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid authorization format');
    });

    it('should reject invalid JWT token', async () => {
      const mockVerifyResult = {
        valid: false,
        error: 'Invalid token'
      };

      const mockVerifyJWTToken = jest.fn().mockResolvedValue(mockVerifyResult);
      
      jest.doMock('../../services/authService', () => ({
        AuthService: jest.fn().mockImplementation(() => ({
          verifyJWTToken: mockVerifyJWTToken
        }))
      }));

      const response = await request(app)
        .get('/verify')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /refresh', () => {
    it('should refresh valid JWT token', async () => {
      const mockRefreshResult = {
        success: true,
        accessToken: 'new_jwt_token',
        expiresIn: '24h',
        tokenType: 'Bearer'
      };

      const mockRefreshJWTToken = jest.fn().mockResolvedValue(mockRefreshResult);
      
      jest.doMock('../../services/authService', () => ({
        AuthService: jest.fn().mockImplementation(() => ({
          refreshJWTToken: mockRefreshJWTToken
        }))
      }));

      const response = await request(app)
        .post('/refresh')
        .set('Authorization', 'Bearer valid_jwt_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject refresh without authorization header', async () => {
      const response = await request(app)
        .post('/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authorization header required');
    });

    it('should reject refresh with invalid token', async () => {
      const mockRefreshResult = {
        success: false,
        error: 'Invalid token for refresh'
      };

      const mockRefreshJWTToken = jest.fn().mockResolvedValue(mockRefreshResult);
      
      jest.doMock('../../services/authService', () => ({
        AuthService: jest.fn().mockImplementation(() => ({
          refreshJWTToken: mockRefreshJWTToken
        }))
      }));

      const response = await request(app)
        .post('/refresh')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', 'Bearer valid_jwt_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should allow logout even without authorization header', async () => {
      const response = await request(app)
        .post('/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });
  });
});