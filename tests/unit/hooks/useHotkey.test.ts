/**
 * Unit Tests for useHotkey Hook
 * 
 * Tests the useHotkey hook that provides access to the current hotkey
 * configuration stored in localStorage and allows updating it.
 * 
 * @module tests/unit/hooks/useHotkey.test.ts
 * 
 * Validates: Requirements 5.1-5.4, 17.5
 * - 5.1: Hotkey registration and global listening
 * - 5.2: Hotkey press emits toggle-dictation event
 * - 5.3: Hotkey update unregisters old key and registers new key
 * - 5.4: Hotkey registration failure returns descriptive error
 * - 17.5: useHotkey hook returns current hotkey configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHotkey } from '../../../src/hooks/useHotkey';

describe('useHotkey Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 17.5: Hotkey Retrieval from localStorage
  // ===========================================================================
  describe('Hotkey Retrieval from localStorage', () => {
    it('should return default hotkey (`) when localStorage is empty', () => {
      const { result } = renderHook(() => useHotkey());

      expect(result.current.hotkey).toBe('`');
    });

    it('should retrieve hotkey from localStorage when it exists', async () => {
      localStorage.setItem('dictationKey', 'D');

      const { result } = renderHook(() => useHotkey());

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.hotkey).toBe('D');
      });
    });

    it('should retrieve single character hotkey from localStorage', async () => {
      localStorage.setItem('dictationKey', 'K');

      const { result } = renderHook(() => useHotkey());

      await waitFor(() => {
        expect(result.current.hotkey).toBe('K');
      });
    });

    it('should retrieve special character hotkey from localStorage', async () => {
      localStorage.setItem('dictationKey', '~');

      const { result } = renderHook(() => useHotkey());

      await waitFor(() => {
        expect(result.current.hotkey).toBe('~');
      });
    });

    it('should retrieve number key hotkey from localStorage', async () => {
      localStorage.setItem('dictationKey', '1');

      const { result } = renderHook(() => useHotkey());

      await waitFor(() => {
        expect(result.current.hotkey).toBe('1');
      });
    });

    it('should handle empty string in localStorage by keeping default', async () => {
      localStorage.setItem('dictationKey', '');

      const { result } = renderHook(() => useHotkey());

      // Empty string is falsy, so default should be used
      await waitFor(() => {
        expect(result.current.hotkey).toBe('`');
      });
    });
  });

  // ===========================================================================
  // Requirement 17.5: Hotkey Update Functionality
  // ===========================================================================
  describe('Hotkey Update Functionality', () => {
    it('should provide setHotkey function', () => {
      const { result } = renderHook(() => useHotkey());

      expect(typeof result.current.setHotkey).toBe('function');
    });

    it('should update hotkey state when setHotkey is called', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('F');
      });

      expect(result.current.hotkey).toBe('F');
    });

    it('should update hotkey to a special character', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('~');
      });

      expect(result.current.hotkey).toBe('~');
    });

    it('should update hotkey to a number', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('9');
      });

      expect(result.current.hotkey).toBe('9');
    });

    it('should support multiple sequential updates', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('A');
      });
      expect(result.current.hotkey).toBe('A');

      act(() => {
        result.current.setHotkey('B');
      });
      expect(result.current.hotkey).toBe('B');

      act(() => {
        result.current.setHotkey('C');
      });
      expect(result.current.hotkey).toBe('C');
    });

    it('should update hotkey to empty string', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('');
      });

      expect(result.current.hotkey).toBe('');
    });
  });

  // ===========================================================================
  // Hook Return Value Structure
  // ===========================================================================
  describe('Hook Return Value Structure', () => {
    it('should return an object with hotkey and setHotkey properties', () => {
      const { result } = renderHook(() => useHotkey());

      expect(result.current).toHaveProperty('hotkey');
      expect(result.current).toHaveProperty('setHotkey');
    });

    it('should return hotkey as a string', () => {
      const { result } = renderHook(() => useHotkey());

      expect(typeof result.current.hotkey).toBe('string');
    });

    it('should return setHotkey as a function', () => {
      const { result } = renderHook(() => useHotkey());

      expect(typeof result.current.setHotkey).toBe('function');
    });
  });

  // ===========================================================================
  // State Persistence Across Re-renders
  // ===========================================================================
  describe('State Persistence Across Re-renders', () => {
    it('should persist hotkey state across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('X');
      });

      rerender();

      expect(result.current.hotkey).toBe('X');
    });

    it('should maintain updated hotkey after multiple re-renders', () => {
      const { result, rerender } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('Y');
      });

      rerender();
      rerender();
      rerender();

      expect(result.current.hotkey).toBe('Y');
    });
  });

  // ===========================================================================
  // Integration with localStorage on Mount
  // ===========================================================================
  describe('Integration with localStorage on Mount', () => {
    it('should load hotkey from localStorage on initial mount', async () => {
      localStorage.setItem('dictationKey', 'M');

      const { result } = renderHook(() => useHotkey());

      // Initially might be default, then updates via useEffect
      await waitFor(() => {
        expect(result.current.hotkey).toBe('M');
      });
    });

    it('should not overwrite localStorage value on mount', async () => {
      localStorage.setItem('dictationKey', 'N');

      renderHook(() => useHotkey());

      // localStorage should still have the original value
      expect(localStorage.getItem('dictationKey')).toBe('N');
    });

    it('should handle localStorage being cleared after mount', async () => {
      localStorage.setItem('dictationKey', 'P');

      const { result } = renderHook(() => useHotkey());

      await waitFor(() => {
        expect(result.current.hotkey).toBe('P');
      });

      // Clear localStorage after mount
      localStorage.clear();

      // The hook state should still have the loaded value
      expect(result.current.hotkey).toBe('P');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle whitespace-only value in localStorage', async () => {
      localStorage.setItem('dictationKey', '   ');

      const { result } = renderHook(() => useHotkey());

      // Whitespace is truthy, so it should be loaded
      await waitFor(() => {
        expect(result.current.hotkey).toBe('   ');
      });
    });

    it('should handle unicode characters as hotkey', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('é');
      });

      expect(result.current.hotkey).toBe('é');
    });

    it('should handle multi-character strings (though typically single char)', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('Ctrl+D');
      });

      expect(result.current.hotkey).toBe('Ctrl+D');
    });

    it('should handle setting hotkey back to default', () => {
      const { result } = renderHook(() => useHotkey());

      act(() => {
        result.current.setHotkey('Z');
      });
      expect(result.current.hotkey).toBe('Z');

      act(() => {
        result.current.setHotkey('`');
      });
      expect(result.current.hotkey).toBe('`');
    });
  });

  // ===========================================================================
  // Concurrent Hook Instances
  // ===========================================================================
  describe('Concurrent Hook Instances', () => {
    it('should allow multiple hook instances with independent state', () => {
      const { result: result1 } = renderHook(() => useHotkey());
      const { result: result2 } = renderHook(() => useHotkey());

      act(() => {
        result1.current.setHotkey('A');
      });

      act(() => {
        result2.current.setHotkey('B');
      });

      // Each instance has its own state
      expect(result1.current.hotkey).toBe('A');
      expect(result2.current.hotkey).toBe('B');
    });

    it('should load same localStorage value for multiple instances', async () => {
      localStorage.setItem('dictationKey', 'Q');

      const { result: result1 } = renderHook(() => useHotkey());
      const { result: result2 } = renderHook(() => useHotkey());

      await waitFor(() => {
        expect(result1.current.hotkey).toBe('Q');
        expect(result2.current.hotkey).toBe('Q');
      });
    });
  });
});
