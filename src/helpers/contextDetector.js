/**
 * Context Detector - Detects the currently active application
 * 
 * Used to determine which formality style to apply based on where
 * the user is pasting text (email = formal, Slack = casual, etc.)
 */

class ContextDetector {
  constructor() {
    this.platform = process.platform || 'darwin';
    this.lastContext = null;
    this.detectionCache = new Map();
    this.cacheTimeout = 1000; // Cache for 1 second
  }

  /**
   * Detect the currently active application
   * @returns {Promise<AppContext>}
   */
  async detectActiveApp() {
    try {
      // Check cache first for rapid successive calls
      const cached = this.getCachedContext();
      if (cached) return cached;

      // Use IPC to get active app from main process
      const context = await window.electronAPI?.getActiveAppContext?.();
      
      if (context) {
        this.cacheContext(context);
        this.lastContext = context;
        return context;
      }

      // Fallback to unknown
      return this.getUnknownContext();
    } catch (error) {
      console.warn('[ContextDetector] Detection failed:', error);
      return this.getUnknownContext();
    }
  }

  /**
   * Get cached context if still valid
   */
  getCachedContext() {
    const cached = this.detectionCache.get('current');
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.context;
    }
    return null;
  }

  /**
   * Cache context for rapid access
   */
  cacheContext(context) {
    this.detectionCache.set('current', {
      context,
      timestamp: Date.now()
    });
  }

  /**
   * Get unknown context fallback
   */
  getUnknownContext() {
    return {
      appName: 'Unknown',
      bundleId: null,
      executablePath: null,
      windowTitle: null,
      platform: this.platform
    };
  }

  /**
   * Check if context detection is supported
   */
  isSupported() {
    return this.platform === 'darwin' || this.platform === 'win32';
  }

  /**
   * Get the last detected context
   */
  getLastContext() {
    return this.lastContext || this.getUnknownContext();
  }

  /**
   * Clear detection cache
   */
  clearCache() {
    this.detectionCache.clear();
  }
}

// Singleton instance
const contextDetector = new ContextDetector();

export default contextDetector;
export { ContextDetector };
