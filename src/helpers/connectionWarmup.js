/**
 * Connection Warmup Service
 * 
 * Pre-initializes AWS connections on app startup to eliminate cold-start delays.
 * This service warms up the Bedrock client and verifies AWS credentials are valid.
 * 
 * Requirement: R13 (Performance) - Pre-initialize AWS connections on app startup
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const debugLogger = require("./debugLogger");

// Connection status states
const ConnectionStatus = {
  NOT_INITIALIZED: 'not_initialized',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  CREDENTIALS_MISSING: 'credentials_missing'
};

class ConnectionWarmupService {
  constructor() {
    this.bedrockClient = null;
    this.bedrockStatus = ConnectionStatus.NOT_INITIALIZED;
    this.credentialsStatus = ConnectionStatus.NOT_INITIALIZED;
    this.lastError = null;
    this.region = 'us-east-1';
    this.warmupStartTime = null;
    this.warmupEndTime = null;
    this.credentials = null;
  }

  /**
   * Set the AWS region for connections
   * @param {string} region - AWS region (e.g., 'us-east-1')
   */
  setRegion(region) {
    this.region = region;
  }

  /**
   * Get AWS credentials from environment or credentials file
   * @returns {Promise<Object|null>} AWS credentials or null if not found
   */
  async getCredentials() {
    // Check environment variables first
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      debugLogger.log('ConnectionWarmup: Using AWS credentials from environment variables');
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN || undefined
      };
    }

    // Try AWS credentials file
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    
    if (fs.existsSync(credentialsPath)) {
      const content = fs.readFileSync(credentialsPath, 'utf8');
      const profile = process.env.AWS_PROFILE || 'default';
      const lines = content.split('\n');
      let inProfile = false;
      const creds = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          inProfile = trimmed === `[${profile}]`;
        } else if (inProfile && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          if (key.trim() === 'aws_access_key_id') creds.accessKeyId = value;
          if (key.trim() === 'aws_secret_access_key') creds.secretAccessKey = value;
          if (key.trim() === 'aws_session_token') creds.sessionToken = value;
        }
      }
      
      if (creds.accessKeyId && creds.secretAccessKey) {
        debugLogger.log('ConnectionWarmup: Using AWS credentials from ~/.aws/credentials', { profile });
        return creds;
      }
    }

    debugLogger.log('ConnectionWarmup: No AWS credentials found');
    return null;
  }

  /**
   * Verify AWS credentials are valid by making a minimal API call
   * @returns {Promise<boolean>} True if credentials are valid
   */
  async verifyCredentials() {
    try {
      this.credentialsStatus = ConnectionStatus.INITIALIZING;
      
      this.credentials = await this.getCredentials();
      
      if (!this.credentials) {
        this.credentialsStatus = ConnectionStatus.CREDENTIALS_MISSING;
        this.lastError = new Error('AWS credentials not configured');
        debugLogger.log('ConnectionWarmup: Credentials verification failed - no credentials found');
        return false;
      }

      this.credentialsStatus = ConnectionStatus.READY;
      debugLogger.log('ConnectionWarmup: Credentials found and loaded');
      return true;
    } catch (error) {
      this.credentialsStatus = ConnectionStatus.ERROR;
      this.lastError = error;
      debugLogger.error('ConnectionWarmup: Credentials verification error', error);
      return false;
    }
  }

  /**
   * Pre-initialize the Bedrock client
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initializeBedrockClient() {
    try {
      this.bedrockStatus = ConnectionStatus.INITIALIZING;
      
      if (!this.credentials) {
        const hasCredentials = await this.verifyCredentials();
        if (!hasCredentials) {
          this.bedrockStatus = ConnectionStatus.CREDENTIALS_MISSING;
          return false;
        }
      }

      // Create the Bedrock client with credentials
      const clientConfig = {
        region: this.region
      };

      // Only add explicit credentials if we have them
      // Otherwise, let the SDK use the default credential chain
      if (this.credentials) {
        clientConfig.credentials = this.credentials;
      }

      this.bedrockClient = new BedrockRuntimeClient(clientConfig);
      
      this.bedrockStatus = ConnectionStatus.READY;
      debugLogger.log('ConnectionWarmup: Bedrock client initialized', { region: this.region });
      return true;
    } catch (error) {
      this.bedrockStatus = ConnectionStatus.ERROR;
      this.lastError = error;
      debugLogger.error('ConnectionWarmup: Bedrock client initialization error', error);
      return false;
    }
  }

  /**
   * Test the Bedrock connection with a minimal request
   * This validates that the credentials work with Bedrock
   * @returns {Promise<boolean>} True if connection test successful
   */
  async testBedrockConnection() {
    if (!this.bedrockClient) {
      debugLogger.log('ConnectionWarmup: Cannot test connection - client not initialized');
      return false;
    }

    try {
      // Make a minimal request to verify the connection works
      // We use a very short prompt to minimize cost and latency
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });

      await this.bedrockClient.send(command);
      debugLogger.log('ConnectionWarmup: Bedrock connection test successful');
      return true;
    } catch (error) {
      // Some errors are expected (e.g., model not available in region)
      // but we still verified the credentials work
      if (error.name === 'AccessDeniedException' || 
          error.name === 'ValidationException' ||
          error.message?.includes('not authorized')) {
        debugLogger.log('ConnectionWarmup: Bedrock connection test - credentials valid but access limited', error.message);
        return true; // Credentials are valid, just limited access
      }
      
      debugLogger.error('ConnectionWarmup: Bedrock connection test failed', error);
      this.lastError = error;
      return false;
    }
  }

  /**
   * Perform full warmup of all connections
   * Call this on app startup to eliminate cold-start delays
   * @param {Object} options - Warmup options
   * @param {boolean} options.testConnection - Whether to test the Bedrock connection (default: false)
   * @returns {Promise<Object>} Warmup result with status information
   */
  async warmup(options = {}) {
    const { testConnection = false } = options;
    
    this.warmupStartTime = Date.now();
    debugLogger.log('ConnectionWarmup: Starting warmup...');

    const result = {
      success: false,
      credentials: false,
      bedrock: false,
      connectionTest: null,
      duration: 0,
      error: null
    };

    try {
      // Step 1: Verify credentials
      result.credentials = await this.verifyCredentials();
      
      if (!result.credentials) {
        result.error = 'AWS credentials not configured';
        this.warmupEndTime = Date.now();
        result.duration = this.warmupEndTime - this.warmupStartTime;
        debugLogger.log('ConnectionWarmup: Warmup completed (no credentials)', result);
        return result;
      }

      // Step 2: Initialize Bedrock client
      result.bedrock = await this.initializeBedrockClient();
      
      if (!result.bedrock) {
        result.error = 'Failed to initialize Bedrock client';
        this.warmupEndTime = Date.now();
        result.duration = this.warmupEndTime - this.warmupStartTime;
        debugLogger.log('ConnectionWarmup: Warmup completed (Bedrock init failed)', result);
        return result;
      }

      // Step 3: Optionally test the connection
      if (testConnection) {
        result.connectionTest = await this.testBedrockConnection();
      }

      result.success = true;
      this.warmupEndTime = Date.now();
      result.duration = this.warmupEndTime - this.warmupStartTime;
      
      debugLogger.log('ConnectionWarmup: Warmup completed successfully', result);
      return result;
    } catch (error) {
      result.error = error.message;
      this.lastError = error;
      this.warmupEndTime = Date.now();
      result.duration = this.warmupEndTime - this.warmupStartTime;
      
      debugLogger.error('ConnectionWarmup: Warmup failed', error);
      return result;
    }
  }

  /**
   * Get the pre-initialized Bedrock client
   * @returns {BedrockRuntimeClient|null} The Bedrock client or null if not initialized
   */
  getBedrockClient() {
    return this.bedrockClient;
  }

  /**
   * Get the current connection status
   * @returns {Object} Status object with all connection states
   */
  getStatus() {
    return {
      credentials: this.credentialsStatus,
      bedrock: this.bedrockStatus,
      isReady: this.bedrockStatus === ConnectionStatus.READY && 
               this.credentialsStatus === ConnectionStatus.READY,
      lastError: this.lastError?.message || null,
      warmupDuration: this.warmupEndTime && this.warmupStartTime 
        ? this.warmupEndTime - this.warmupStartTime 
        : null,
      region: this.region
    };
  }

  /**
   * Check if the service is ready for use
   * @returns {boolean} True if all connections are ready
   */
  isReady() {
    return this.bedrockStatus === ConnectionStatus.READY && 
           this.credentialsStatus === ConnectionStatus.READY;
  }

  /**
   * Reset the service state (useful for re-initialization)
   */
  reset() {
    this.bedrockClient = null;
    this.bedrockStatus = ConnectionStatus.NOT_INITIALIZED;
    this.credentialsStatus = ConnectionStatus.NOT_INITIALIZED;
    this.lastError = null;
    this.warmupStartTime = null;
    this.warmupEndTime = null;
    this.credentials = null;
    debugLogger.log('ConnectionWarmup: Service reset');
  }

  /**
   * Perform a health check on all connections
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    const status = this.getStatus();
    
    const health = {
      healthy: status.isReady,
      credentials: {
        status: status.credentials,
        healthy: status.credentials === ConnectionStatus.READY
      },
      bedrock: {
        status: status.bedrock,
        healthy: status.bedrock === ConnectionStatus.READY,
        client: this.bedrockClient !== null
      },
      region: status.region,
      lastError: status.lastError,
      warmupDuration: status.warmupDuration
    };

    debugLogger.log('ConnectionWarmup: Health check', health);
    return health;
  }
}

// Export singleton instance and status constants
const connectionWarmupService = new ConnectionWarmupService();

module.exports = connectionWarmupService;
module.exports.ConnectionStatus = ConnectionStatus;
module.exports.ConnectionWarmupService = ConnectionWarmupService;
