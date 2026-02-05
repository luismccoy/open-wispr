/**
 * Unit Tests for StyleManager
 * 
 * Tests the style manager that maps applications to formality styles
 * (formal, casual, neutral) based on the target application context.
 * 
 * @module tests/unit/helpers/styleManager.test.ts
 * 
 * Validates: Requirements 9.1-9.7
 * - 9.1: WHEN getStyleForApp is called with an email app context, THE Style_Manager SHALL return 'formal'
 * - 9.2: WHEN getStyleForApp is called with a chat app context, THE Style_Manager SHALL return 'casual'
 * - 9.3: WHEN getStyleForApp is called with an unknown app context, THE Style_Manager SHALL return the default style
 * - 9.4: WHEN a custom mapping is added, THE Style_Manager SHALL persist it to localStorage
 * - 9.5: WHEN a custom mapping is removed, THE Style_Manager SHALL remove it from localStorage
 * - 9.6: WHEN mappings are exported, THE Style_Manager SHALL return valid JSON
 * - 9.7: WHEN valid mappings are imported, THE Style_Manager SHALL add them to the mapping list
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import styleManager, { StyleManager, DEFAULT_MAPPINGS } from '../../../src/helpers/styleManager.js';
import {
  createEmailAppContext,
  createChatAppContext,
  createUnknownAppContext,
  createMailAppContext,
  createOutlookAppContext,
  createSlackAppContext,
  createDiscordAppContext,
  createMessagesAppContext,
  createVSCodeAppContext,
  createFinderAppContext,
  createAppContext,
  getAllEmailAppContexts,
  getAllChatAppContexts,
  getAllUnknownAppContexts,
  type AppContext
} from '../../factories/appContext.js';

describe('StyleManager', () => {
  let manager: InstanceType<typeof StyleManager>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Create a fresh StyleManager instance for each test
    manager = new StyleManager();
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 9.1: getStyleForApp with email apps returns 'formal'
  // ===========================================================================
  describe('getStyleForApp with email apps', () => {
    it('should return "formal" for Apple Mail', () => {
      const context = createMailAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should return "formal" for Microsoft Outlook (macOS)', () => {
      const context = createOutlookAppContext('darwin');
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should return "formal" for Microsoft Outlook (Windows)', () => {
      const context = createOutlookAppContext('win32');
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should return "formal" for Gmail in browser', () => {
      const context = createAppContext({
        appName: 'Gmail',
        bundleId: null,
        windowTitle: 'Gmail - Inbox'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should return "formal" for Thunderbird', () => {
      const context = createAppContext({
        appName: 'Thunderbird',
        bundleId: 'org.mozilla.thunderbird'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should return "formal" for Superhuman', () => {
      const context = createAppContext({
        appName: 'Superhuman',
        bundleId: 'com.superhuman.mail'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should match email apps case-insensitively', () => {
      const contexts = [
        createAppContext({ appName: 'MAIL' }),
        createAppContext({ appName: 'Mail' }),
        createAppContext({ appName: 'mail' }),
        createAppContext({ appName: 'OUTLOOK' }),
        createAppContext({ appName: 'outlook' })
      ];

      contexts.forEach(context => {
        expect(manager.getStyleForApp(context)).toBe('formal');
      });
    });

    it('should match email apps by bundleId', () => {
      const context = createAppContext({
        appName: 'SomeRandomName',
        bundleId: 'com.apple.mail'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });
  });

  // ===========================================================================
  // Requirement 9.2: getStyleForApp with chat apps returns 'casual'
  // ===========================================================================
  describe('getStyleForApp with chat apps', () => {
    it('should return "casual" for Slack (macOS)', () => {
      const context = createSlackAppContext('darwin');
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Slack (Windows)', () => {
      const context = createSlackAppContext('win32');
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Discord', () => {
      const context = createDiscordAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Apple Messages', () => {
      const context = createMessagesAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for WhatsApp', () => {
      const context = createAppContext({
        appName: 'WhatsApp',
        bundleId: 'net.whatsapp.WhatsApp'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Telegram', () => {
      const context = createAppContext({
        appName: 'Telegram',
        bundleId: 'org.telegram.desktop'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Signal', () => {
      const context = createAppContext({
        appName: 'Signal',
        bundleId: 'org.whispersystems.signal-desktop'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Microsoft Teams', () => {
      const context = createAppContext({
        appName: 'Microsoft Teams',
        bundleId: 'com.microsoft.teams'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should return "casual" for Amazon Chime', () => {
      const context = createAppContext({
        appName: 'Amazon Chime',
        bundleId: 'com.amazon.Amazon-Chime'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });

    it('should match chat apps case-insensitively', () => {
      const contexts = [
        createAppContext({ appName: 'SLACK' }),
        createAppContext({ appName: 'Slack' }),
        createAppContext({ appName: 'slack' }),
        createAppContext({ appName: 'DISCORD' }),
        createAppContext({ appName: 'discord' })
      ];

      contexts.forEach(context => {
        expect(manager.getStyleForApp(context)).toBe('casual');
      });
    });

    it('should match chat apps by bundleId', () => {
      const context = createAppContext({
        appName: 'SomeRandomName',
        bundleId: 'com.tinyspeck.slackmacgap'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('casual');
    });
  });

  // ===========================================================================
  // Requirement 9.3: getStyleForApp with unknown apps returns default style
  // ===========================================================================
  describe('getStyleForApp with unknown apps', () => {
    it('should return default style for VS Code', () => {
      const context = createVSCodeAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('neutral'); // Default is 'neutral'
    });

    it('should return default style for Finder', () => {
      const context = createFinderAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('neutral');
    });

    it('should return default style for completely unknown app', () => {
      const context = createUnknownAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('neutral');
    });

    it('should return default style for null context', () => {
      const style = manager.getStyleForApp(null as unknown as AppContext);
      expect(style).toBe('neutral');
    });

    it('should return default style for undefined context', () => {
      const style = manager.getStyleForApp(undefined as unknown as AppContext);
      expect(style).toBe('neutral');
    });

    it('should return default style for context with empty appName', () => {
      const context = createAppContext({ appName: '' });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('neutral');
    });

    it('should return configured default style when changed', () => {
      manager.setDefaultStyle('formal');
      const context = createUnknownAppContext();
      const style = manager.getStyleForApp(context);
      expect(style).toBe('formal');
    });

    it('should return "neutral" for Notion (professional/docs app)', () => {
      const context = createAppContext({
        appName: 'Notion',
        bundleId: 'notion.id'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('neutral');
    });

    it('should return "neutral" for Google Docs', () => {
      const context = createAppContext({
        appName: 'Google Docs',
        bundleId: null,
        windowTitle: 'Document - Google Docs'
      });
      const style = manager.getStyleForApp(context);
      expect(style).toBe('neutral');
    });
  });

  // ===========================================================================
  // Requirement 9.4: addCustomMapping persists to localStorage
  // ===========================================================================
  describe('addCustomMapping', () => {
    it('should add a custom mapping', () => {
      const mapping = manager.addMapping('myapp', 'formal');
      
      expect(mapping).toBeDefined();
      expect(mapping.pattern).toBe('myapp');
      expect(mapping.style).toBe('formal');
      expect(mapping.isDefault).toBe(false);
    });

    it('should persist custom mapping to localStorage', () => {
      manager.addMapping('myapp', 'formal');
      
      const stored = localStorage.getItem('contextAware.customMappings');
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].pattern).toBe('myapp');
      expect(parsed[0].style).toBe('formal');
    });

    it('should generate unique ID for custom mapping', async () => {
      const mapping1 = manager.addMapping('app1', 'formal');
      // Wait a small amount to ensure Date.now() returns a different value
      await new Promise(resolve => setTimeout(resolve, 1));
      const mapping2 = manager.addMapping('app2', 'casual');
      
      expect(mapping1.id).toBeDefined();
      expect(mapping2.id).toBeDefined();
      expect(mapping1.id).not.toBe(mapping2.id);
    });

    it('should make custom mapping take precedence over defaults', () => {
      // Add custom mapping for an email app to be casual
      manager.addMapping('mail', 'casual');
      
      const context = createAppContext({ appName: 'Mail' });
      const style = manager.getStyleForApp(context);
      
      // Custom mapping should override default
      expect(style).toBe('casual');
    });

    it('should allow multiple custom mappings', () => {
      manager.addMapping('app1', 'formal');
      manager.addMapping('app2', 'casual');
      manager.addMapping('app3', 'neutral');
      
      const customMappings = manager.getCustomMappings();
      expect(customMappings).toHaveLength(3);
    });

    it('should use custom mapping for getStyleForApp', () => {
      manager.addMapping('customapp', 'formal');
      
      const context = createAppContext({ appName: 'CustomApp' });
      const style = manager.getStyleForApp(context);
      
      expect(style).toBe('formal');
    });
  });

  // ===========================================================================
  // Requirement 9.5: removeCustomMapping removes from localStorage
  // ===========================================================================
  describe('removeCustomMapping', () => {
    it('should remove a custom mapping by ID', () => {
      const mapping = manager.addMapping('myapp', 'formal');
      
      const result = manager.removeMapping(mapping.id);
      
      expect(result).toBe(true);
      expect(manager.getCustomMappings()).toHaveLength(0);
    });

    it('should remove custom mapping from localStorage', () => {
      const mapping = manager.addMapping('myapp', 'formal');
      manager.removeMapping(mapping.id);
      
      const stored = localStorage.getItem('contextAware.customMappings');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(0);
    });

    it('should return false when removing non-existent mapping', () => {
      const result = manager.removeMapping('non-existent-id');
      expect(result).toBe(false);
    });

    it('should not remove default mappings', () => {
      const defaultMapping = manager.getDefaultMappings()[0];
      
      const result = manager.removeMapping(defaultMapping.id);
      
      expect(result).toBe(false);
      expect(manager.getDefaultMappings()).toContainEqual(defaultMapping);
    });

    it('should revert to default style after removing custom mapping', () => {
      // Add custom mapping to override default
      const mapping = manager.addMapping('mail', 'casual');
      
      // Verify custom mapping works
      let context = createAppContext({ appName: 'Mail' });
      expect(manager.getStyleForApp(context)).toBe('casual');
      
      // Remove custom mapping
      manager.removeMapping(mapping.id);
      
      // Should revert to default (formal for mail)
      expect(manager.getStyleForApp(context)).toBe('formal');
    });
  });

  // ===========================================================================
  // Requirement 9.6: exportMappings returns valid JSON
  // ===========================================================================
  describe('exportMappings', () => {
    it('should return valid JSON string', () => {
      manager.addMapping('app1', 'formal');
      manager.addMapping('app2', 'casual');
      
      const exported = manager.exportMappings();
      
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should export only custom mappings', () => {
      manager.addMapping('customapp', 'formal');
      
      const exported = manager.exportMappings();
      const parsed = JSON.parse(exported);
      
      // Should only contain custom mappings, not defaults
      expect(parsed).toHaveLength(1);
      expect(parsed[0].pattern).toBe('customapp');
      expect(parsed.every((m: any) => !m.isDefault)).toBe(true);
    });

    it('should return empty array JSON when no custom mappings', () => {
      const exported = manager.exportMappings();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual([]);
    });

    it('should include pattern and style in exported mappings', () => {
      manager.addMapping('myapp', 'formal');
      
      const exported = manager.exportMappings();
      const parsed = JSON.parse(exported);
      
      expect(parsed[0]).toHaveProperty('pattern', 'myapp');
      expect(parsed[0]).toHaveProperty('style', 'formal');
    });

    it('should format JSON with indentation', () => {
      manager.addMapping('app1', 'formal');
      
      const exported = manager.exportMappings();
      
      // Check that it's formatted (contains newlines)
      expect(exported).toContain('\n');
    });
  });

  // ===========================================================================
  // Requirement 9.7: importMappings adds valid mappings to the list
  // ===========================================================================
  describe('importMappings', () => {
    it('should import valid mappings from JSON', () => {
      const json = JSON.stringify([
        { pattern: 'app1', style: 'formal' },
        { pattern: 'app2', style: 'casual' }
      ]);
      
      const result = manager.importMappings(json);
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should add imported mappings to custom mappings', () => {
      const json = JSON.stringify([
        { pattern: 'importedapp', style: 'formal' }
      ]);
      
      manager.importMappings(json);
      
      const customMappings = manager.getCustomMappings();
      expect(customMappings.some(m => m.pattern === 'importedapp')).toBe(true);
    });

    it('should make imported mappings available via getStyleForApp', () => {
      const json = JSON.stringify([
        { pattern: 'importedapp', style: 'formal' }
      ]);
      
      manager.importMappings(json);
      
      const context = createAppContext({ appName: 'ImportedApp' });
      expect(manager.getStyleForApp(context)).toBe('formal');
    });

    it('should reject invalid JSON', () => {
      const result = manager.importMappings('not valid json');
      
      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-array JSON', () => {
      const json = JSON.stringify({ pattern: 'app', style: 'formal' });
      
      const result = manager.importMappings(json);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid format: expected array');
    });

    it('should skip mappings without pattern', () => {
      const json = JSON.stringify([
        { style: 'formal' },
        { pattern: 'valid', style: 'casual' }
      ]);
      
      const result = manager.importMappings(json);
      
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should skip mappings without style', () => {
      const json = JSON.stringify([
        { pattern: 'app1' },
        { pattern: 'app2', style: 'formal' }
      ]);
      
      const result = manager.importMappings(json);
      
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should skip mappings with invalid style', () => {
      const json = JSON.stringify([
        { pattern: 'app1', style: 'invalid' },
        { pattern: 'app2', style: 'formal' }
      ]);
      
      const result = manager.importMappings(json);
      
      expect(result.imported).toBe(1);
      expect(result.errors.some(e => e.includes('Invalid style'))).toBe(true);
    });

    it('should handle empty array', () => {
      const json = JSON.stringify([]);
      
      const result = manager.importMappings(json);
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should persist imported mappings to localStorage', () => {
      const json = JSON.stringify([
        { pattern: 'importedapp', style: 'formal' }
      ]);
      
      manager.importMappings(json);
      
      const stored = localStorage.getItem('contextAware.customMappings');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.some((m: any) => m.pattern === 'importedapp')).toBe(true);
    });
  });

  // ===========================================================================
  // Additional Tests: Default Style Management
  // ===========================================================================
  describe('Default Style Management', () => {
    it('should return "neutral" as initial default style', () => {
      expect(manager.getDefaultStyle()).toBe('neutral');
    });

    it('should allow setting default style to "formal"', () => {
      manager.setDefaultStyle('formal');
      expect(manager.getDefaultStyle()).toBe('formal');
    });

    it('should allow setting default style to "casual"', () => {
      manager.setDefaultStyle('casual');
      expect(manager.getDefaultStyle()).toBe('casual');
    });

    it('should persist default style to localStorage', () => {
      manager.setDefaultStyle('formal');
      
      const stored = localStorage.getItem('contextAware.defaultStyle');
      expect(stored).toBe('formal');
    });

    it('should ignore invalid default style values', () => {
      manager.setDefaultStyle('invalid' as any);
      expect(manager.getDefaultStyle()).toBe('neutral');
    });

    it('should load default style from localStorage on initialization', () => {
      localStorage.setItem('contextAware.defaultStyle', 'formal');
      
      const newManager = new StyleManager();
      expect(newManager.getDefaultStyle()).toBe('formal');
    });
  });

  // ===========================================================================
  // Additional Tests: Mapping Retrieval
  // ===========================================================================
  describe('Mapping Retrieval', () => {
    it('should return all mappings including defaults', () => {
      const mappings = manager.getMappings();
      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings.some(m => m.isDefault)).toBe(true);
    });

    it('should return only default mappings', () => {
      const defaultMappings = manager.getDefaultMappings();
      expect(defaultMappings.every(m => m.isDefault)).toBe(true);
      expect(defaultMappings.length).toBe(DEFAULT_MAPPINGS.length);
    });

    it('should return only custom mappings', () => {
      manager.addMapping('custom1', 'formal');
      manager.addMapping('custom2', 'casual');
      
      const customMappings = manager.getCustomMappings();
      expect(customMappings.every(m => !m.isDefault)).toBe(true);
      expect(customMappings).toHaveLength(2);
    });

    it('should return copy of mappings (not reference)', () => {
      const mappings1 = manager.getMappings();
      const mappings2 = manager.getMappings();
      
      expect(mappings1).not.toBe(mappings2);
    });
  });

  // ===========================================================================
  // Additional Tests: Reset to Defaults
  // ===========================================================================
  describe('Reset to Defaults', () => {
    it('should remove all custom mappings on reset', () => {
      manager.addMapping('custom1', 'formal');
      manager.addMapping('custom2', 'casual');
      
      manager.resetToDefaults();
      
      expect(manager.getCustomMappings()).toHaveLength(0);
    });

    it('should reset default style to neutral', () => {
      manager.setDefaultStyle('formal');
      
      manager.resetToDefaults();
      
      expect(manager.getDefaultStyle()).toBe('neutral');
    });

    it('should clear custom mappings from localStorage', () => {
      manager.addMapping('custom1', 'formal');
      
      manager.resetToDefaults();
      
      const stored = localStorage.getItem('contextAware.customMappings');
      expect(stored).toBeNull();
    });

    it('should preserve default mappings after reset', () => {
      manager.resetToDefaults();
      
      const defaultMappings = manager.getDefaultMappings();
      expect(defaultMappings.length).toBe(DEFAULT_MAPPINGS.length);
    });
  });

  // ===========================================================================
  // Additional Tests: Update Mapping
  // ===========================================================================
  describe('Update Mapping', () => {
    it('should update custom mapping pattern', () => {
      const mapping = manager.addMapping('oldpattern', 'formal');
      
      const updated = manager.updateMapping(mapping.id, { pattern: 'newpattern' });
      
      expect(updated).toBeDefined();
      expect(updated!.pattern).toBe('newpattern');
    });

    it('should update custom mapping style', () => {
      const mapping = manager.addMapping('myapp', 'formal');
      
      const updated = manager.updateMapping(mapping.id, { style: 'casual' });
      
      expect(updated).toBeDefined();
      expect(updated!.style).toBe('casual');
    });

    it('should persist updated mapping to localStorage', () => {
      const mapping = manager.addMapping('myapp', 'formal');
      manager.updateMapping(mapping.id, { style: 'casual' });
      
      const stored = localStorage.getItem('contextAware.customMappings');
      const parsed = JSON.parse(stored!);
      expect(parsed[0].style).toBe('casual');
    });

    it('should return null when updating non-existent mapping', () => {
      const result = manager.updateMapping('non-existent', { style: 'formal' });
      expect(result).toBeNull();
    });

    it('should not update default mappings', () => {
      const defaultMapping = manager.getDefaultMappings()[0];
      
      const result = manager.updateMapping(defaultMapping.id, { style: 'casual' });
      
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // Additional Tests: Enable/Disable
  // ===========================================================================
  describe('Enable/Disable', () => {
    it('should be enabled by default', () => {
      expect(manager.isEnabled()).toBe(true);
    });

    it('should allow disabling context-aware styling', () => {
      manager.setEnabled(false);
      expect(manager.isEnabled()).toBe(false);
    });

    it('should allow re-enabling context-aware styling', () => {
      manager.setEnabled(false);
      manager.setEnabled(true);
      expect(manager.isEnabled()).toBe(true);
    });

    it('should persist enabled state to localStorage', () => {
      manager.setEnabled(false);
      
      const stored = localStorage.getItem('contextAware.enabled');
      expect(stored).toBe('false');
    });
  });

  // ===========================================================================
  // Additional Tests: Pattern Matching
  // ===========================================================================
  describe('Pattern Matching', () => {
    it('should match patterns with wildcards', () => {
      manager.addMapping('*mail*', 'formal');
      
      const context = createAppContext({ appName: 'SuperMail Pro' });
      expect(manager.getStyleForApp(context)).toBe('formal');
    });

    it('should match partial app names', () => {
      // Default mapping for 'mail' should match 'Apple Mail'
      const context = createAppContext({ appName: 'Apple Mail' });
      expect(manager.getStyleForApp(context)).toBe('formal');
    });

    it('should match by bundleId when appName does not match', () => {
      const context = createAppContext({
        appName: 'RandomName',
        bundleId: 'com.apple.mail'
      });
      expect(manager.getStyleForApp(context)).toBe('formal');
    });
  });

  // ===========================================================================
  // Additional Tests: Singleton Instance
  // ===========================================================================
  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(styleManager).toBeDefined();
      expect(styleManager).toBeInstanceOf(StyleManager);
    });

    it('should have same methods as StyleManager class', () => {
      expect(typeof styleManager.getStyleForApp).toBe('function');
      expect(typeof styleManager.addMapping).toBe('function');
      expect(typeof styleManager.removeMapping).toBe('function');
      expect(typeof styleManager.exportMappings).toBe('function');
      expect(typeof styleManager.importMappings).toBe('function');
    });
  });

  // ===========================================================================
  // Additional Tests: Load Settings from localStorage
  // ===========================================================================
  describe('Load Settings from localStorage', () => {
    it('should load custom mappings from localStorage on initialization', () => {
      const customMappings = [
        { id: 'custom-1', pattern: 'savedapp', style: 'formal', isDefault: false }
      ];
      localStorage.setItem('contextAware.customMappings', JSON.stringify(customMappings));
      
      const newManager = new StyleManager();
      
      const context = createAppContext({ appName: 'SavedApp' });
      expect(newManager.getStyleForApp(context)).toBe('formal');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('contextAware.customMappings', 'not valid json');
      
      // Should not throw
      expect(() => new StyleManager()).not.toThrow();
    });

    it('should use defaults when localStorage is empty', () => {
      const newManager = new StyleManager();
      
      expect(newManager.getDefaultMappings().length).toBe(DEFAULT_MAPPINGS.length);
    });
  });
});
