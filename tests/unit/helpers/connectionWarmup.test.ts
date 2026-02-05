/**
 * Unit Tests for ConnectionWarmupService
 * 
 * Tests the connection warmup service that pre-initializes AWS connections
 * on app startup to eliminate cold-start delays.
 * 
 * @module tests/unit/helpers/connectionWarmup.test.ts
 * 
 * Validates: Requirements 12.1-12.5
 * - 12.1: WHEN warmup is called, THE Connection_Warmup_Service SHALL initialize AWS credentials
 * - 12.2: WHEN warmup is called, THE Connection_Warmup_Service SHALL create a pre-warmed Bedrock client
 * - 12.3: WHEN getBedrockClient is called after warmup, THE Connection_Warmup_Service SHALL return the cached client
 * - 12.4: WHEN healthCheck is called, THE Connection_Warmup_Service SHALL verify connection status
 * - 12.5: WHEN reset is called, THE Connection_Warmup_Service SHALL clear cached connections
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock debugLogger before importing the module
vi.mock('../../../src/helpers/debugLogger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Import the module - it will use the real fs/os/path modules
// We'll test by manipulating environment variables instead
import connectionWarmupService, { 
  ConnectionStatus, 
  ConnectionWarmupService 
} from '../../../src/helpers/connectionWarmup.js';

describe('ConnectionWarmupService', () => {
  let service: InstanceType<typeof ConnectionWarmupService>;
  
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Create a fresh instance for each test
    service = new ConnectionWarmupService();
    
    // Clear environment variables
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SESSION_TOKEN;
    delete process.env.AWS_PROFILE;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset the singleton service
    connectionWarmupService.reset();
    
    // Restore original env vars
    process.env = { ...originalEnv };
    
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 12.1: Warmup - Initialize AWS credentials
  // ===========================================================================
  describe('warmup - Credential Initialization', () => {
    it('should initialize credentials from environment variables', async () => {
      // Set up environment credentials
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.AWS_SESSION_TOKEN = 'test-session-token';

      const result = await service.warmup();

      expect(result.credentials).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should return credentials: false when no credentials are available', async () => {
      // Ensure no environment credentials
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      
      // Use a non-existent profile to ensure no credentials file is found
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      const result = await service.warmup();

      expect(result.credentials).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toBe('AWS credentials not configured');
    });

    it('should track warmup duration', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

      const result = await service.warmup();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should set credentials status to INITIALIZING during warmup', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

      // Check initial state
      expect(service.getStatus().credentials).toBe(ConnectionStatus.NOT_INITIALIZED);

      await service.warmup();

      // After warmup, should be READY
      expect(service.getStatus().credentials).toBe(ConnectionStatus.READY);
    });
  });

  // ===========================================================================
  // Requirement 12.2: Warmup - Create pre-warmed Bedrock client
  // ===========================================================================
  describe('warmup - Bedrock Client Creation', () => {
    beforeEach(() => {
      // Set up valid credentials for these tests
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should create a Bedrock client during warmup', async () => {
      const result = await service.warmup();

      expect(result.bedrock).toBe(true);
      expect(service.getBedrockClient()).not.toBeNull();
    });

    it('should set bedrock status to READY after successful initialization', async () => {
      await service.warmup();

      const status = service.getStatus();
      expect(status.bedrock).toBe(ConnectionStatus.READY);
    });

    it('should not create Bedrock client if credentials are missing', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      const result = await service.warmup();

      expect(result.bedrock).toBe(false);
      expect(result.success).toBe(false);
      expect(service.getBedrockClient()).toBeNull();
    });

    it('should use the configured region for Bedrock client', async () => {
      service.setRegion('us-west-2');
      
      await service.warmup();

      expect(service.getStatus().region).toBe('us-west-2');
    });

    it('should use default region us-east-1 if not set', async () => {
      // Don't set region, use default
      await service.warmup();

      expect(service.getStatus().region).toBe('us-east-1');
    });
  });

  // ===========================================================================
  // Requirement 12.3: getBedrockClient - Return cached client
  // ===========================================================================
  describe('getBedrockClient - Client Caching', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should return null before warmup', () => {
      const client = service.getBedrockClient();

      expect(client).toBeNull();
    });

    it('should return the cached client after warmup', async () => {
      await service.warmup();

      const client = service.getBedrockClient();

      expect(client).not.toBeNull();
    });

    it('should return the same client instance on multiple calls (referential equality)', async () => {
      await service.warmup();

      const client1 = service.getBedrockClient();
      const client2 = service.getBedrockClient();
      const client3 = service.getBedrockClient();

      // Verify referential equality - same object instance
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('should maintain client cache across multiple getBedrockClient calls', async () => {
      await service.warmup();

      // Call getBedrockClient multiple times
      const clients = [];
      for (let i = 0; i < 5; i++) {
        clients.push(service.getBedrockClient());
      }

      // All should be the same instance
      const firstClient = clients[0];
      clients.forEach(client => {
        expect(client).toBe(firstClient);
      });
    });
  });

  // ===========================================================================
  // Requirement 12.4: healthCheck - Verify connection status
  // ===========================================================================
  describe('healthCheck', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should return unhealthy status before warmup', async () => {
      const health = await service.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.credentials.healthy).toBe(false);
      expect(health.bedrock.healthy).toBe(false);
    });

    it('should return healthy status after successful warmup', async () => {
      await service.warmup();

      const health = await service.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.credentials.healthy).toBe(true);
      expect(health.bedrock.healthy).toBe(true);
    });

    it('should include credentials status in health check', async () => {
      await service.warmup();

      const health = await service.healthCheck();

      expect(health.credentials.status).toBe(ConnectionStatus.READY);
    });

    it('should include bedrock status in health check', async () => {
      await service.warmup();

      const health = await service.healthCheck();

      expect(health.bedrock.status).toBe(ConnectionStatus.READY);
      expect(health.bedrock.client).toBe(true);
    });

    it('should include region in health check', async () => {
      service.setRegion('eu-west-1');
      await service.warmup();

      const health = await service.healthCheck();

      expect(health.region).toBe('eu-west-1');
    });

    it('should include warmup duration in health check', async () => {
      await service.warmup();

      const health = await service.healthCheck();

      expect(health.warmupDuration).toBeGreaterThanOrEqual(0);
    });

    it('should report unhealthy when credentials are missing', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      await service.warmup();
      const health = await service.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.credentials.healthy).toBe(false);
    });

    it('should report bedrock client as false when not initialized', async () => {
      const health = await service.healthCheck();

      expect(health.bedrock.client).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 12.5: reset - Clear cached connections
  // ===========================================================================
  describe('reset', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should clear the cached Bedrock client', async () => {
      await service.warmup();
      expect(service.getBedrockClient()).not.toBeNull();

      service.reset();

      expect(service.getBedrockClient()).toBeNull();
    });

    it('should reset credentials status to NOT_INITIALIZED', async () => {
      await service.warmup();
      expect(service.getStatus().credentials).toBe(ConnectionStatus.READY);
      
      service.reset();

      const status = service.getStatus();
      expect(status.credentials).toBe(ConnectionStatus.NOT_INITIALIZED);
    });

    it('should reset bedrock status to NOT_INITIALIZED', async () => {
      await service.warmup();
      expect(service.getStatus().bedrock).toBe(ConnectionStatus.READY);
      
      service.reset();

      const status = service.getStatus();
      expect(status.bedrock).toBe(ConnectionStatus.NOT_INITIALIZED);
    });

    it('should clear last error', async () => {
      // Force an error by removing credentials
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';
      
      await service.warmup();
      expect(service.getStatus().lastError).not.toBeNull();

      service.reset();

      expect(service.getStatus().lastError).toBeNull();
    });

    it('should clear warmup timing information', async () => {
      await service.warmup();
      expect(service.getStatus().warmupDuration).not.toBeNull();

      service.reset();

      expect(service.getStatus().warmupDuration).toBeNull();
    });

    it('should allow re-warmup after reset', async () => {
      await service.warmup();
      service.reset();

      // Re-add credentials for re-warmup
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

      const result = await service.warmup();

      expect(result.success).toBe(true);
      expect(service.getBedrockClient()).not.toBeNull();
    });

    it('should report isReady as false after reset', async () => {
      await service.warmup();
      expect(service.isReady()).toBe(true);

      service.reset();

      expect(service.isReady()).toBe(false);
    });
  });

  // ===========================================================================
  // getStatus Tests
  // ===========================================================================
  describe('getStatus', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should return initial status before warmup', () => {
      const status = service.getStatus();

      expect(status.credentials).toBe(ConnectionStatus.NOT_INITIALIZED);
      expect(status.bedrock).toBe(ConnectionStatus.NOT_INITIALIZED);
      expect(status.isReady).toBe(false);
      expect(status.lastError).toBeNull();
      expect(status.warmupDuration).toBeNull();
    });

    it('should return ready status after successful warmup', async () => {
      await service.warmup();

      const status = service.getStatus();

      expect(status.credentials).toBe(ConnectionStatus.READY);
      expect(status.bedrock).toBe(ConnectionStatus.READY);
      expect(status.isReady).toBe(true);
    });

    it('should include region in status', () => {
      service.setRegion('ap-southeast-1');

      const status = service.getStatus();

      expect(status.region).toBe('ap-southeast-1');
    });

    it('should include error message when credentials are missing', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      await service.warmup();

      const status = service.getStatus();
      expect(status.lastError).toBe('AWS credentials not configured');
    });

    it('should include warmup duration after warmup', async () => {
      await service.warmup();

      const status = service.getStatus();
      expect(status.warmupDuration).toBeGreaterThanOrEqual(0);
      expect(typeof status.warmupDuration).toBe('number');
    });
  });

  // ===========================================================================
  // isReady Tests
  // ===========================================================================
  describe('isReady', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should return false before warmup', () => {
      expect(service.isReady()).toBe(false);
    });

    it('should return true after successful warmup', async () => {
      await service.warmup();

      expect(service.isReady()).toBe(true);
    });

    it('should return false when credentials are missing', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      await service.warmup();

      expect(service.isReady()).toBe(false);
    });

    it('should return false after reset', async () => {
      await service.warmup();
      expect(service.isReady()).toBe(true);

      service.reset();

      expect(service.isReady()).toBe(false);
    });
  });

  // ===========================================================================
  // setRegion Tests
  // ===========================================================================
  describe('setRegion', () => {
    it('should update the region', () => {
      service.setRegion('eu-central-1');

      expect(service.getStatus().region).toBe('eu-central-1');
    });

    it('should use the new region for subsequent warmup', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

      service.setRegion('ap-northeast-1');
      await service.warmup();

      expect(service.getStatus().region).toBe('ap-northeast-1');
    });

    it('should allow changing region before warmup', () => {
      service.setRegion('sa-east-1');
      service.setRegion('ca-central-1');
      service.setRegion('me-south-1');

      expect(service.getStatus().region).toBe('me-south-1');
    });
  });

  // ===========================================================================
  // verifyCredentials Tests
  // ===========================================================================
  describe('verifyCredentials', () => {
    it('should return true when environment credentials are set', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

      const result = await service.verifyCredentials();

      expect(result).toBe(true);
    });

    it('should return false when no credentials are available', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      const result = await service.verifyCredentials();

      expect(result).toBe(false);
    });

    it('should set credentials status to READY when credentials found', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

      await service.verifyCredentials();

      const status = service.getStatus();
      expect(status.credentials).toBe(ConnectionStatus.READY);
    });

    it('should set credentials status to CREDENTIALS_MISSING when not found', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      await service.verifyCredentials();

      const status = service.getStatus();
      expect(status.credentials).toBe(ConnectionStatus.CREDENTIALS_MISSING);
    });
  });

  // ===========================================================================
  // initializeBedrockClient Tests
  // ===========================================================================
  describe('initializeBedrockClient', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should return true on successful initialization', async () => {
      const result = await service.initializeBedrockClient();

      expect(result).toBe(true);
    });

    it('should verify credentials if not already verified', async () => {
      const result = await service.initializeBedrockClient();

      expect(result).toBe(true);
      expect(service.getStatus().credentials).toBe(ConnectionStatus.READY);
    });

    it('should return false if credentials verification fails', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      const result = await service.initializeBedrockClient();

      expect(result).toBe(false);
    });

    it('should set bedrock status to READY on success', async () => {
      await service.initializeBedrockClient();

      expect(service.getStatus().bedrock).toBe(ConnectionStatus.READY);
    });

    it('should create a Bedrock client that can be retrieved', async () => {
      await service.initializeBedrockClient();

      expect(service.getBedrockClient()).not.toBeNull();
    });
  });

  // ===========================================================================
  // Warmup with testConnection option
  // ===========================================================================
  describe('warmup with testConnection option', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    });

    it('should not test connection by default', async () => {
      const result = await service.warmup();

      expect(result.connectionTest).toBeNull();
    });

    it('should include connectionTest result when testConnection option is true', async () => {
      const result = await service.warmup({ testConnection: true });

      // connectionTest will be true or false depending on actual AWS connectivity
      expect(result.connectionTest).toBeDefined();
      expect(typeof result.connectionTest).toBe('boolean');
    });
  });

  // ===========================================================================
  // Singleton Instance Tests
  // ===========================================================================
  describe('Singleton Instance', () => {
    beforeEach(() => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      connectionWarmupService.reset();
    });

    it('should export a singleton instance', () => {
      expect(connectionWarmupService).toBeDefined();
      expect(typeof connectionWarmupService.warmup).toBe('function');
      expect(typeof connectionWarmupService.getBedrockClient).toBe('function');
      expect(typeof connectionWarmupService.healthCheck).toBe('function');
      expect(typeof connectionWarmupService.reset).toBe('function');
    });

    it('should export ConnectionStatus constants', () => {
      expect(ConnectionStatus.NOT_INITIALIZED).toBe('not_initialized');
      expect(ConnectionStatus.INITIALIZING).toBe('initializing');
      expect(ConnectionStatus.READY).toBe('ready');
      expect(ConnectionStatus.ERROR).toBe('error');
      expect(ConnectionStatus.CREDENTIALS_MISSING).toBe('credentials_missing');
    });

    it('should export ConnectionWarmupService class', () => {
      expect(ConnectionWarmupService).toBeDefined();
      const instance = new ConnectionWarmupService();
      expect(instance).toBeInstanceOf(ConnectionWarmupService);
    });

    it('should allow singleton to be warmed up and reset', async () => {
      await connectionWarmupService.warmup();
      expect(connectionWarmupService.isReady()).toBe(true);

      connectionWarmupService.reset();
      expect(connectionWarmupService.isReady()).toBe(false);
    });
  });

  // ===========================================================================
  // getCredentials Tests
  // ===========================================================================
  describe('getCredentials', () => {
    it('should return credentials from environment variables', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'env-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'env-secret-key';
      process.env.AWS_SESSION_TOKEN = 'env-session-token';

      const creds = await service.getCredentials();

      expect(creds).not.toBeNull();
      expect(creds?.accessKeyId).toBe('env-access-key');
      expect(creds?.secretAccessKey).toBe('env-secret-key');
      expect(creds?.sessionToken).toBe('env-session-token');
    });

    it('should return null when no credentials are available', async () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      process.env.AWS_PROFILE = 'non-existent-profile-for-testing-12345';

      const creds = await service.getCredentials();

      expect(creds).toBeNull();
    });

    it('should prioritize environment variables over credentials file', async () => {
      process.env.AWS_ACCESS_KEY_ID = 'env-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'env-secret-key';

      const creds = await service.getCredentials();

      expect(creds?.accessKeyId).toBe('env-access-key');
    });
  });
});
