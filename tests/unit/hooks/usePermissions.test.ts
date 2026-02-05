/**
 * Unit Tests for usePermissions Hook
 * 
 * Tests the usePermissions hook that manages microphone and accessibility
 * permission states and provides functions to request/test these permissions.
 * 
 * @module tests/unit/hooks/usePermissions.test.ts
 * 
 * Validates: Requirements 17.4
 * - 17.4: usePermissions hook tests - Permission state retrieval and
 *         permission request functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePermissions } from '../../../src/hooks/usePermissions';

describe('usePermissions Hook', () => {
  // Store original implementations
  let originalAlert: typeof window.alert;
  let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Store original alert
    originalAlert = window.alert;
    window.alert = vi.fn();
    
    // Store original getUserMedia
    originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    
    // Reset mock permission state
    globalThis.mockMediaDevices.__setPermissionGranted(true);
    
    // Reset electronAPI mock
    globalThis.mockElectronAPI.__reset();
  });

  afterEach(() => {
    // Restore original implementations
    window.alert = originalAlert;
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 17.4: Permission State Retrieval
  // ===========================================================================
  describe('Permission State Retrieval', () => {
    it('should initialize with micPermissionGranted as false', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.micPermissionGranted).toBe(false);
    });

    it('should initialize with accessibilityPermissionGranted as false', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.accessibilityPermissionGranted).toBe(false);
    });

    it('should return all expected properties and functions', () => {
      const { result } = renderHook(() => usePermissions());

      // State properties
      expect(typeof result.current.micPermissionGranted).toBe('boolean');
      expect(typeof result.current.accessibilityPermissionGranted).toBe('boolean');

      // Functions
      expect(typeof result.current.requestMicPermission).toBe('function');
      expect(typeof result.current.testAccessibilityPermission).toBe('function');
      expect(typeof result.current.setMicPermissionGranted).toBe('function');
      expect(typeof result.current.setAccessibilityPermissionGranted).toBe('function');
    });

    it('should allow manual setting of micPermissionGranted state', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.micPermissionGranted).toBe(false);

      act(() => {
        result.current.setMicPermissionGranted(true);
      });

      expect(result.current.micPermissionGranted).toBe(true);
    });

    it('should allow manual setting of accessibilityPermissionGranted state', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.accessibilityPermissionGranted).toBe(false);

      act(() => {
        result.current.setAccessibilityPermissionGranted(true);
      });

      expect(result.current.accessibilityPermissionGranted).toBe(true);
    });

    it('should allow toggling permission states', () => {
      const { result } = renderHook(() => usePermissions());

      // Toggle mic permission on
      act(() => {
        result.current.setMicPermissionGranted(true);
      });
      expect(result.current.micPermissionGranted).toBe(true);

      // Toggle mic permission off
      act(() => {
        result.current.setMicPermissionGranted(false);
      });
      expect(result.current.micPermissionGranted).toBe(false);

      // Toggle accessibility permission on
      act(() => {
        result.current.setAccessibilityPermissionGranted(true);
      });
      expect(result.current.accessibilityPermissionGranted).toBe(true);

      // Toggle accessibility permission off
      act(() => {
        result.current.setAccessibilityPermissionGranted(false);
      });
      expect(result.current.accessibilityPermissionGranted).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 17.4: Microphone Permission Request Functionality
  // ===========================================================================
  describe('Microphone Permission Request', () => {
    it('should request microphone permission via getUserMedia', async () => {
      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('should set micPermissionGranted to true when permission is granted', async () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.micPermissionGranted).toBe(false);

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(result.current.micPermissionGranted).toBe(true);
    });

    it('should show alert dialog when permission is denied and showAlertDialog is provided', async () => {
      // Set permission to be denied
      globalThis.mockMediaDevices.__setPermissionGranted(false);

      const mockShowAlertDialog = vi.fn();
      const { result } = renderHook(() => usePermissions(mockShowAlertDialog));

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(mockShowAlertDialog).toHaveBeenCalledWith({
        title: 'Microphone Permission Required',
        description: 'Please grant microphone permissions to use voice dictation.',
      });
    });

    it('should show native alert when permission is denied and no showAlertDialog provided', async () => {
      // Set permission to be denied
      globalThis.mockMediaDevices.__setPermissionGranted(false);

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(window.alert).toHaveBeenCalledWith(
        'Please grant microphone permissions to use voice dictation.'
      );
    });

    it('should not set micPermissionGranted to true when permission is denied', async () => {
      // Set permission to be denied
      globalThis.mockMediaDevices.__setPermissionGranted(false);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.micPermissionGranted).toBe(false);

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(result.current.micPermissionGranted).toBe(false);
    });

    it('should log error to console when permission is denied', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Set permission to be denied
      globalThis.mockMediaDevices.__setPermissionGranted(false);

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toBe('Microphone permission denied:');

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Requirement 17.4: Accessibility Permission Test Functionality
  // ===========================================================================
  describe('Accessibility Permission Test', () => {
    it('should test accessibility permission via electronAPI.pasteText', async () => {
      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(window.electronAPI.pasteText).toHaveBeenCalledWith('Ollie accessibility test');
    });

    it('should set accessibilityPermissionGranted to true when test succeeds', async () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.accessibilityPermissionGranted).toBe(false);

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(result.current.accessibilityPermissionGranted).toBe(true);
    });

    it('should show success alert dialog when test succeeds and showAlertDialog is provided', async () => {
      const mockShowAlertDialog = vi.fn();
      const { result } = renderHook(() => usePermissions(mockShowAlertDialog));

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(mockShowAlertDialog).toHaveBeenCalledWith({
        title: '✅ Accessibility Test Successful',
        description: 'Accessibility permissions working! Check if the test text appeared in another app.',
      });
    });

    it('should show native alert when test succeeds and no showAlertDialog provided', async () => {
      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(window.alert).toHaveBeenCalledWith(
        '✅ Accessibility permissions working! Check if the test text appeared in another app.'
      );
    });

    it('should show error alert dialog when test fails and showAlertDialog is provided', async () => {
      // Make pasteText fail
      window.electronAPI.pasteText = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const mockShowAlertDialog = vi.fn();
      const { result } = renderHook(() => usePermissions(mockShowAlertDialog));

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(mockShowAlertDialog).toHaveBeenCalledWith({
        title: '❌ Accessibility Permissions Needed',
        description: 'Please grant accessibility permissions in System Settings to enable automatic text pasting.',
      });
    });

    it('should show native alert when test fails and no showAlertDialog provided', async () => {
      // Make pasteText fail
      window.electronAPI.pasteText = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(window.alert).toHaveBeenCalledWith(
        '❌ Accessibility permissions needed! Please grant them in System Settings.'
      );
    });

    it('should not set accessibilityPermissionGranted to true when test fails', async () => {
      // Make pasteText fail
      window.electronAPI.pasteText = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => usePermissions());

      expect(result.current.accessibilityPermissionGranted).toBe(false);

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(result.current.accessibilityPermissionGranted).toBe(false);
    });

    it('should log error to console when test fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Make pasteText fail
      window.electronAPI.pasteText = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toBe('Accessibility permission test failed:');

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Hook Stability and Re-renders
  // ===========================================================================
  describe('Hook Stability and Re-renders', () => {
    it('should maintain stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => usePermissions());

      const initialRequestMicPermission = result.current.requestMicPermission;
      const initialTestAccessibilityPermission = result.current.testAccessibilityPermission;

      rerender();

      // Functions should be stable due to useCallback
      expect(result.current.requestMicPermission).toBe(initialRequestMicPermission);
      expect(result.current.testAccessibilityPermission).toBe(initialTestAccessibilityPermission);
    });

    it('should update function references when showAlertDialog changes', () => {
      const mockShowAlertDialog1 = vi.fn();
      const mockShowAlertDialog2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ showAlertDialog }) => usePermissions(showAlertDialog),
        { initialProps: { showAlertDialog: mockShowAlertDialog1 } }
      );

      const initialRequestMicPermission = result.current.requestMicPermission;
      const initialTestAccessibilityPermission = result.current.testAccessibilityPermission;

      rerender({ showAlertDialog: mockShowAlertDialog2 });

      // Functions should update when dependency changes
      expect(result.current.requestMicPermission).not.toBe(initialRequestMicPermission);
      expect(result.current.testAccessibilityPermission).not.toBe(initialTestAccessibilityPermission);
    });

    it('should persist permission states across re-renders', async () => {
      const { result, rerender } = renderHook(() => usePermissions());

      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(result.current.micPermissionGranted).toBe(true);

      rerender();

      expect(result.current.micPermissionGranted).toBe(true);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle multiple rapid permission requests', async () => {
      const { result } = renderHook(() => usePermissions());

      // Fire multiple requests rapidly
      await act(async () => {
        await Promise.all([
          result.current.requestMicPermission(),
          result.current.requestMicPermission(),
          result.current.requestMicPermission(),
        ]);
      });

      expect(result.current.micPermissionGranted).toBe(true);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple rapid accessibility tests', async () => {
      // Ensure pasteText mock is reset to success state
      window.electronAPI.pasteText = vi.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => usePermissions());

      // Fire multiple tests rapidly
      await act(async () => {
        await Promise.all([
          result.current.testAccessibilityPermission(),
          result.current.testAccessibilityPermission(),
          result.current.testAccessibilityPermission(),
        ]);
      });

      expect(result.current.accessibilityPermissionGranted).toBe(true);
      expect(window.electronAPI.pasteText).toHaveBeenCalledTimes(3);
    });

    it('should handle undefined showAlertDialog gracefully', async () => {
      const { result } = renderHook(() => usePermissions(undefined));

      // Should not throw
      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(result.current.micPermissionGranted).toBe(true);
    });

    it('should handle both permissions being granted independently', async () => {
      // Ensure pasteText mock is reset to success state
      window.electronAPI.pasteText = vi.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() => usePermissions());

      // Grant mic permission
      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(result.current.micPermissionGranted).toBe(true);
      expect(result.current.accessibilityPermissionGranted).toBe(false);

      // Grant accessibility permission
      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(result.current.micPermissionGranted).toBe(true);
      expect(result.current.accessibilityPermissionGranted).toBe(true);
    });

    it('should handle mixed success and failure scenarios', async () => {
      // Make pasteText fail
      window.electronAPI.pasteText = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => usePermissions());

      // Mic permission succeeds
      await act(async () => {
        await result.current.requestMicPermission();
      });

      expect(result.current.micPermissionGranted).toBe(true);

      // Accessibility permission fails
      await act(async () => {
        await result.current.testAccessibilityPermission();
      });

      expect(result.current.accessibilityPermissionGranted).toBe(false);
    });
  });
});
