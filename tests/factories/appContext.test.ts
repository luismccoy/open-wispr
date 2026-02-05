/**
 * Tests for App Context Factory
 * 
 * Verifies that the app context factory functions create valid test data
 * with the expected structure and behavior for style detection testing.
 * 
 * @module tests/factories/appContext.test
 * 
 * Validates: Requirements 8.2-8.5, 9.1-9.3
 */

import { describe, it, expect } from 'vitest';
import {
  createAppContext,
  createEmailAppContext,
  createMailAppContext,
  createOutlookAppContext,
  createGmailAppContext,
  createThunderbirdAppContext,
  createChatAppContext,
  createSlackAppContext,
  createDiscordAppContext,
  createMessagesAppContext,
  createTeamsAppContext,
  createWhatsAppAppContext,
  createUnknownAppContext,
  createVSCodeAppContext,
  createFinderAppContext,
  createTerminalAppContext,
  createNotepadAppContext,
  getAllEmailAppContexts,
  getAllChatAppContexts,
  getAllUnknownAppContexts,
  getEmailAppContextsForPlatform,
  getChatAppContextsForPlatform,
  getUnknownAppContextsForPlatform,
  createRandomEmailAppContext,
  createRandomChatAppContext,
  createRandomUnknownAppContext,
  isEmailApp,
  isChatApp,
  EMAIL_APPS,
  CHAT_APPS,
  UNKNOWN_APPS,
  AppContext,
  Platform
} from './appContext';

describe('App Context Factory', () => {
  describe('createAppContext', () => {
    it('should create an app context with default values', () => {
      const context = createAppContext();

      expect(context).toHaveProperty('appName');
      expect(context).toHaveProperty('bundleId');
      expect(context).toHaveProperty('executablePath');
      expect(context).toHaveProperty('windowTitle');
      expect(context).toHaveProperty('platform');
    });

    it('should have sensible defaults for unknown app', () => {
      const context = createAppContext();

      expect(context.appName).toBe('Unknown');
      expect(context.bundleId).toBeNull();
      expect(context.executablePath).toBeNull();
      expect(context.windowTitle).toBeNull();
      expect(context.platform).toBe('darwin');
    });

    it('should allow overriding all properties', () => {
      const context = createAppContext({
        appName: 'CustomApp',
        bundleId: 'com.example.custom',
        executablePath: '/Applications/Custom.app',
        windowTitle: 'Custom Window',
        platform: 'win32'
      });

      expect(context.appName).toBe('CustomApp');
      expect(context.bundleId).toBe('com.example.custom');
      expect(context.executablePath).toBe('/Applications/Custom.app');
      expect(context.windowTitle).toBe('Custom Window');
      expect(context.platform).toBe('win32');
    });

    it('should allow partial overrides', () => {
      const context = createAppContext({
        appName: 'PartialApp'
      });

      expect(context.appName).toBe('PartialApp');
      expect(context.bundleId).toBeNull();
      expect(context.platform).toBe('darwin');
    });

    it('should support all platform types', () => {
      const platforms: Platform[] = ['darwin', 'win32', 'linux'];

      platforms.forEach(platform => {
        const context = createAppContext({ platform });
        expect(context.platform).toBe(platform);
      });
    });
  });

  describe('Email App Context Factories', () => {
    describe('createMailAppContext', () => {
      it('should create Apple Mail context', () => {
        const context = createMailAppContext();

        expect(context.appName).toBe('Mail');
        expect(context.bundleId).toBe('com.apple.mail');
        expect(context.platform).toBe('darwin');
      });

      it('should allow overrides', () => {
        const context = createMailAppContext({ windowTitle: 'Custom Inbox' });

        expect(context.appName).toBe('Mail');
        expect(context.windowTitle).toBe('Custom Inbox');
      });
    });

    describe('createOutlookAppContext', () => {
      it('should create macOS Outlook context by default', () => {
        const context = createOutlookAppContext();

        expect(context.appName).toBe('Microsoft Outlook');
        expect(context.bundleId).toBe('com.microsoft.Outlook');
        expect(context.platform).toBe('darwin');
      });

      it('should create Windows Outlook context', () => {
        const context = createOutlookAppContext('win32');

        expect(context.appName).toBe('OUTLOOK.EXE');
        expect(context.bundleId).toBeNull();
        expect(context.platform).toBe('win32');
      });
    });

    describe('createGmailAppContext', () => {
      it('should create Gmail context for macOS', () => {
        const context = createGmailAppContext('darwin');

        expect(context.windowTitle).toContain('Gmail');
        expect(context.platform).toBe('darwin');
      });

      it('should create Gmail context for Windows', () => {
        const context = createGmailAppContext('win32');

        expect(context.windowTitle).toContain('Gmail');
        expect(context.platform).toBe('win32');
      });

      it('should create Gmail context for Linux', () => {
        const context = createGmailAppContext('linux');

        expect(context.windowTitle).toContain('Gmail');
        expect(context.platform).toBe('linux');
      });
    });

    describe('createThunderbirdAppContext', () => {
      it('should create Thunderbird context for each platform', () => {
        const platforms: Platform[] = ['darwin', 'win32', 'linux'];

        platforms.forEach(platform => {
          const context = createThunderbirdAppContext(platform);
          expect(context.appName.toLowerCase()).toContain('thunderbird');
          expect(context.platform).toBe(platform);
        });
      });
    });

    describe('createEmailAppContext', () => {
      it('should create Mail context for "Mail"', () => {
        const context = createEmailAppContext('Mail');
        expect(context.appName).toBe('Mail');
      });

      it('should create Outlook context for "Outlook"', () => {
        const context = createEmailAppContext('Outlook');
        expect(context.appName).toContain('Outlook');
      });

      it('should create Gmail context for "Gmail"', () => {
        const context = createEmailAppContext('Gmail');
        expect(context.windowTitle).toContain('Gmail');
      });

      it('should create Thunderbird context for "Thunderbird"', () => {
        const context = createEmailAppContext('Thunderbird');
        expect(context.appName).toContain('Thunderbird');
      });

      it('should create generic email context for unknown email app', () => {
        const context = createEmailAppContext('ProtonMail');
        expect(context.appName).toBe('ProtonMail');
        expect(context.windowTitle).toBe('Inbox - ProtonMail');
      });
    });
  });

  describe('Chat App Context Factories', () => {
    describe('createSlackAppContext', () => {
      it('should create Slack context for macOS', () => {
        const context = createSlackAppContext('darwin');

        expect(context.appName).toBe('Slack');
        expect(context.bundleId).toBe('com.tinyspeck.slackmacgap');
        expect(context.platform).toBe('darwin');
      });

      it('should create Slack context for Windows', () => {
        const context = createSlackAppContext('win32');

        expect(context.appName).toBe('slack.exe');
        expect(context.platform).toBe('win32');
      });

      it('should create Slack context for Linux', () => {
        const context = createSlackAppContext('linux');

        expect(context.appName).toBe('slack');
        expect(context.platform).toBe('linux');
      });
    });

    describe('createDiscordAppContext', () => {
      it('should create Discord context for each platform', () => {
        const platforms: Platform[] = ['darwin', 'win32', 'linux'];

        platforms.forEach(platform => {
          const context = createDiscordAppContext(platform);
          expect(context.appName.toLowerCase()).toContain('discord');
          expect(context.platform).toBe(platform);
        });
      });
    });

    describe('createMessagesAppContext', () => {
      it('should create Apple Messages context', () => {
        const context = createMessagesAppContext();

        expect(context.appName).toBe('Messages');
        expect(context.bundleId).toBe('com.apple.MobileSMS');
        expect(context.platform).toBe('darwin');
      });
    });

    describe('createTeamsAppContext', () => {
      it('should create Teams context for macOS', () => {
        const context = createTeamsAppContext('darwin');

        expect(context.appName).toBe('Microsoft Teams');
        expect(context.platform).toBe('darwin');
      });

      it('should create Teams context for Windows', () => {
        const context = createTeamsAppContext('win32');

        expect(context.appName).toBe('Teams.exe');
        expect(context.platform).toBe('win32');
      });
    });

    describe('createWhatsAppAppContext', () => {
      it('should create WhatsApp context for macOS', () => {
        const context = createWhatsAppAppContext('darwin');

        expect(context.appName).toBe('WhatsApp');
        expect(context.bundleId).toBe('net.whatsapp.WhatsApp');
        expect(context.platform).toBe('darwin');
      });

      it('should create WhatsApp context for Windows', () => {
        const context = createWhatsAppAppContext('win32');

        expect(context.appName).toBe('WhatsApp.exe');
        expect(context.platform).toBe('win32');
      });
    });

    describe('createChatAppContext', () => {
      it('should create Slack context for "Slack"', () => {
        const context = createChatAppContext('Slack');
        expect(context.appName).toBe('Slack');
      });

      it('should create Discord context for "Discord"', () => {
        const context = createChatAppContext('Discord');
        expect(context.appName).toBe('Discord');
      });

      it('should create Messages context for "Messages"', () => {
        const context = createChatAppContext('Messages');
        expect(context.appName).toBe('Messages');
      });

      it('should create Teams context for "Teams"', () => {
        const context = createChatAppContext('Teams');
        expect(context.appName).toContain('Teams');
      });

      it('should create WhatsApp context for "WhatsApp"', () => {
        const context = createChatAppContext('WhatsApp');
        expect(context.appName).toBe('WhatsApp');
      });

      it('should create generic chat context for unknown chat app', () => {
        const context = createChatAppContext('Signal');
        expect(context.appName).toBe('Signal');
        expect(context.windowTitle).toBe('Signal');
      });
    });
  });

  describe('Unknown App Context Factories', () => {
    describe('createUnknownAppContext', () => {
      it('should create unknown app context', () => {
        const context = createUnknownAppContext();

        expect(context.appName).toBe('Unknown');
        expect(context.bundleId).toBeNull();
        expect(context.executablePath).toBeNull();
        expect(context.windowTitle).toBeNull();
      });

      it('should allow overrides', () => {
        const context = createUnknownAppContext({ appName: 'SomeApp' });

        expect(context.appName).toBe('SomeApp');
      });
    });

    describe('createVSCodeAppContext', () => {
      it('should create VS Code context for each platform', () => {
        const platforms: Platform[] = ['darwin', 'win32', 'linux'];

        platforms.forEach(platform => {
          const context = createVSCodeAppContext(platform);
          expect(context.appName.toLowerCase()).toContain('code');
          expect(context.platform).toBe(platform);
        });
      });
    });

    describe('createFinderAppContext', () => {
      it('should create Finder context', () => {
        const context = createFinderAppContext();

        expect(context.appName).toBe('Finder');
        expect(context.bundleId).toBe('com.apple.finder');
        expect(context.platform).toBe('darwin');
      });
    });

    describe('createTerminalAppContext', () => {
      it('should create Terminal context', () => {
        const context = createTerminalAppContext();

        expect(context.appName).toBe('Terminal');
        expect(context.bundleId).toBe('com.apple.Terminal');
        expect(context.platform).toBe('darwin');
      });
    });

    describe('createNotepadAppContext', () => {
      it('should create Notepad context', () => {
        const context = createNotepadAppContext();

        expect(context.appName).toBe('notepad.exe');
        expect(context.platform).toBe('win32');
      });
    });
  });

  describe('Utility Functions', () => {
    describe('getAllEmailAppContexts', () => {
      it('should return all predefined email app contexts', () => {
        const contexts = getAllEmailAppContexts();

        expect(contexts.length).toBe(Object.keys(EMAIL_APPS).length);
        contexts.forEach(context => {
          expect(context).toHaveProperty('appName');
          expect(context).toHaveProperty('platform');
        });
      });
    });

    describe('getAllChatAppContexts', () => {
      it('should return all predefined chat app contexts', () => {
        const contexts = getAllChatAppContexts();

        expect(contexts.length).toBe(Object.keys(CHAT_APPS).length);
        contexts.forEach(context => {
          expect(context).toHaveProperty('appName');
          expect(context).toHaveProperty('platform');
        });
      });
    });

    describe('getAllUnknownAppContexts', () => {
      it('should return all predefined unknown app contexts', () => {
        const contexts = getAllUnknownAppContexts();

        expect(contexts.length).toBe(Object.keys(UNKNOWN_APPS).length);
        contexts.forEach(context => {
          expect(context).toHaveProperty('appName');
          expect(context).toHaveProperty('platform');
        });
      });
    });

    describe('getEmailAppContextsForPlatform', () => {
      it('should return email apps for darwin', () => {
        const contexts = getEmailAppContextsForPlatform('darwin');

        expect(contexts.length).toBeGreaterThan(0);
        contexts.forEach(context => {
          expect(context.platform).toBe('darwin');
        });
      });

      it('should return email apps for win32', () => {
        const contexts = getEmailAppContextsForPlatform('win32');

        expect(contexts.length).toBeGreaterThan(0);
        contexts.forEach(context => {
          expect(context.platform).toBe('win32');
        });
      });

      it('should return email apps for linux', () => {
        const contexts = getEmailAppContextsForPlatform('linux');

        expect(contexts.length).toBeGreaterThan(0);
        contexts.forEach(context => {
          expect(context.platform).toBe('linux');
        });
      });
    });

    describe('getChatAppContextsForPlatform', () => {
      it('should return chat apps for darwin', () => {
        const contexts = getChatAppContextsForPlatform('darwin');

        expect(contexts.length).toBeGreaterThan(0);
        contexts.forEach(context => {
          expect(context.platform).toBe('darwin');
        });
      });

      it('should return chat apps for win32', () => {
        const contexts = getChatAppContextsForPlatform('win32');

        expect(contexts.length).toBeGreaterThan(0);
        contexts.forEach(context => {
          expect(context.platform).toBe('win32');
        });
      });
    });

    describe('getUnknownAppContextsForPlatform', () => {
      it('should return unknown apps for darwin', () => {
        const contexts = getUnknownAppContextsForPlatform('darwin');

        expect(contexts.length).toBeGreaterThan(0);
        contexts.forEach(context => {
          expect(context.platform).toBe('darwin');
        });
      });
    });

    describe('createRandomEmailAppContext', () => {
      it('should return a valid email app context', () => {
        const context = createRandomEmailAppContext();

        expect(context).toHaveProperty('appName');
        expect(context).toHaveProperty('platform');
        // Should be one of the predefined email apps
        const allEmailApps = getAllEmailAppContexts();
        const matchingApp = allEmailApps.find(
          app => app.appName === context.appName && app.platform === context.platform
        );
        expect(matchingApp).toBeDefined();
      });
    });

    describe('createRandomChatAppContext', () => {
      it('should return a valid chat app context', () => {
        const context = createRandomChatAppContext();

        expect(context).toHaveProperty('appName');
        expect(context).toHaveProperty('platform');
        // Should be one of the predefined chat apps
        const allChatApps = getAllChatAppContexts();
        const matchingApp = allChatApps.find(
          app => app.appName === context.appName && app.platform === context.platform
        );
        expect(matchingApp).toBeDefined();
      });
    });

    describe('createRandomUnknownAppContext', () => {
      it('should return a valid unknown app context', () => {
        const context = createRandomUnknownAppContext();

        expect(context).toHaveProperty('appName');
        expect(context).toHaveProperty('platform');
        // Should be one of the predefined unknown apps
        const allUnknownApps = getAllUnknownAppContexts();
        const matchingApp = allUnknownApps.find(
          app => app.appName === context.appName && app.platform === context.platform
        );
        expect(matchingApp).toBeDefined();
      });
    });

    describe('isEmailApp', () => {
      it('should return true for email apps', () => {
        expect(isEmailApp(createMailAppContext())).toBe(true);
        expect(isEmailApp(createOutlookAppContext())).toBe(true);
        expect(isEmailApp(createGmailAppContext())).toBe(true);
        expect(isEmailApp(createThunderbirdAppContext())).toBe(true);
      });

      it('should return false for chat apps', () => {
        expect(isEmailApp(createSlackAppContext())).toBe(false);
        expect(isEmailApp(createDiscordAppContext())).toBe(false);
        expect(isEmailApp(createMessagesAppContext())).toBe(false);
      });

      it('should return false for unknown apps', () => {
        expect(isEmailApp(createUnknownAppContext())).toBe(false);
        expect(isEmailApp(createVSCodeAppContext())).toBe(false);
        expect(isEmailApp(createFinderAppContext())).toBe(false);
      });
    });

    describe('isChatApp', () => {
      it('should return true for chat apps', () => {
        expect(isChatApp(createSlackAppContext())).toBe(true);
        expect(isChatApp(createDiscordAppContext())).toBe(true);
        expect(isChatApp(createMessagesAppContext())).toBe(true);
        expect(isChatApp(createTeamsAppContext())).toBe(true);
        expect(isChatApp(createWhatsAppAppContext())).toBe(true);
      });

      it('should return false for email apps', () => {
        expect(isChatApp(createMailAppContext())).toBe(false);
        expect(isChatApp(createOutlookAppContext())).toBe(false);
        expect(isChatApp(createGmailAppContext())).toBe(false);
      });

      it('should return false for unknown apps', () => {
        expect(isChatApp(createUnknownAppContext())).toBe(false);
        expect(isChatApp(createVSCodeAppContext())).toBe(false);
        expect(isChatApp(createFinderAppContext())).toBe(false);
      });
    });
  });

  describe('App Definitions', () => {
    describe('EMAIL_APPS', () => {
      it('should contain expected email apps', () => {
        expect(EMAIL_APPS).toHaveProperty('mail');
        expect(EMAIL_APPS).toHaveProperty('outlook_mac');
        expect(EMAIL_APPS).toHaveProperty('outlook_win');
        expect(EMAIL_APPS).toHaveProperty('gmail_chrome_mac');
        expect(EMAIL_APPS).toHaveProperty('thunderbird_mac');
      });

      it('should have valid structure for all email apps', () => {
        Object.values(EMAIL_APPS).forEach(app => {
          expect(app).toHaveProperty('appName');
          expect(app).toHaveProperty('bundleId');
          expect(app).toHaveProperty('executablePath');
          expect(app).toHaveProperty('windowTitle');
          expect(app).toHaveProperty('platform');
          expect(['darwin', 'win32', 'linux']).toContain(app.platform);
        });
      });
    });

    describe('CHAT_APPS', () => {
      it('should contain expected chat apps', () => {
        expect(CHAT_APPS).toHaveProperty('slack_mac');
        expect(CHAT_APPS).toHaveProperty('discord_mac');
        expect(CHAT_APPS).toHaveProperty('messages_mac');
        expect(CHAT_APPS).toHaveProperty('teams_mac');
        expect(CHAT_APPS).toHaveProperty('whatsapp_mac');
      });

      it('should have valid structure for all chat apps', () => {
        Object.values(CHAT_APPS).forEach(app => {
          expect(app).toHaveProperty('appName');
          expect(app).toHaveProperty('bundleId');
          expect(app).toHaveProperty('executablePath');
          expect(app).toHaveProperty('windowTitle');
          expect(app).toHaveProperty('platform');
          expect(['darwin', 'win32', 'linux']).toContain(app.platform);
        });
      });
    });

    describe('UNKNOWN_APPS', () => {
      it('should contain expected unknown apps', () => {
        expect(UNKNOWN_APPS).toHaveProperty('finder_mac');
        expect(UNKNOWN_APPS).toHaveProperty('vscode_mac');
        expect(UNKNOWN_APPS).toHaveProperty('terminal_mac');
        expect(UNKNOWN_APPS).toHaveProperty('notepad_win');
        expect(UNKNOWN_APPS).toHaveProperty('unknown');
      });

      it('should have valid structure for all unknown apps', () => {
        Object.values(UNKNOWN_APPS).forEach(app => {
          expect(app).toHaveProperty('appName');
          expect(app).toHaveProperty('bundleId');
          expect(app).toHaveProperty('executablePath');
          expect(app).toHaveProperty('windowTitle');
          expect(app).toHaveProperty('platform');
          expect(['darwin', 'win32', 'linux']).toContain(app.platform);
        });
      });
    });
  });

  describe('Type Safety', () => {
    it('should return objects conforming to AppContext interface', () => {
      const context: AppContext = createAppContext({
        appName: 'Test',
        bundleId: 'com.test',
        executablePath: '/test',
        windowTitle: 'Test Window',
        platform: 'darwin'
      });

      // TypeScript compilation is the real test here
      expect(context.appName).toBeDefined();
      expect(context.bundleId).toBeDefined();
      expect(context.executablePath).toBeDefined();
      expect(context.windowTitle).toBeDefined();
      expect(context.platform).toBeDefined();
    });

    it('should return arrays of AppContext', () => {
      const contexts: AppContext[] = getAllEmailAppContexts();

      expect(Array.isArray(contexts)).toBe(true);
      contexts.forEach(context => {
        expect(context.appName).toBeDefined();
        expect(context.platform).toBeDefined();
      });
    });
  });
});
