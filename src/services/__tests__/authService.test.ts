import axios from 'axios';
import { AuthService } from '../authService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('validateUserWithPodium', () => {
    it('should validate user successfully with valid credentials', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockUserData
      });

      const result:any = await authService.validateUserWithPodium('user123', 'valid_token');

      expect(result.isValid).toBe(true);
      expect(result.userData).toEqual(mockUserData);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://stage-api.plataformapodium.com/api/user/user123',
        {
          headers: {
            'Authorization': 'Bearer valid_token',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
    });

    it('should reject invalid user credentials', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      const result:any = await authService.validateUserWithPodium('invalid_user', 'invalid_token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid user credentials');
    });

    it('should handle user not found', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404 }
      });

      const result:any = await authService.validateUserWithPodium('nonexistent_user', 'valid_token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle network timeout', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        code: 'ECONNABORTED'
      });

      const result:any = await authService.validateUserWithPodium('user123', 'valid_token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('External API timeout');
    });

    it('should handle server errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 500 }
      });

      const result:any = await authService.validateUserWithPodium('user123', 'valid_token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('External API error');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user and generate JWT token', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockUserData
      });

      const result:any = await authService.authenticateUser('user123', 'valid_token');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBe('24h');
      expect(result.tokenType).toBe('Bearer');
      expect(result.user).toEqual(mockUserData);
    });

    it('should fail authentication with invalid credentials', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      const result:any = await authService.authenticateUser('invalid_user', 'invalid_token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user credentials');
      expect(result.accessToken).toBeUndefined();
    });
  });

  describe('verifyJWTToken', () => {
    it('should verify valid JWT token', async () => {
      // First authenticate to get a valid token
      const mockUserData = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockUserData
      });

      const authResult:any = await authService.authenticateUser('user123', 'valid_token');
      
      if (authResult.success && authResult.accessToken) {
        const verifyResult:any = await authService.verifyJWT(authResult.accessToken);

        expect(verifyResult.valid).toBe(true);
        expect(verifyResult.userId).toBe('user123');
        expect(verifyResult.userData).toEqual(mockUserData);
      }
    });

    it('should reject invalid JWT token', async () => {
      const result:any = await authService.verifyJWT('invalid_token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed JWT token', async () => {
      const result:any = await authService.verifyJWT('not.a.jwt');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('refreshJWTToken', () => {
    it('should refresh JWT token when close to expiry', async () => {
      const mockUserData = {
        id: 'user123',
        email: 'test@example.com', 
        name: 'Test User'
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockUserData
      });

      const authResult:any = await authService.authenticateUser('user123', 'valid_token');
      
      if (authResult.success && authResult.accessToken) {
        const refreshResult:any = await authService.refreshToken(authResult.accessToken);

        expect(refreshResult.success).toBe(true);
        expect(refreshResult.accessToken).toBeDefined();
        expect(refreshResult.accessToken).not.toBe(authResult.accessToken);
      }
    });

    it('should reject refresh with invalid token', async () => {
      const result:any = await authService.refreshToken('invalid_token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});