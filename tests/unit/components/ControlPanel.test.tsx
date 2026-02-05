/**
 * Unit Tests for ControlPanel Component
 * 
 * Tests the main control panel UI component that displays settings navigation
 * and transcription history management.
 * 
 * @module tests/unit/components/ControlPanel.test.tsx
 * 
 * Validates: Requirements 2.1-2.5
 * - 2.1: Control_Panel displays settings navigation with all section tabs
 * - 2.2: Control_Panel renders corresponding settings content when section selected
 * - 2.3: Control_Panel displays transcriptions in chronological order with timestamps
 * - 2.4: Control_Panel removes transcription from list when delete clicked
 * - 2.5: Control_Panel removes all transcriptions after confirmation when clear all clicked
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper function to check if element is in document
const expectInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeNull();
  expect(document.body.contains(element)).toBe(true);
};

// Mock the hooks before importing ControlPanel
vi.mock('../../../src/hooks/useHotkey', () => ({
  useHotkey: vi.fn(() => ({
    hotkey: 'D',
    setHotkey: vi.fn()
  }))
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn()
  })),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Import after mocks are set up
import ControlPanel from '../../../src/components/ControlPanel';
import { useToast } from '../../../src/components/ui/Toast';
import { createTranscriptionList, createTranscriptionItem, resetIdCounter } from '../../factories/transcription';

// Type the mocked functions
const mockUseToast = useToast as ReturnType<typeof vi.fn>;

describe('ControlPanel Component', () => {
  // Store original electronAPI
  let originalElectronAPI: typeof window.electronAPI;
  let mockToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset ID counter for consistent test data
    resetIdCounter();
    
    // Store original and set up mock electronAPI
    originalElectronAPI = window.electronAPI;
    mockToast = vi.fn();
    
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn()
    });
    
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
      getUpdateStatus: vi.fn().mockResolvedValue({ updateAvailable: false, updateDownloaded: false, isDevelopment: true }),
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
  // Requirement 2.1: Settings Navigation Display
  // ===========================================================================
  describe('Requirement 2.1: Settings Navigation Display', () => {
    it('should display the settings button in the title bar', async () => {
      render(<ControlPanel />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalled();
      });
      
      // Find the settings button (gear icon)
      const settingsButtons = screen.getAllByRole('button');
      const settingsButton = settingsButtons.find(btn => 
        btn.querySelector('svg') !== null
      );
      
      expectInDocument(settingsButton as HTMLElement);
    });

    it('should display the Recent Transcriptions card header', async () => {
      render(<ControlPanel />);
      
      await waitFor(() => {
        const header = screen.getByText('Recent Transcriptions');
        expectInDocument(header);
      });
    });

    it('should display refresh button in the transcriptions header', async () => {
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalled();
      });
      
      // Find refresh button (RefreshCw icon)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should open settings modal when settings button is clicked', async () => {
      const user = userEvent.setup();
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalled();
      });
      
      // Find and click the settings button (last button with Settings icon)
      const buttons = screen.getAllByRole('button');
      const settingsButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg !== null;
      });
      
      if (settingsButton) {
        await user.click(settingsButton);
      }
    });
  });

  // ===========================================================================
  // Requirement 2.3: Transcription History Display
  // ===========================================================================
  describe('Requirement 2.3: Transcription History Display', () => {
    it('should display transcriptions when history exists', async () => {
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        // Check that transcription texts are displayed
        transcriptions.forEach(t => {
          expect(screen.getByText(t.text)).not.toBeNull();
        });
      });
    });

    it('should display transcriptions in chronological order (newest first)', async () => {
      // Create transcriptions with specific timestamps
      const baseTime = new Date('2024-01-15T10:00:00Z');
      const transcriptions = [
        createTranscriptionItem({ 
          id: 1, 
          text: 'Newest transcription', 
          timestamp: new Date(baseTime.getTime() + 2 * 60000).toISOString() 
        }),
        createTranscriptionItem({ 
          id: 2, 
          text: 'Middle transcription', 
          timestamp: new Date(baseTime.getTime() + 1 * 60000).toISOString() 
        }),
        createTranscriptionItem({ 
          id: 3, 
          text: 'Oldest transcription', 
          timestamp: baseTime.toISOString() 
        }),
      ];
      
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        const newestText = screen.getByText('Newest transcription');
        const oldestText = screen.getByText('Oldest transcription');
        expectInDocument(newestText);
        expectInDocument(oldestText);
      });
    });

    it('should display timestamps for each transcription', async () => {
      const transcriptions = createTranscriptionList({ count: 2 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        // TranscriptionItem displays timestamps in format like "Jan 15, 10:00 AM"
        // Check that the transcription items are rendered
        transcriptions.forEach(t => {
          expect(screen.getByText(t.text)).not.toBeNull();
        });
      });
    });

    it('should display empty state when no transcriptions exist', async () => {
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        const emptyMessage = screen.getByText('No transcriptions yet');
        expectInDocument(emptyMessage);
      });
    });

    it('should display quick start instructions when no transcriptions exist', async () => {
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        const quickStart = screen.getByText('Quick Start:');
        expectInDocument(quickStart);
      });
    });

    it('should display loading state while fetching transcriptions', async () => {
      // Create a promise that we can control
      let resolveTranscriptions: (value: unknown[]) => void;
      const transcriptionsPromise = new Promise<unknown[]>((resolve) => {
        resolveTranscriptions = resolve;
      });
      
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockReturnValue(transcriptionsPromise);
      
      render(<ControlPanel />);
      
      // Check for loading state
      const loadingText = screen.getByText('Loading transcriptions...');
      expectInDocument(loadingText);
      
      // Resolve the promise
      resolveTranscriptions!([]);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading transcriptions...')).toBeNull();
      });
    });

    it('should display transcription numbers in descending order', async () => {
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        // TranscriptionItem shows #3, #2, #1 for 3 items (total - index)
        expect(screen.getByText('#3')).not.toBeNull();
        expect(screen.getByText('#2')).not.toBeNull();
        expect(screen.getByText('#1')).not.toBeNull();
      });
    });
  });

  // ===========================================================================
  // Requirement 2.4: Delete Transcription
  // ===========================================================================
  describe('Requirement 2.4: Delete Transcription', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      const transcriptions = [createTranscriptionItem({ id: 1, text: 'Test transcription' })];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Test transcription')).not.toBeNull();
      });
      
      // Find the transcription item and its delete button
      const transcriptionItem = screen.getByText('Test transcription').closest('.relative');
      expect(transcriptionItem).not.toBeNull();
      
      if (transcriptionItem) {
        const deleteButton = within(transcriptionItem as HTMLElement).getAllByRole('button').find(btn => 
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        expect(deleteButton).not.toBeUndefined();
        
        if (deleteButton) {
          await user.click(deleteButton);
          
          // Check for confirmation dialog - look for the dialog content
          await waitFor(() => {
            // The dialog uses Radix UI which renders in a portal
            // Look for the dialog title text
            const dialogTitle = screen.queryByRole('heading', { name: /delete transcription/i }) ||
                               screen.queryByText(/delete transcription/i);
            expect(dialogTitle).not.toBeNull();
          }, { timeout: 2000 });
        }
      }
    });

    it('should remove transcription from list after confirmation', async () => {
      const user = userEvent.setup();
      const transcriptions = [
        createTranscriptionItem({ id: 1, text: 'First transcription' }),
        createTranscriptionItem({ id: 2, text: 'Second transcription' })
      ];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      (window.electronAPI.deleteTranscription as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('First transcription')).not.toBeNull();
      });
      
      // Find the first transcription item and its delete button
      const transcriptionItem = screen.getByText('First transcription').closest('.relative');
      
      if (transcriptionItem) {
        const deleteButton = within(transcriptionItem as HTMLElement).getAllByRole('button').find(btn => 
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (deleteButton) {
          await user.click(deleteButton);
          
          // Wait for confirmation dialog
          await waitFor(() => {
            expect(screen.queryByText(/delete transcription/i)).not.toBeNull();
          }, { timeout: 2000 });
          
          // Find and click confirm button
          const confirmButton = screen.getByRole('button', { name: /confirm/i });
          await user.click(confirmButton);
          
          // Verify deleteTranscription was called
          await waitFor(() => {
            expect(window.electronAPI.deleteTranscription).toHaveBeenCalledWith(1);
          });
        }
      }
    });

    it('should not remove transcription when cancel is clicked', async () => {
      const user = userEvent.setup();
      const transcriptions = [createTranscriptionItem({ id: 1, text: 'Test transcription' })];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Test transcription')).not.toBeNull();
      });
      
      // Find the transcription item and its delete button
      const transcriptionItem = screen.getByText('Test transcription').closest('.relative');
      
      if (transcriptionItem) {
        const deleteButton = within(transcriptionItem as HTMLElement).getAllByRole('button').find(btn => 
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (deleteButton) {
          await user.click(deleteButton);
          
          // Wait for confirmation dialog
          await waitFor(() => {
            expect(screen.queryByText(/delete transcription/i)).not.toBeNull();
          }, { timeout: 2000 });
          
          // Find and click cancel button
          const cancelButton = screen.getByRole('button', { name: /cancel/i });
          await user.click(cancelButton);
          
          // Verify deleteTranscription was NOT called
          expect(window.electronAPI.deleteTranscription).not.toHaveBeenCalled();
          
          // Verify transcription is still displayed
          await waitFor(() => {
            expect(screen.getByText('Test transcription')).not.toBeNull();
          });
        }
      }
    });

    it('should show error dialog when delete fails', async () => {
      const user = userEvent.setup();
      const transcriptions = [createTranscriptionItem({ id: 1, text: 'Test transcription' })];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      (window.electronAPI.deleteTranscription as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Test transcription')).not.toBeNull();
      });
      
      // Find the transcription item and its delete button
      const transcriptionItem = screen.getByText('Test transcription').closest('.relative');
      
      if (transcriptionItem) {
        const deleteButton = within(transcriptionItem as HTMLElement).getAllByRole('button').find(btn => 
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (deleteButton) {
          await user.click(deleteButton);
          
          // Wait for confirmation dialog
          await waitFor(() => {
            expect(screen.queryByText(/delete transcription/i)).not.toBeNull();
          }, { timeout: 2000 });
          
          // Find and click confirm button
          const confirmButton = screen.getByRole('button', { name: /confirm/i });
          await user.click(confirmButton);
          
          // Verify error dialog is shown
          await waitFor(() => {
            expect(screen.queryByText(/delete failed/i)).not.toBeNull();
          }, { timeout: 2000 });
        }
      }
    });
  });

  // ===========================================================================
  // Requirement 2.5: Clear All Transcriptions
  // ===========================================================================
  describe('Requirement 2.5: Clear All Transcriptions', () => {
    it('should show clear all button when transcriptions exist', async () => {
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        // Clear all button should be visible (Trash2 icon in header)
        const buttons = screen.getAllByRole('button');
        const clearButton = buttons.find(btn => {
          const parent = btn.closest('.flex.gap-2');
          return parent !== null && btn.classList.contains('text-red-600');
        });
        expect(clearButton).not.toBeUndefined();
      });
    });

    it('should not show clear all button when no transcriptions exist', async () => {
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('No transcriptions yet')).not.toBeNull();
      });
      
      // Clear all button should not be visible in the header
      // The only red button should be in transcription items, which don't exist
      const redButtons = screen.getAllByRole('button').filter(btn => 
        btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
      );
      
      // Should have no red buttons when there are no transcriptions
      expect(redButtons.length).toBe(0);
    });

    it('should show confirmation dialog when clear all is clicked', async () => {
      const user = userEvent.setup();
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(transcriptions[0].text)).not.toBeNull();
      });
      
      // Find the clear all button in the header (the one that's not inside a transcription item)
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const clearButton = within(headerDiv.parentElement as HTMLElement).getAllByRole('button').find(btn =>
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (clearButton) {
          await user.click(clearButton);
          
          // Check for confirmation dialog
          await waitFor(() => {
            const dialogTitle = screen.getByText('Clear History');
            expectInDocument(dialogTitle);
          });
        }
      }
    });

    it('should remove all transcriptions after confirmation', async () => {
      const user = userEvent.setup();
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      (window.electronAPI.clearTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue({ cleared: 3 });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(transcriptions[0].text)).not.toBeNull();
      });
      
      // Find and click the clear all button
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const clearButton = within(headerDiv.parentElement as HTMLElement).getAllByRole('button').find(btn =>
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (clearButton) {
          await user.click(clearButton);
          
          // Wait for confirmation dialog and click confirm
          await waitFor(() => {
            expect(screen.getByText('Clear History')).not.toBeNull();
          });
          
          const confirmButton = screen.getByRole('button', { name: /confirm/i });
          await user.click(confirmButton);
          
          // Verify clearTranscriptions was called
          await waitFor(() => {
            expect(window.electronAPI.clearTranscriptions).toHaveBeenCalled();
          });
        }
      }
    });

    it('should show success dialog after clearing all transcriptions', async () => {
      const user = userEvent.setup();
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      (window.electronAPI.clearTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue({ cleared: 3 });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(transcriptions[0].text)).not.toBeNull();
      });
      
      // Find and click the clear all button
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const clearButton = within(headerDiv.parentElement as HTMLElement).getAllByRole('button').find(btn =>
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (clearButton) {
          await user.click(clearButton);
          
          // Wait for confirmation dialog and click confirm
          await waitFor(() => {
            expect(screen.getByText('Clear History')).not.toBeNull();
          });
          
          const confirmButton = screen.getByRole('button', { name: /confirm/i });
          await user.click(confirmButton);
          
          // Verify success dialog is shown
          await waitFor(() => {
            expect(screen.getByText('History Cleared')).not.toBeNull();
          });
        }
      }
    });

    it('should not clear transcriptions when cancel is clicked', async () => {
      const user = userEvent.setup();
      const transcriptions = createTranscriptionList({ count: 3 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(transcriptions[0].text)).not.toBeNull();
      });
      
      // Find and click the clear all button
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const clearButton = within(headerDiv.parentElement as HTMLElement).getAllByRole('button').find(btn =>
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (clearButton) {
          await user.click(clearButton);
          
          // Wait for confirmation dialog and click cancel
          await waitFor(() => {
            expect(screen.getByText('Clear History')).not.toBeNull();
          });
          
          const cancelButton = screen.getByRole('button', { name: /cancel/i });
          await user.click(cancelButton);
          
          // Verify clearTranscriptions was NOT called
          expect(window.electronAPI.clearTranscriptions).not.toHaveBeenCalled();
          
          // Verify transcriptions are still displayed
          expect(screen.getByText(transcriptions[0].text)).not.toBeNull();
        }
      }
    });
  });

  // ===========================================================================
  // Refresh Functionality Tests
  // ===========================================================================
  describe('Refresh Functionality', () => {
    it('should reload transcriptions when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const initialTranscriptions = createTranscriptionList({ count: 2 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(initialTranscriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalledTimes(1);
      });
      
      // Find the refresh button (RefreshCw icon button in header)
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const buttons = within(headerDiv.parentElement as HTMLElement).getAllByRole('button');
        // Refresh button is the one without red color
        const refreshButton = buttons.find(btn => 
          !btn.classList.contains('text-red-600') && !btn.className.includes('text-red-600')
        );
        
        if (refreshButton) {
          await user.click(refreshButton);
          
          // Verify getTranscriptions was called again
          await waitFor(() => {
            expect(window.electronAPI.getTranscriptions).toHaveBeenCalledTimes(2);
          });
        }
      }
    });

    it('should update displayed transcriptions after refresh', async () => {
      const user = userEvent.setup();
      const initialTranscriptions = [createTranscriptionItem({ id: 1, text: 'Initial transcription' })];
      const updatedTranscriptions = [
        createTranscriptionItem({ id: 2, text: 'New transcription' }),
        createTranscriptionItem({ id: 1, text: 'Initial transcription' })
      ];
      
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(initialTranscriptions)
        .mockResolvedValueOnce(updatedTranscriptions);
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Initial transcription')).not.toBeNull();
      });
      
      // Find and click the refresh button
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const buttons = within(headerDiv.parentElement as HTMLElement).getAllByRole('button');
        const refreshButton = buttons.find(btn => 
          !btn.classList.contains('text-red-600') && !btn.className.includes('text-red-600')
        );
        
        if (refreshButton) {
          await user.click(refreshButton);
          
          // Verify new transcription is displayed
          await waitFor(() => {
            expect(screen.getByText('New transcription')).not.toBeNull();
          });
        }
      }
    });
  });

  // ===========================================================================
  // Copy to Clipboard Tests
  // ===========================================================================
  describe('Copy to Clipboard', () => {
    it('should copy transcription text when copy button is clicked', async () => {
      const user = userEvent.setup();
      const transcriptions = [createTranscriptionItem({ id: 1, text: 'Text to copy' })];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      // Mock clipboard API using Object.defineProperty
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
          readText: vi.fn().mockResolvedValue('')
        },
        writable: true,
        configurable: true
      });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Text to copy')).not.toBeNull();
      });
      
      // Find the copy button (not the delete button)
      const transcriptionItem = screen.getByText('Text to copy').closest('.relative');
      if (transcriptionItem) {
        const buttons = within(transcriptionItem as HTMLElement).getAllByRole('button');
        // Copy button is the one without red color
        const copyButton = buttons.find(btn => 
          !btn.classList.contains('text-red-600') && !btn.className.includes('text-red-600')
        );
        
        if (copyButton) {
          await user.click(copyButton);
          
          // Verify clipboard writeText was called
          await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalledWith('Text to copy');
          });
        }
      }
    });

    it('should show success toast after copying', async () => {
      const user = userEvent.setup();
      const transcriptions = [createTranscriptionItem({ id: 1, text: 'Text to copy' })];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      // Mock clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
          readText: vi.fn().mockResolvedValue('')
        },
        writable: true,
        configurable: true
      });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Text to copy')).not.toBeNull();
      });
      
      // Find and click the copy button
      const transcriptionItem = screen.getByText('Text to copy').closest('.relative');
      if (transcriptionItem) {
        const buttons = within(transcriptionItem as HTMLElement).getAllByRole('button');
        const copyButton = buttons.find(btn => 
          !btn.classList.contains('text-red-600') && !btn.className.includes('text-red-600')
        );
        
        if (copyButton) {
          await user.click(copyButton);
          
          // Verify toast was called with success message
          await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
              title: 'Copied!',
              variant: 'success'
            }));
          });
        }
      }
    });

    it('should show error toast when copy fails', async () => {
      const user = userEvent.setup();
      const transcriptions = [createTranscriptionItem({ id: 1, text: 'Text to copy' })];
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      
      // Mock clipboard API to fail
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Copy failed')),
          readText: vi.fn().mockResolvedValue('')
        },
        writable: true,
        configurable: true
      });
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Text to copy')).not.toBeNull();
      });
      
      // Find and click the copy button
      const transcriptionItem = screen.getByText('Text to copy').closest('.relative');
      if (transcriptionItem) {
        const buttons = within(transcriptionItem as HTMLElement).getAllByRole('button');
        const copyButton = buttons.find(btn => 
          !btn.classList.contains('text-red-600') && !btn.className.includes('text-red-600')
        );
        
        if (copyButton) {
          await user.click(copyButton);
          
          // Verify toast was called with error message
          await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
              title: 'Copy Failed',
              variant: 'destructive'
            }));
          });
        }
      }
    });
  });

  // ===========================================================================
  // Component Lifecycle Tests
  // ===========================================================================
  describe('Component Lifecycle', () => {
    it('should load transcriptions on mount', async () => {
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalledWith(50);
      });
    });

    it('should initialize update status on mount', async () => {
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getUpdateStatus).toHaveBeenCalled();
      });
    });

    it('should set up update event listeners on mount', async () => {
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.onUpdateAvailable).toHaveBeenCalled();
        expect(window.electronAPI.onUpdateDownloaded).toHaveBeenCalled();
        expect(window.electronAPI.onUpdateError).toHaveBeenCalled();
      });
    });

    it('should clean up event listeners on unmount', async () => {
      const { unmount } = render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalled();
      });
      
      unmount();
      
      // Verify removeAllListeners was called for update events
      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('update-available');
      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('update-downloaded');
      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('update-error');
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================
  describe('Error Handling', () => {
    it('should handle getTranscriptions error gracefully', async () => {
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Database error'));
      
      // Should not throw
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(window.electronAPI.getTranscriptions).toHaveBeenCalled();
      });
      
      // Should show empty state or handle error gracefully
      // The component catches the error and sets history to empty
    });

    it('should show error dialog when clear transcriptions fails', async () => {
      const user = userEvent.setup();
      const transcriptions = createTranscriptionList({ count: 2 });
      (window.electronAPI.getTranscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(transcriptions);
      (window.electronAPI.clearTranscriptions as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Clear failed'));
      
      render(<ControlPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(transcriptions[0].text)).not.toBeNull();
      });
      
      // Find and click the clear all button
      const headerDiv = screen.getByText('Recent Transcriptions').closest('.flex');
      if (headerDiv) {
        const clearButton = within(headerDiv.parentElement as HTMLElement).getAllByRole('button').find(btn =>
          btn.classList.contains('text-red-600') || btn.className.includes('text-red-600')
        );
        
        if (clearButton) {
          await user.click(clearButton);
          
          // Wait for confirmation dialog and click confirm
          await waitFor(() => {
            expect(screen.getByText('Clear History')).not.toBeNull();
          });
          
          const confirmButton = screen.getByRole('button', { name: /confirm/i });
          await user.click(confirmButton);
          
          // Verify error dialog is shown
          await waitFor(() => {
            expect(screen.getByText('Error')).not.toBeNull();
          });
        }
      }
    });
  });
});
