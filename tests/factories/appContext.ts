/**
 * Test Factory for App Context
 * 
 * This module provides factory functions for creating test data
 * for application context detection used throughout the Ollie voice dictation app tests.
 * The app context is used by the Style Manager to determine appropriate text formality.
 * 
 * @module tests/factories/appContext
 * 
 * Validates: Requirements 8.2-8.5, 9.1-9.3
 * - 8.2: Context-aware styling enabled
 * - 8.3: Email client detection for formal style
 * - 8.4: Chat application detection for casual style
 * - 8.5: Unknown app detection for default style
 * - 9.1: getStyleForApp returns 'formal' for email apps
 * - 9.2: getStyleForApp returns 'casual' for chat apps
 * - 9.3: getStyleForApp returns default style for unknown apps
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Platform types supported by the application
 */
export type Platform = 'darwin' | 'win32' | 'linux';

/**
 * Application context for style detection
 */
export interface AppContext {
  appName: string;
  bundleId: string | null;
  executablePath: string | null;
  windowTitle: string | null;
  platform: Platform;
}

/**
 * Options for creating an app context
 */
export interface CreateAppContextOptions {
  /** Override the app name */
  appName?: string;
  /** Override the bundle ID */
  bundleId?: string | null;
  /** Override the executable path */
  executablePath?: string | null;
  /** Override the window title */
  windowTitle?: string | null;
  /** Override the platform */
  platform?: Platform;
}

// ============================================================================
// Email App Definitions
// ============================================================================

/**
 * Known email applications with their identifiers
 */
export const EMAIL_APPS = {
  // macOS
  mail: {
    appName: 'Mail',
    bundleId: 'com.apple.mail',
    executablePath: '/System/Applications/Mail.app',
    windowTitle: 'Inbox - Mail',
    platform: 'darwin' as Platform
  },
  outlook_mac: {
    appName: 'Microsoft Outlook',
    bundleId: 'com.microsoft.Outlook',
    executablePath: '/Applications/Microsoft Outlook.app',
    windowTitle: 'Inbox - Outlook',
    platform: 'darwin' as Platform
  },
  gmail_chrome_mac: {
    appName: 'Google Chrome',
    bundleId: 'com.google.Chrome',
    executablePath: '/Applications/Google Chrome.app',
    windowTitle: 'Gmail - Inbox',
    platform: 'darwin' as Platform
  },
  thunderbird_mac: {
    appName: 'Thunderbird',
    bundleId: 'org.mozilla.thunderbird',
    executablePath: '/Applications/Thunderbird.app',
    windowTitle: 'Inbox - Thunderbird',
    platform: 'darwin' as Platform
  },
  // Windows
  outlook_win: {
    appName: 'OUTLOOK.EXE',
    bundleId: null,
    executablePath: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE',
    windowTitle: 'Inbox - Outlook',
    platform: 'win32' as Platform
  },
  thunderbird_win: {
    appName: 'thunderbird.exe',
    bundleId: null,
    executablePath: 'C:\\Program Files\\Mozilla Thunderbird\\thunderbird.exe',
    windowTitle: 'Inbox - Thunderbird',
    platform: 'win32' as Platform
  },
  gmail_chrome_win: {
    appName: 'chrome.exe',
    bundleId: null,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    windowTitle: 'Gmail - Inbox - Google Chrome',
    platform: 'win32' as Platform
  },
  // Linux
  thunderbird_linux: {
    appName: 'thunderbird',
    bundleId: null,
    executablePath: '/usr/bin/thunderbird',
    windowTitle: 'Inbox - Mozilla Thunderbird',
    platform: 'linux' as Platform
  },
  gmail_firefox_linux: {
    appName: 'firefox',
    bundleId: null,
    executablePath: '/usr/bin/firefox',
    windowTitle: 'Gmail - Inbox - Mozilla Firefox',
    platform: 'linux' as Platform
  }
} as const;

// ============================================================================
// Chat App Definitions
// ============================================================================

/**
 * Known chat applications with their identifiers
 */
export const CHAT_APPS = {
  // macOS
  slack_mac: {
    appName: 'Slack',
    bundleId: 'com.tinyspeck.slackmacgap',
    executablePath: '/Applications/Slack.app',
    windowTitle: '#general - Slack',
    platform: 'darwin' as Platform
  },
  discord_mac: {
    appName: 'Discord',
    bundleId: 'com.hnc.Discord',
    executablePath: '/Applications/Discord.app',
    windowTitle: 'Discord',
    platform: 'darwin' as Platform
  },
  messages_mac: {
    appName: 'Messages',
    bundleId: 'com.apple.MobileSMS',
    executablePath: '/System/Applications/Messages.app',
    windowTitle: 'Messages',
    platform: 'darwin' as Platform
  },
  teams_mac: {
    appName: 'Microsoft Teams',
    bundleId: 'com.microsoft.teams',
    executablePath: '/Applications/Microsoft Teams.app',
    windowTitle: 'Microsoft Teams',
    platform: 'darwin' as Platform
  },
  whatsapp_mac: {
    appName: 'WhatsApp',
    bundleId: 'net.whatsapp.WhatsApp',
    executablePath: '/Applications/WhatsApp.app',
    windowTitle: 'WhatsApp',
    platform: 'darwin' as Platform
  },
  // Windows
  slack_win: {
    appName: 'slack.exe',
    bundleId: null,
    executablePath: 'C:\\Users\\User\\AppData\\Local\\slack\\slack.exe',
    windowTitle: '#general | Slack',
    platform: 'win32' as Platform
  },
  discord_win: {
    appName: 'Discord.exe',
    bundleId: null,
    executablePath: 'C:\\Users\\User\\AppData\\Local\\Discord\\Discord.exe',
    windowTitle: 'Discord',
    platform: 'win32' as Platform
  },
  teams_win: {
    appName: 'Teams.exe',
    bundleId: null,
    executablePath: 'C:\\Users\\User\\AppData\\Local\\Microsoft\\Teams\\Teams.exe',
    windowTitle: 'Microsoft Teams',
    platform: 'win32' as Platform
  },
  whatsapp_win: {
    appName: 'WhatsApp.exe',
    bundleId: null,
    executablePath: 'C:\\Program Files\\WindowsApps\\WhatsApp\\WhatsApp.exe',
    windowTitle: 'WhatsApp',
    platform: 'win32' as Platform
  },
  // Linux
  slack_linux: {
    appName: 'slack',
    bundleId: null,
    executablePath: '/usr/bin/slack',
    windowTitle: '#general - Slack',
    platform: 'linux' as Platform
  },
  discord_linux: {
    appName: 'discord',
    bundleId: null,
    executablePath: '/usr/bin/discord',
    windowTitle: 'Discord',
    platform: 'linux' as Platform
  }
} as const;

// ============================================================================
// Unknown App Definitions
// ============================================================================

/**
 * Unknown/generic applications for testing default style behavior
 */
export const UNKNOWN_APPS = {
  // macOS
  finder_mac: {
    appName: 'Finder',
    bundleId: 'com.apple.finder',
    executablePath: '/System/Library/CoreServices/Finder.app',
    windowTitle: 'Documents',
    platform: 'darwin' as Platform
  },
  vscode_mac: {
    appName: 'Code',
    bundleId: 'com.microsoft.VSCode',
    executablePath: '/Applications/Visual Studio Code.app',
    windowTitle: 'project - Visual Studio Code',
    platform: 'darwin' as Platform
  },
  safari_mac: {
    appName: 'Safari',
    bundleId: 'com.apple.Safari',
    executablePath: '/Applications/Safari.app',
    windowTitle: 'Apple',
    platform: 'darwin' as Platform
  },
  terminal_mac: {
    appName: 'Terminal',
    bundleId: 'com.apple.Terminal',
    executablePath: '/System/Applications/Utilities/Terminal.app',
    windowTitle: 'Terminal',
    platform: 'darwin' as Platform
  },
  // Windows
  notepad_win: {
    appName: 'notepad.exe',
    bundleId: null,
    executablePath: 'C:\\Windows\\System32\\notepad.exe',
    windowTitle: 'Untitled - Notepad',
    platform: 'win32' as Platform
  },
  explorer_win: {
    appName: 'explorer.exe',
    bundleId: null,
    executablePath: 'C:\\Windows\\explorer.exe',
    windowTitle: 'Documents',
    platform: 'win32' as Platform
  },
  vscode_win: {
    appName: 'Code.exe',
    bundleId: null,
    executablePath: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    windowTitle: 'project - Visual Studio Code',
    platform: 'win32' as Platform
  },
  // Linux
  nautilus_linux: {
    appName: 'nautilus',
    bundleId: null,
    executablePath: '/usr/bin/nautilus',
    windowTitle: 'Files',
    platform: 'linux' as Platform
  },
  vscode_linux: {
    appName: 'code',
    bundleId: null,
    executablePath: '/usr/bin/code',
    windowTitle: 'project - Visual Studio Code',
    platform: 'linux' as Platform
  },
  // Completely unknown
  unknown: {
    appName: 'Unknown',
    bundleId: null,
    executablePath: null,
    windowTitle: null,
    platform: 'darwin' as Platform
  }
} as const;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an app context with sensible defaults
 * 
 * @param overrides - Optional overrides for the default values
 * @returns An AppContext with the specified or default values
 * 
 * @example
 * ```typescript
 * // Create with all defaults (unknown app)
 * const context = createAppContext();
 * 
 * // Create with custom app name
 * const context = createAppContext({ appName: 'CustomApp' });
 * 
 * // Create with all custom values
 * const context = createAppContext({
 *   appName: 'MyApp',
 *   bundleId: 'com.example.myapp',
 *   executablePath: '/Applications/MyApp.app',
 *   windowTitle: 'My Window',
 *   platform: 'darwin'
 * });
 * ```
 */
export function createAppContext(overrides?: CreateAppContextOptions): AppContext {
  return {
    appName: overrides?.appName ?? 'Unknown',
    bundleId: overrides?.bundleId ?? null,
    executablePath: overrides?.executablePath ?? null,
    windowTitle: overrides?.windowTitle ?? null,
    platform: overrides?.platform ?? 'darwin'
  };
}

// ============================================================================
// Email App Context Factories
// ============================================================================

/**
 * Creates an app context for Apple Mail (macOS)
 */
export function createMailAppContext(overrides?: Partial<CreateAppContextOptions>): AppContext {
  return createAppContext({
    ...EMAIL_APPS.mail,
    ...overrides
  });
}

/**
 * Creates an app context for Microsoft Outlook
 */
export function createOutlookAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  const base = platform === 'win32' ? EMAIL_APPS.outlook_win : EMAIL_APPS.outlook_mac;
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates an app context for Gmail (browser-based)
 */
export function createGmailAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  let base;
  switch (platform) {
    case 'win32':
      base = EMAIL_APPS.gmail_chrome_win;
      break;
    case 'linux':
      base = EMAIL_APPS.gmail_firefox_linux;
      break;
    default:
      base = EMAIL_APPS.gmail_chrome_mac;
  }
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates an app context for Mozilla Thunderbird
 */
export function createThunderbirdAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  let base;
  switch (platform) {
    case 'win32':
      base = EMAIL_APPS.thunderbird_win;
      break;
    case 'linux':
      base = EMAIL_APPS.thunderbird_linux;
      break;
    default:
      base = EMAIL_APPS.thunderbird_mac;
  }
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates a generic email app context
 * Useful for testing email detection with various configurations
 * 
 * @param appName - Name of the email app (default: 'Mail')
 * @param overrides - Additional overrides
 */
export function createEmailAppContext(
  appName: string = 'Mail',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  // Try to find a matching predefined email app
  const normalizedName = appName.toLowerCase();
  
  // Exact match for "Mail" (Apple Mail)
  if (normalizedName === 'mail') {
    return createMailAppContext(overrides);
  }
  if (normalizedName.includes('outlook')) {
    return createOutlookAppContext(overrides?.platform, overrides);
  }
  if (normalizedName.includes('gmail')) {
    return createGmailAppContext(overrides?.platform, overrides);
  }
  if (normalizedName.includes('thunderbird')) {
    return createThunderbirdAppContext(overrides?.platform, overrides);
  }
  
  // Generic email app
  return createAppContext({
    appName,
    windowTitle: `Inbox - ${appName}`,
    ...overrides
  });
}

// ============================================================================
// Chat App Context Factories
// ============================================================================

/**
 * Creates an app context for Slack
 */
export function createSlackAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  let base;
  switch (platform) {
    case 'win32':
      base = CHAT_APPS.slack_win;
      break;
    case 'linux':
      base = CHAT_APPS.slack_linux;
      break;
    default:
      base = CHAT_APPS.slack_mac;
  }
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates an app context for Discord
 */
export function createDiscordAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  let base;
  switch (platform) {
    case 'win32':
      base = CHAT_APPS.discord_win;
      break;
    case 'linux':
      base = CHAT_APPS.discord_linux;
      break;
    default:
      base = CHAT_APPS.discord_mac;
  }
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates an app context for Apple Messages (macOS only)
 */
export function createMessagesAppContext(
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  return createAppContext({
    ...CHAT_APPS.messages_mac,
    ...overrides
  });
}

/**
 * Creates an app context for Microsoft Teams
 */
export function createTeamsAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  const base = platform === 'win32' ? CHAT_APPS.teams_win : CHAT_APPS.teams_mac;
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates an app context for WhatsApp
 */
export function createWhatsAppAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  const base = platform === 'win32' ? CHAT_APPS.whatsapp_win : CHAT_APPS.whatsapp_mac;
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates a generic chat app context
 * Useful for testing chat detection with various configurations
 * 
 * @param appName - Name of the chat app (default: 'Slack')
 * @param overrides - Additional overrides
 */
export function createChatAppContext(
  appName: string = 'Slack',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  // Try to find a matching predefined chat app
  const normalizedName = appName.toLowerCase();
  
  if (normalizedName.includes('slack')) {
    return createSlackAppContext(overrides?.platform, overrides);
  }
  if (normalizedName.includes('discord')) {
    return createDiscordAppContext(overrides?.platform, overrides);
  }
  if (normalizedName.includes('messages')) {
    return createMessagesAppContext(overrides);
  }
  if (normalizedName.includes('teams')) {
    return createTeamsAppContext(overrides?.platform, overrides);
  }
  if (normalizedName.includes('whatsapp')) {
    return createWhatsAppAppContext(overrides?.platform, overrides);
  }
  
  // Generic chat app
  return createAppContext({
    appName,
    windowTitle: appName,
    ...overrides
  });
}

// ============================================================================
// Unknown App Context Factories
// ============================================================================

/**
 * Creates an app context for an unknown/unrecognized application
 * This should trigger the default style behavior
 */
export function createUnknownAppContext(
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  return createAppContext({
    ...UNKNOWN_APPS.unknown,
    ...overrides
  });
}

/**
 * Creates an app context for VS Code
 */
export function createVSCodeAppContext(
  platform: Platform = 'darwin',
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  let base;
  switch (platform) {
    case 'win32':
      base = UNKNOWN_APPS.vscode_win;
      break;
    case 'linux':
      base = UNKNOWN_APPS.vscode_linux;
      break;
    default:
      base = UNKNOWN_APPS.vscode_mac;
  }
  return createAppContext({
    ...base,
    ...overrides
  });
}

/**
 * Creates an app context for Finder (macOS)
 */
export function createFinderAppContext(
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  return createAppContext({
    ...UNKNOWN_APPS.finder_mac,
    ...overrides
  });
}

/**
 * Creates an app context for Terminal (macOS)
 */
export function createTerminalAppContext(
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  return createAppContext({
    ...UNKNOWN_APPS.terminal_mac,
    ...overrides
  });
}

/**
 * Creates an app context for Notepad (Windows)
 */
export function createNotepadAppContext(
  overrides?: Partial<CreateAppContextOptions>
): AppContext {
  return createAppContext({
    ...UNKNOWN_APPS.notepad_win,
    ...overrides
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all predefined email app contexts
 */
export function getAllEmailAppContexts(): AppContext[] {
  return Object.values(EMAIL_APPS).map(app => createAppContext(app));
}

/**
 * Gets all predefined chat app contexts
 */
export function getAllChatAppContexts(): AppContext[] {
  return Object.values(CHAT_APPS).map(app => createAppContext(app));
}

/**
 * Gets all predefined unknown app contexts
 */
export function getAllUnknownAppContexts(): AppContext[] {
  return Object.values(UNKNOWN_APPS).map(app => createAppContext(app));
}

/**
 * Gets email app contexts for a specific platform
 */
export function getEmailAppContextsForPlatform(platform: Platform): AppContext[] {
  return Object.values(EMAIL_APPS)
    .filter(app => app.platform === platform)
    .map(app => createAppContext(app));
}

/**
 * Gets chat app contexts for a specific platform
 */
export function getChatAppContextsForPlatform(platform: Platform): AppContext[] {
  return Object.values(CHAT_APPS)
    .filter(app => app.platform === platform)
    .map(app => createAppContext(app));
}

/**
 * Gets unknown app contexts for a specific platform
 */
export function getUnknownAppContextsForPlatform(platform: Platform): AppContext[] {
  return Object.values(UNKNOWN_APPS)
    .filter(app => app.platform === platform)
    .map(app => createAppContext(app));
}

/**
 * Creates a random email app context
 */
export function createRandomEmailAppContext(): AppContext {
  const apps = Object.values(EMAIL_APPS);
  const randomApp = apps[Math.floor(Math.random() * apps.length)];
  return createAppContext(randomApp);
}

/**
 * Creates a random chat app context
 */
export function createRandomChatAppContext(): AppContext {
  const apps = Object.values(CHAT_APPS);
  const randomApp = apps[Math.floor(Math.random() * apps.length)];
  return createAppContext(randomApp);
}

/**
 * Creates a random unknown app context
 */
export function createRandomUnknownAppContext(): AppContext {
  const apps = Object.values(UNKNOWN_APPS);
  const randomApp = apps[Math.floor(Math.random() * apps.length)];
  return createAppContext(randomApp);
}

/**
 * Checks if an app context represents an email application
 * This is a helper for testing the style manager's detection logic
 */
export function isEmailApp(context: AppContext): boolean {
  const emailAppNames = ['mail', 'outlook', 'gmail', 'thunderbird'];
  const normalizedName = context.appName.toLowerCase();
  const normalizedTitle = (context.windowTitle || '').toLowerCase();
  
  return emailAppNames.some(name => 
    normalizedName.includes(name) || normalizedTitle.includes(name)
  );
}

/**
 * Checks if an app context represents a chat application
 * This is a helper for testing the style manager's detection logic
 */
export function isChatApp(context: AppContext): boolean {
  const chatAppNames = ['slack', 'discord', 'messages', 'teams', 'whatsapp'];
  const normalizedName = context.appName.toLowerCase();
  const normalizedTitle = (context.windowTitle || '').toLowerCase();
  
  return chatAppNames.some(name => 
    normalizedName.includes(name) || normalizedTitle.includes(name)
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Base factory
  createAppContext,
  
  // Email app factories
  createEmailAppContext,
  createMailAppContext,
  createOutlookAppContext,
  createGmailAppContext,
  createThunderbirdAppContext,
  
  // Chat app factories
  createChatAppContext,
  createSlackAppContext,
  createDiscordAppContext,
  createMessagesAppContext,
  createTeamsAppContext,
  createWhatsAppAppContext,
  
  // Unknown app factories
  createUnknownAppContext,
  createVSCodeAppContext,
  createFinderAppContext,
  createTerminalAppContext,
  createNotepadAppContext,
  
  // Utility functions
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
  
  // App definitions
  EMAIL_APPS,
  CHAT_APPS,
  UNKNOWN_APPS
};
