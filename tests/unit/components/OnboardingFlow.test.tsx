/**
 * Unit Tests for OnboardingFlow Component
 * 
 * Tests the onboarding wizard that guides new users through setup including
 * permissions, hotkey configuration, and processing mode options.
 * 
 * @module tests/unit/components/OnboardingFlow.test.tsx
 * 
 * Validates: Requirements 3.1-3.8
 * - 3.1: Onboarding_Flow displays welcome step with feature highlights
 * - 3.2: Onboarding_Flow displays permission cards for microphone and accessibility
 * - 3.3: Onboarding_Flow prevents progression when microphone permission not granted
 * - 3.4: Onboarding_Flow prevents progression when accessibility permission not granted
 * - 3.5: Onboarding_Flow displays interactive keyboard for key selection
 * - 3.6: Onboarding_Flow updates hotkey display and enables next button on selection
 * - 3.7: Onboarding_Flow displays context-aware styling options (via processing mode)
 * - 3.8: Onboarding_Flow saves all settings and marks onboarding complete
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper function to check if element is in document
const expectInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeNull();
  expect(document.body.contains(element)).toBe(true);
};

// Mock return values for hooks
let mockMicPermissionGranted = false;
let mockAccessibilityPermissionGranted = false;
const mockRequestMicPermission = vi.fn();
const mockTestAccessibilityPermission = vi.fn();
const mockSetMicPermissionGranted = vi.fn();
const mockSetAccessibilityPermissionGranted = vi.fn();
const mockSetDictationKey = vi.fn();
const mockUpdateTranscriptionSettings = vi.fn();
const mockUpdateReasoningSettings = vi.fn();
const mockUpdateApiKeys = vi.fn();
const mockShowAlertDialog = vi.fn();
const mockHideAlertDialog = vi.fn();

// Mock the hooks before importing OnboardingFlow
vi.mock('../../../src/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, defaultValue: unknown) => {
    if (key === 'onboardingCurrentStep') {
      return [0, vi.fn(), vi.fn()];
    }
    return [defaultValue, vi.fn(), vi.fn()];
  })
}));

vi.mock('../../../src/hooks/useSettings', () => ({
  useSettings: vi.fn(() => ({
    useLocalWhisper: false,
    whisperModel: 'base',
    preferredLanguage: 'auto',
    useReasoningModel: true,
    reasoningModel: 'gpt-4',
    openaiApiKey: '',
    dictationKey: '`',
    setUseLocalWhisper: vi.fn(),
    setWhisperModel: vi.fn(),
    setPreferredLanguage: vi.fn(),
    setOpenaiApiKey: vi.fn(),
    setDictationKey: mockSetDictationKey,
    updateTranscriptionSettings: mockUpdateTranscriptionSettings,
    updateReasoningSettings: mockUpdateReasoningSettings,
    updateApiKeys: mockUpdateApiKeys,
  }))
}));

vi.mock('../../../src/hooks/useDialogs', () => ({
  useDialogs: vi.fn(() => ({
    alertDialog: { open: false, title: '', description: '' },
    showAlertDialog: mockShowAlertDialog,
    hideAlertDialog: mockHideAlertDialog,
  }))
}));

vi.mock('../../../src/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    micPermissionGranted: mockMicPermissionGranted,
    accessibilityPermissionGranted: mockAccessibilityPermissionGranted,
    requestMicPermission: mockRequestMicPermission,
    testAccessibilityPermission: mockTestAccessibilityPermission,
    setMicPermissionGranted: mockSetMicPermissionGranted,
    setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
  }))
}));

vi.mock('../../../src/hooks/useWhisper', () => ({
  useWhisper: vi.fn(() => ({
    isInstalling: false,
    installProgress: 0,
    installStatus: '',
    isModelDownloading: false,
    modelDownloadProgress: 0,
    modelDownloadStatus: '',
    checkWhisperInstalled: vi.fn().mockResolvedValue(true),
    installWhisper: vi.fn().mockResolvedValue(true),
    downloadModel: vi.fn().mockResolvedValue(true),
    setupProgressListener: vi.fn(),
  }))
}));

vi.mock('../../../src/hooks/usePython', () => ({
  usePython: vi.fn(() => ({
    isPythonInstalled: true,
    isChecking: false,
    checkPythonInstalled: vi.fn().mockResolvedValue(true),
  }))
}));

vi.mock('../../../src/hooks/useClipboard', () => ({
  useClipboard: vi.fn(() => ({
    pasteFromClipboard: vi.fn().mockResolvedValue(undefined),
    pasteFromClipboardWithFallback: vi.fn().mockResolvedValue(undefined),
  }))
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn()
  })),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock agentName utility
vi.mock('../../../src/utils/agentName', () => ({
  setAgentName: vi.fn(),
  getAgentName: vi.fn().mockReturnValue('Agent'),
}));

// Mock languages utility
vi.mock('../../../src/utils/languages', () => ({
  getLanguageLabel: vi.fn((code: string) => {
    const labels: Record<string, string> = {
      'auto': 'Auto-detect',
      'en': 'English',
      'es': 'Spanish',
    };
    return labels[code] || code;
  }),
  getReasoningModelLabel: vi.fn((model: string) => model),
}));

// Mock child components that are complex
vi.mock('../../../src/components/TitleBar', () => ({
  default: ({ showTitle, className }: { showTitle?: boolean; className?: string }) => (
    <div data-testid="title-bar" className={className}>
      {showTitle && <span>Ollie</span>}
    </div>
  )
}));

vi.mock('../../../src/components/WhisperModelPicker', () => ({
  default: ({ selectedModel, onModelSelect }: { selectedModel: string; onModelSelect: (model: string) => void }) => (
    <div data-testid="whisper-model-picker">
      <select 
        data-testid="model-select"
        value={selectedModel}
        onChange={(e) => onModelSelect(e.target.value)}
      >
        <option value="base">Base</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
      </select>
    </div>
  )
}));

vi.mock('../../../src/components/ui/ProcessingModeSelector', () => ({
  default: ({ useLocalWhisper, setUseLocalWhisper }: { useLocalWhisper: boolean; setUseLocalWhisper: (value: boolean) => void }) => (
    <div data-testid="processing-mode-selector">
      <button 
        data-testid="local-mode-btn"
        onClick={() => setUseLocalWhisper(true)}
        className={useLocalWhisper ? 'selected' : ''}
      >
        Local Processing
      </button>
      <button 
        data-testid="cloud-mode-btn"
        onClick={() => setUseLocalWhisper(false)}
        className={!useLocalWhisper ? 'selected' : ''}
      >
        Cloud Processing
      </button>
    </div>
  )
}));

vi.mock('../../../src/components/ui/ApiKeyInput', () => ({
  default: ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label?: string }) => (
    <div data-testid="api-key-input">
      <label>{label || 'API Key'}</label>
      <input 
        data-testid="api-key-field"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}));

vi.mock('../../../src/components/ui/StepProgress', () => ({
  default: ({ steps, currentStep }: { steps: Array<{ title: string }>; currentStep: number }) => (
    <div data-testid="step-progress">
      {steps.map((step, index) => (
        <span 
          key={step.title} 
          data-testid={`step-${index}`}
          data-active={index === currentStep}
        >
          {step.title}
        </span>
      ))}
    </div>
  )
}));

vi.mock('../../../src/components/ui/PermissionCard', () => ({
  default: ({ 
    title, 
    description, 
    granted, 
    onRequest, 
    buttonText 
  }: { 
    icon: React.ComponentType;
    title: string; 
    description: string; 
    granted: boolean; 
    onRequest: () => void; 
    buttonText: string;
  }) => (
    <div data-testid={`permission-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <span data-testid="permission-title">{title}</span>
      <span data-testid="permission-description">{description}</span>
      <span data-testid="permission-granted">{granted ? 'granted' : 'not-granted'}</span>
      {!granted && (
        <button onClick={onRequest} data-testid="permission-request-button">
          {buttonText}
        </button>
      )}
    </div>
  )
}));

vi.mock('../../../src/components/ui/LanguageSelector', () => ({
  default: ({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) => (
    <select 
      data-testid="language-selector" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="auto">Auto-detect</option>
      <option value="en">English</option>
      <option value="es">Spanish</option>
    </select>
  )
}));

vi.mock('../../../src/components/ui/Keyboard', () => ({
  default: ({ selectedKey, setSelectedKey }: { selectedKey: string; setSelectedKey: (key: string) => void }) => (
    <div data-testid="interactive-keyboard">
      <span data-testid="selected-key">{selectedKey}</span>
      {['`', 'F1', 'F2', 'F3', 'A', 'B', 'C'].map((key) => (
        <button 
          key={key}
          data-testid={`key-${key}`}
          onClick={() => setSelectedKey(key)}
          className={selectedKey === key ? 'selected' : ''}
        >
          {key}
        </button>
      ))}
    </div>
  )
}));

// Import after mocks are set up
import OnboardingFlow from '../../../src/components/OnboardingFlow';
import { useLocalStorage } from '../../../src/hooks/useLocalStorage';
import { usePermissions } from '../../../src/hooks/usePermissions';
import { setAgentName } from '../../../src/utils/agentName';

// Type the mocked functions
const mockUseLocalStorage = useLocalStorage as ReturnType<typeof vi.fn>;
const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>;

describe('OnboardingFlow Component', () => {
  // Store original electronAPI
  let originalElectronAPI: typeof window.electronAPI;
  let mockOnComplete: ReturnType<typeof vi.fn>;
  let currentStep: number;
  let mockSetCurrentStep: ReturnType<typeof vi.fn>;
  let mockRemoveCurrentStep: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset permission states
    mockMicPermissionGranted = false;
    mockAccessibilityPermissionGranted = false;
    currentStep = 0;
    mockOnComplete = vi.fn();
    mockSetCurrentStep = vi.fn((newStep: number) => {
      currentStep = newStep;
    });
    mockRemoveCurrentStep = vi.fn();

    // Update useLocalStorage mock to track current step
    mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'onboardingCurrentStep') {
        return [currentStep, mockSetCurrentStep, mockRemoveCurrentStep];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    // Update usePermissions mock
    mockUsePermissions.mockReturnValue({
      micPermissionGranted: mockMicPermissionGranted,
      accessibilityPermissionGranted: mockAccessibilityPermissionGranted,
      requestMicPermission: mockRequestMicPermission,
      testAccessibilityPermission: mockTestAccessibilityPermission,
      setMicPermissionGranted: mockSetMicPermissionGranted,
      setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
    });

    // Store original and set up mock electronAPI
    originalElectronAPI = window.electronAPI;
    
    window.electronAPI = {
      hideWindow: vi.fn().mockResolvedValue(undefined),
      showDictationPanel: vi.fn().mockResolvedValue(undefined),
      windowMinimize: vi.fn().mockResolvedValue(undefined),
      windowMaximize: vi.fn().mockResolvedValue(undefined),
      windowClose: vi.fn().mockResolvedValue(undefined),
      windowIsMaximized: vi.fn().mockResolvedValue(false),
      startWindowDrag: vi.fn().mockResolvedValue(undefined),
      stopWindowDrag: vi.fn().mockResolvedValue(undefined),
      updateHotkey: vi.fn().mockResolvedValue({ success: true }),
      onToggleDictation: vi.fn(),
      saveTranscription: vi.fn().mockResolvedValue({ id: 1 }),
      getTranscriptions: vi.fn().mockResolvedValue([]),
      deleteTranscription: vi.fn().mockResolvedValue({ success: true }),
      clearTranscriptions: vi.fn().mockResolvedValue({ cleared: 0 }),
      pasteText: vi.fn().mockResolvedValue(undefined),
      readClipboard: vi.fn().mockResolvedValue(''),
      writeClipboard: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeStart: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeChunk: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeEnd: vi.fn().mockResolvedValue({ success: true, text: '' }),
      streamingTranscribeAbort: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeStatus: vi.fn().mockResolvedValue({ isActive: false }),
      transcribeAWS: vi.fn().mockResolvedValue({ text: '', confidence: 0.95 }),
      invokeBedrockModel: vi.fn().mockResolvedValue(''),
      getAWSCredentials: vi.fn().mockResolvedValue({ accessKeyId: '', secretAccessKey: '', region: 'us-east-1' }),
      saveAWSCredentials: vi.fn().mockResolvedValue({ success: true }),
      getAnthropicKey: vi.fn().mockResolvedValue(''),
      saveAnthropicKey: vi.fn().mockResolvedValue({ success: true }),
      getActiveAppContext: vi.fn().mockResolvedValue({ appName: 'Unknown', bundleId: null, executablePath: null, windowTitle: null, platform: 'darwin' }),
      connectionWarmup: vi.fn().mockResolvedValue({ success: true }),
      connectionStatus: vi.fn().mockResolvedValue({ isReady: true, bedrockWarmed: true, transcribeWarmed: true, lastWarmupTime: Date.now() }),
      connectionHealthCheck: vi.fn().mockResolvedValue({ healthy: true }),
      connectionIsReady: vi.fn().mockResolvedValue(true),
      connectionReset: vi.fn().mockResolvedValue({ success: true }),
      onStreamingPartial: vi.fn(),
      onStreamingFinal: vi.fn(),
      onStreamingLanguage: vi.fn(),
      onStreamingError: vi.fn(),
      onNoAudioDetected: vi.fn(),
      checkForUpdates: vi.fn().mockResolvedValue({ updateAvailable: false }),
      downloadUpdate: vi.fn().mockResolvedValue({ success: true }),
      installUpdate: vi.fn().mockResolvedValue({ success: true }),
      getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
      getUpdateStatus: vi.fn().mockResolvedValue({ status: 'idle' }),
      onUpdateAvailable: vi.fn(),
      onUpdateNotAvailable: vi.fn(),
      onUpdateDownloaded: vi.fn(),
      onUpdateDownloadProgress: vi.fn(),
      onUpdateError: vi.fn(),
      cleanupApp: vi.fn().mockResolvedValue({ success: true }),
      openExternal: vi.fn().mockResolvedValue(undefined),
      debugLog: vi.fn().mockResolvedValue(undefined),
      removeAllListeners: vi.fn()
    } as unknown as typeof window.electronAPI;
  });

  afterEach(() => {
    // Restore original electronAPI
    window.electronAPI = originalElectronAPI;
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 3.1: Welcome Step Rendering
  // ===========================================================================
  describe('Requirement 3.1: Welcome Step Rendering', () => {
    it('should display the welcome step with "Welcome to Ollie" heading', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const heading = screen.getByText('Welcome to Ollie');
      expectInDocument(heading);
    });

    it('should display feature highlights in the welcome step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      // Check for feature highlights
      expect(screen.getByText(/Turn your voice into text instantly/)).not.toBeNull();
      expect(screen.getByText(/Works anywhere on your computer/)).not.toBeNull();
      expect(screen.getByText(/Your privacy is protected/)).not.toBeNull();
    });

    it('should display setup instructions in the welcome step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const instructions = screen.getByText(/Let's set up your voice dictation/);
      expectInDocument(instructions);
    });

    it('should display the step progress indicator', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const stepProgress = screen.getByTestId('step-progress');
      expectInDocument(stepProgress);
    });

    it('should show Welcome as the first step in progress', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const welcomeStep = screen.getByTestId('step-0');
      expect(welcomeStep.getAttribute('data-active')).toBe('true');
      expect(welcomeStep.textContent).toBe('Welcome');
    });

    it('should enable the Next button on welcome step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });

    it('should disable the Previous button on welcome step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const prevButton = screen.getByRole('button', { name: /Previous/i });
      expect(prevButton.hasAttribute('disabled')).toBe(true);
    });
  });

  // ===========================================================================
  // Requirement 3.2: Setup Step with Permission Cards (Step 3 in actual component)
  // ===========================================================================
  describe('Requirement 3.2: Setup Step with Permission Cards', () => {
    beforeEach(() => {
      // Start at step 3 (Permissions)
      currentStep = 3;
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [3, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
    });

    it('should display "Grant Permissions" heading on permissions step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const heading = screen.getByText('Grant Permissions');
      expectInDocument(heading);
    });

    it('should display microphone permission card', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const micCard = screen.getByTestId('permission-card-microphone-access');
      expectInDocument(micCard);
      
      const title = screen.getAllByTestId('permission-title').find(el => 
        el.textContent === 'Microphone Access'
      );
      expect(title).not.toBeUndefined();
    });

    it('should display accessibility permission card', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const accessibilityCard = screen.getByTestId('permission-card-accessibility-permission');
      expectInDocument(accessibilityCard);
      
      const title = screen.getAllByTestId('permission-title').find(el => 
        el.textContent === 'Accessibility Permission'
      );
      expect(title).not.toBeUndefined();
    });

    it('should display privacy note on permissions step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const privacyNote = screen.getByText(/Privacy Note/);
      expectInDocument(privacyNote);
    });

    it('should call requestMicPermission when mic permission button is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const micCard = screen.getByTestId('permission-card-microphone-access');
      const requestButton = micCard.querySelector('[data-testid="permission-request-button"]');
      
      if (requestButton) {
        await user.click(requestButton);
        expect(mockRequestMicPermission).toHaveBeenCalled();
      }
    });

    it('should call testAccessibilityPermission when accessibility button is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const accessibilityCard = screen.getByTestId('permission-card-accessibility-permission');
      const requestButton = accessibilityCard.querySelector('[data-testid="permission-request-button"]');
      
      if (requestButton) {
        await user.click(requestButton);
        expect(mockTestAccessibilityPermission).toHaveBeenCalled();
      }
    });
  });

  // ===========================================================================
  // Requirement 3.3: Microphone Permission Gating
  // ===========================================================================
  describe('Requirement 3.3: Microphone Permission Gating', () => {
    beforeEach(() => {
      currentStep = 3;
      mockMicPermissionGranted = false;
      mockAccessibilityPermissionGranted = true;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [3, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: false,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
    });

    it('should disable Next button when microphone permission is not granted', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(true);
    });

    it('should show microphone permission as not granted', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const micCard = screen.getByTestId('permission-card-microphone-access');
      const grantedStatus = micCard.querySelector('[data-testid="permission-granted"]');
      expect(grantedStatus?.textContent).toBe('not-granted');
    });

    it('should enable Next button when microphone permission is granted', () => {
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
      
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 3.4: Accessibility Permission Gating
  // ===========================================================================
  describe('Requirement 3.4: Accessibility Permission Gating', () => {
    beforeEach(() => {
      currentStep = 3;
      mockMicPermissionGranted = true;
      mockAccessibilityPermissionGranted = false;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [3, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: false,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
    });

    it('should disable Next button when accessibility permission is not granted', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(true);
    });

    it('should show accessibility permission as not granted', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const accessibilityCard = screen.getByTestId('permission-card-accessibility-permission');
      const grantedStatus = accessibilityCard.querySelector('[data-testid="permission-granted"]');
      expect(grantedStatus?.textContent).toBe('not-granted');
    });

    it('should enable Next button when accessibility permission is granted', () => {
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
      
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });

    it('should disable Next button when both permissions are not granted', () => {
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: false,
        accessibilityPermissionGranted: false,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
      
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(true);
    });
  });

  // ===========================================================================
  // Requirement 3.5: Hotkey Step with Interactive Keyboard (Step 4)
  // ===========================================================================
  describe('Requirement 3.5: Hotkey Step with Interactive Keyboard', () => {
    beforeEach(() => {
      currentStep = 4;
      mockMicPermissionGranted = true;
      mockAccessibilityPermissionGranted = true;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [4, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
    });

    it('should display "Choose Your Hotkey" heading on hotkey step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const heading = screen.getByText('Choose Your Hotkey');
      expectInDocument(heading);
    });

    it('should display interactive keyboard for key selection', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const keyboard = screen.getByTestId('interactive-keyboard');
      expectInDocument(keyboard);
    });

    it('should display hotkey input field', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const hotkeyInput = screen.getByPlaceholderText(/Default: ` \(backtick\)/);
      expectInDocument(hotkeyInput);
    });

    it('should display instructions for using the hotkey', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const instructions = screen.getByText(/Press this key from anywhere to start\/stop dictation/);
      expectInDocument(instructions);
    });

    it('should display "Click any key to select it" instruction', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const instruction = screen.getByText(/Click any key to select it/);
      expectInDocument(instruction);
    });
  });

  // ===========================================================================
  // Requirement 3.6: Hotkey Selection Updates Display
  // ===========================================================================
  describe('Requirement 3.6: Hotkey Selection Updates Display', () => {
    beforeEach(() => {
      currentStep = 4;
      mockMicPermissionGranted = true;
      mockAccessibilityPermissionGranted = true;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [4, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
    });

    it('should display the default hotkey in the input', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const hotkeyInput = screen.getByPlaceholderText(/Default: ` \(backtick\)/) as HTMLInputElement;
      expect(hotkeyInput.value).toBe('`');
    });

    it('should update hotkey display when a key is selected from keyboard', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      // Click on F1 key in the interactive keyboard
      const f1Key = screen.getByTestId('key-F1');
      await user.click(f1Key);
      
      // The selected key should be updated
      const selectedKey = screen.getByTestId('selected-key');
      expect(selectedKey.textContent).toBe('F1');
    });

    it('should enable Next button when a valid hotkey is selected', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });

    it('should disable Next button when hotkey is empty', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const hotkeyInput = screen.getByPlaceholderText(/Default: ` \(backtick\)/) as HTMLInputElement;
      
      // Clear the input
      await user.clear(hotkeyInput);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(true);
    });

    it('should allow typing a custom hotkey in the input', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const hotkeyInput = screen.getByPlaceholderText(/Default: ` \(backtick\)/) as HTMLInputElement;
      
      await user.clear(hotkeyInput);
      await user.type(hotkeyInput, 'X');
      
      expect(hotkeyInput.value).toBe('X');
    });
  });

  // ===========================================================================
  // Requirement 3.7: Processing Mode / Smart Styling Step (Step 1)
  // ===========================================================================
  describe('Requirement 3.7: Processing Mode Step (Smart Styling Options)', () => {
    beforeEach(() => {
      currentStep = 1;
      mockMicPermissionGranted = true;
      mockAccessibilityPermissionGranted = true;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [1, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
    });

    it('should display "Choose Your Processing Mode" heading', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const heading = screen.getByText('Choose Your Processing Mode');
      expectInDocument(heading);
    });

    it('should display processing mode selector', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const selector = screen.getByTestId('processing-mode-selector');
      expectInDocument(selector);
    });

    it('should display local processing option', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const localOption = screen.getByTestId('local-mode-btn');
      expectInDocument(localOption);
    });

    it('should display cloud processing option', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const cloudOption = screen.getByTestId('cloud-mode-btn');
      expectInDocument(cloudOption);
    });

    it('should enable Next button on processing mode step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 3.8: Completion and Settings Save (Step 7)
  // ===========================================================================
  describe('Requirement 3.8: Completion and Settings Save', () => {
    beforeEach(() => {
      currentStep = 7;
      mockMicPermissionGranted = true;
      mockAccessibilityPermissionGranted = true;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [7, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
    });

    it('should display "You\'re All Set!" heading on completion step', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const heading = screen.getByText("You're All Set!");
      expectInDocument(heading);
    });

    it('should display setup summary', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const summary = screen.getByText('Your Setup Summary:');
      expectInDocument(summary);
    });

    it('should display hotkey in summary', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const hotkeyLabel = screen.getByText('Hotkey:');
      expectInDocument(hotkeyLabel);
    });

    it('should display language in summary', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const languageLabel = screen.getByText('Language:');
      expectInDocument(languageLabel);
    });

    it('should display "Finish Setup" button instead of "Next"', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
      expectInDocument(finishButton);
      
      // Should not have a "Next" button
      expect(screen.queryByRole('button', { name: /^Next$/i })).toBeNull();
    });

    it('should call onComplete when Finish Setup is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
      await user.click(finishButton);
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should save settings when Finish Setup is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
      await user.click(finishButton);
      
      await waitFor(() => {
        // Check that settings were saved
        expect(mockSetDictationKey).toHaveBeenCalled();
        expect(mockUpdateTranscriptionSettings).toHaveBeenCalled();
        expect(setAgentName).toHaveBeenCalled();
      });
    });

    it('should mark onboarding as complete in localStorage', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
      await user.click(finishButton);
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('onboardingCompleted', 'true');
      });
    });

    it('should remove current step from localStorage on completion', async () => {
      const user = userEvent.setup();
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const finishButton = screen.getByRole('button', { name: /Finish Setup/i });
      await user.click(finishButton);
      
      await waitFor(() => {
        expect(mockRemoveCurrentStep).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================
  describe('Navigation', () => {
    it('should navigate to next step when Next button is clicked', async () => {
      const user = userEvent.setup();
      currentStep = 0;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [currentStep, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      await user.click(nextButton);
      
      expect(mockSetCurrentStep).toHaveBeenCalledWith(1);
    });

    it('should navigate to previous step when Previous button is clicked', async () => {
      const user = userEvent.setup();
      currentStep = 4;
      mockMicPermissionGranted = true;
      mockAccessibilityPermissionGranted = true;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [4, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
      
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const prevButton = screen.getByRole('button', { name: /Previous/i });
      await user.click(prevButton);
      
      expect(mockSetCurrentStep).toHaveBeenCalledWith(3);
    });
  });

  // ===========================================================================
  // Step Progress Tests
  // ===========================================================================
  describe('Step Progress', () => {
    it('should display all 8 steps in the progress indicator', () => {
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      expect(screen.getByTestId('step-0').textContent).toBe('Welcome');
      expect(screen.getByTestId('step-1').textContent).toBe('Privacy');
      expect(screen.getByTestId('step-2').textContent).toBe('Setup');
      expect(screen.getByTestId('step-3').textContent).toBe('Permissions');
      expect(screen.getByTestId('step-4').textContent).toBe('Hotkey');
      expect(screen.getByTestId('step-5').textContent).toBe('Test');
      expect(screen.getByTestId('step-6').textContent).toBe('Agent Name');
      expect(screen.getByTestId('step-7').textContent).toBe('Finish');
    });

    it('should mark current step as active', () => {
      currentStep = 4;
      
      mockUseLocalStorage.mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'onboardingCurrentStep') {
          return [4, mockSetCurrentStep, mockRemoveCurrentStep];
        }
        return [defaultValue, vi.fn(), vi.fn()];
      });
      
      mockUsePermissions.mockReturnValue({
        micPermissionGranted: true,
        accessibilityPermissionGranted: true,
        requestMicPermission: mockRequestMicPermission,
        testAccessibilityPermission: mockTestAccessibilityPermission,
        setMicPermissionGranted: mockSetMicPermissionGranted,
        setAccessibilityPermissionGranted: mockSetAccessibilityPermissionGranted,
      });
      
      render(<OnboardingFlow onComplete={mockOnComplete} />);
      
      const step4 = screen.getByTestId('step-4');
      expect(step4.getAttribute('data-active')).toBe('true');
    });
  });
});
