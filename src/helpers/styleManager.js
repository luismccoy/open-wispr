/**
 * Style Manager - Maps applications to formality styles
 * 
 * Determines whether text should be formal (emails), casual (chat), or neutral
 * based on the target application.
 */

// Default app-to-style mappings
const DEFAULT_MAPPINGS = [
  // Email clients → Formal
  { id: 'default-mail', pattern: 'mail', style: 'formal', isDefault: true },
  { id: 'default-outlook', pattern: 'outlook', style: 'formal', isDefault: true },
  { id: 'default-gmail', pattern: 'gmail', style: 'formal', isDefault: true },
  { id: 'default-apple-mail', pattern: 'com.apple.mail', style: 'formal', isDefault: true },
  { id: 'default-ms-outlook', pattern: 'com.microsoft.outlook', style: 'formal', isDefault: true },
  { id: 'default-thunderbird', pattern: 'thunderbird', style: 'formal', isDefault: true },
  { id: 'default-superhuman', pattern: 'superhuman', style: 'formal', isDefault: true },
  
  // Chat/Messaging apps → Casual
  { id: 'default-slack', pattern: 'slack', style: 'casual', isDefault: true },
  { id: 'default-slack-bundle', pattern: 'com.tinyspeck.slackmacgap', style: 'casual', isDefault: true },
  { id: 'default-discord', pattern: 'discord', style: 'casual', isDefault: true },
  { id: 'default-messages', pattern: 'messages', style: 'casual', isDefault: true },
  { id: 'default-apple-messages', pattern: 'com.apple.MobileSMS', style: 'casual', isDefault: true },
  { id: 'default-whatsapp', pattern: 'whatsapp', style: 'casual', isDefault: true },
  { id: 'default-telegram', pattern: 'telegram', style: 'casual', isDefault: true },
  { id: 'default-signal', pattern: 'signal', style: 'casual', isDefault: true },
  { id: 'default-teams-chat', pattern: 'teams', style: 'casual', isDefault: true },
  { id: 'default-messenger', pattern: 'messenger', style: 'casual', isDefault: true },
  { id: 'default-chime', pattern: 'chime', style: 'casual', isDefault: true },
  
  // Professional/Docs → Neutral (preserve original tone)
  { id: 'default-notion', pattern: 'notion', style: 'neutral', isDefault: true },
  { id: 'default-docs', pattern: 'docs', style: 'neutral', isDefault: true },
  { id: 'default-word', pattern: 'word', style: 'neutral', isDefault: true },
  { id: 'default-pages', pattern: 'pages', style: 'neutral', isDefault: true },
];

class StyleManager {
  constructor() {
    this.mappings = [];
    this.defaultStyle = 'neutral';
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      // Load default style
      const savedDefault = localStorage.getItem('contextAware.defaultStyle');
      if (savedDefault && ['formal', 'casual', 'neutral'].includes(savedDefault)) {
        this.defaultStyle = savedDefault;
      }

      // Load custom mappings
      const savedMappings = localStorage.getItem('contextAware.customMappings');
      const customMappings = savedMappings ? JSON.parse(savedMappings) : [];

      // Combine defaults with custom (custom takes precedence)
      this.mappings = [...DEFAULT_MAPPINGS, ...customMappings];
    } catch (error) {
      console.warn('[StyleManager] Failed to load settings:', error);
      this.mappings = [...DEFAULT_MAPPINGS];
    }
  }

  /**
   * Save custom mappings to localStorage
   */
  saveCustomMappings() {
    const customMappings = this.mappings.filter(m => !m.isDefault);
    localStorage.setItem('contextAware.customMappings', JSON.stringify(customMappings));
  }

  /**
   * Get the formality style for an application context
   * @param {AppContext} context - The detected app context
   * @returns {string} - 'formal', 'casual', or 'neutral'
   */
  getStyleForApp(context) {
    if (!context || !context.appName) {
      return this.defaultStyle;
    }

    const appName = context.appName.toLowerCase();
    const bundleId = (context.bundleId || '').toLowerCase();

    // Check mappings (custom mappings are at the end, so they override defaults)
    for (let i = this.mappings.length - 1; i >= 0; i--) {
      const mapping = this.mappings[i];
      const pattern = mapping.pattern.toLowerCase();

      // Check if pattern matches app name or bundle ID
      if (this.matchesPattern(appName, pattern) || 
          this.matchesPattern(bundleId, pattern)) {
        return mapping.style;
      }
    }

    return this.defaultStyle;
  }

  /**
   * Check if a value matches a pattern (supports wildcards)
   */
  matchesPattern(value, pattern) {
    if (!value || !pattern) return false;

    // Convert wildcard pattern to regex
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
        .replace(/\*/g, '.*'); // Convert * to .*
      return new RegExp(regexPattern, 'i').test(value);
    }

    // Simple contains check
    return value.includes(pattern);
  }

  /**
   * Get all mappings
   */
  getMappings() {
    return [...this.mappings];
  }

  /**
   * Get only custom (user-defined) mappings
   */
  getCustomMappings() {
    return this.mappings.filter(m => !m.isDefault);
  }

  /**
   * Get only default mappings
   */
  getDefaultMappings() {
    return this.mappings.filter(m => m.isDefault);
  }

  /**
   * Add a custom mapping
   */
  addMapping(pattern, style) {
    const id = `custom-${Date.now()}`;
    const mapping = {
      id,
      pattern,
      style,
      isDefault: false
    };
    this.mappings.push(mapping);
    this.saveCustomMappings();
    return mapping;
  }

  /**
   * Remove a mapping by ID
   */
  removeMapping(id) {
    const index = this.mappings.findIndex(m => m.id === id);
    if (index !== -1 && !this.mappings[index].isDefault) {
      this.mappings.splice(index, 1);
      this.saveCustomMappings();
      return true;
    }
    return false;
  }

  /**
   * Update a mapping
   */
  updateMapping(id, updates) {
    const mapping = this.mappings.find(m => m.id === id);
    if (mapping && !mapping.isDefault) {
      Object.assign(mapping, updates);
      this.saveCustomMappings();
      return mapping;
    }
    return null;
  }

  /**
   * Get the default style for unmapped apps
   */
  getDefaultStyle() {
    return this.defaultStyle;
  }

  /**
   * Set the default style
   */
  setDefaultStyle(style) {
    if (['formal', 'casual', 'neutral'].includes(style)) {
      this.defaultStyle = style;
      localStorage.setItem('contextAware.defaultStyle', style);
    }
  }

  /**
   * Reset to system defaults
   */
  resetToDefaults() {
    this.mappings = [...DEFAULT_MAPPINGS];
    this.defaultStyle = 'neutral';
    localStorage.removeItem('contextAware.customMappings');
    localStorage.setItem('contextAware.defaultStyle', 'neutral');
  }

  /**
   * Export mappings as JSON
   */
  exportMappings() {
    return JSON.stringify(this.getCustomMappings(), null, 2);
  }

  /**
   * Import mappings from JSON
   */
  importMappings(json) {
    try {
      const imported = JSON.parse(json);
      if (!Array.isArray(imported)) {
        return { success: false, imported: 0, errors: ['Invalid format: expected array'] };
      }

      const errors = [];
      let count = 0;

      for (const item of imported) {
        if (!item.pattern || !item.style) {
          errors.push(`Invalid mapping: missing pattern or style`);
          continue;
        }
        if (!['formal', 'casual', 'neutral'].includes(item.style)) {
          errors.push(`Invalid style: ${item.style}`);
          continue;
        }
        this.addMapping(item.pattern, item.style);
        count++;
      }

      return { success: true, imported: count, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [error.message] };
    }
  }

  /**
   * Check if context-aware styling is enabled
   */
  isEnabled() {
    return localStorage.getItem('contextAware.enabled') !== 'false';
  }

  /**
   * Enable/disable context-aware styling
   */
  setEnabled(enabled) {
    localStorage.setItem('contextAware.enabled', String(enabled));
  }
}

// Singleton instance
const styleManager = new StyleManager();

export default styleManager;
export { StyleManager, DEFAULT_MAPPINGS };
