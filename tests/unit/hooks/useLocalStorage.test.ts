/**
 * Unit Tests for useLocalStorage Hook
 * 
 * Tests the useLocalStorage hook that provides a React state interface
 * for localStorage with automatic persistence, custom serialization,
 * and removal capabilities.
 * 
 * @module tests/unit/hooks/useLocalStorage.test.ts
 * 
 * Validates: Requirements 17.3
 * - 17.3: useLocalStorage hook tests - Value retrieval from localStorage,
 *         default value when key doesn't exist, and value update/persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../../src/hooks/useLocalStorage';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 17.3: Value Retrieval from localStorage
  // ===========================================================================
  describe('Value Retrieval from localStorage', () => {
    it('should retrieve a string value from localStorage', () => {
      localStorage.setItem('testKey', JSON.stringify('stored value'));

      const { result } = renderHook(() => useLocalStorage('testKey', 'default'));

      expect(result.current[0]).toBe('stored value');
    });

    it('should retrieve a number value from localStorage', () => {
      localStorage.setItem('numberKey', JSON.stringify(42));

      const { result } = renderHook(() => useLocalStorage('numberKey', 0));

      expect(result.current[0]).toBe(42);
    });

    it('should retrieve a boolean value from localStorage', () => {
      localStorage.setItem('boolKey', JSON.stringify(true));

      const { result } = renderHook(() => useLocalStorage('boolKey', false));

      expect(result.current[0]).toBe(true);
    });

    it('should retrieve an object value from localStorage', () => {
      const storedObject = { name: 'test', count: 5 };
      localStorage.setItem('objectKey', JSON.stringify(storedObject));

      const { result } = renderHook(() => 
        useLocalStorage('objectKey', { name: '', count: 0 })
      );

      expect(result.current[0]).toEqual(storedObject);
    });

    it('should retrieve an array value from localStorage', () => {
      const storedArray = [1, 2, 3, 4, 5];
      localStorage.setItem('arrayKey', JSON.stringify(storedArray));

      const { result } = renderHook(() => useLocalStorage('arrayKey', []));

      expect(result.current[0]).toEqual(storedArray);
    });

    it('should retrieve null value from localStorage', () => {
      localStorage.setItem('nullKey', JSON.stringify(null));

      const { result } = renderHook(() => useLocalStorage('nullKey', 'default'));

      expect(result.current[0]).toBeNull();
    });
  });

  // ===========================================================================
  // Requirement 17.3: Default Value When Key Doesn't Exist
  // ===========================================================================
  describe('Default Value When Key Does Not Exist', () => {
    it('should return default string value when key does not exist', () => {
      const { result } = renderHook(() => 
        useLocalStorage('nonExistentKey', 'default value')
      );

      expect(result.current[0]).toBe('default value');
    });

    it('should return default number value when key does not exist', () => {
      const { result } = renderHook(() => 
        useLocalStorage('nonExistentNumber', 100)
      );

      expect(result.current[0]).toBe(100);
    });

    it('should return default boolean value when key does not exist', () => {
      const { result } = renderHook(() => 
        useLocalStorage('nonExistentBool', true)
      );

      expect(result.current[0]).toBe(true);
    });

    it('should return default object value when key does not exist', () => {
      const defaultObject = { setting: 'value', enabled: true };
      
      const { result } = renderHook(() => 
        useLocalStorage('nonExistentObject', defaultObject)
      );

      expect(result.current[0]).toEqual(defaultObject);
    });

    it('should return default array value when key does not exist', () => {
      const defaultArray = ['a', 'b', 'c'];
      
      const { result } = renderHook(() => 
        useLocalStorage('nonExistentArray', defaultArray)
      );

      expect(result.current[0]).toEqual(defaultArray);
    });

    it('should return default value when localStorage contains invalid JSON', () => {
      localStorage.setItem('invalidJson', 'not valid json {');

      const { result } = renderHook(() => 
        useLocalStorage('invalidJson', 'fallback')
      );

      expect(result.current[0]).toBe('fallback');
    });
  });

  // ===========================================================================
  // Requirement 17.3: Value Update and Persistence
  // ===========================================================================
  describe('Value Update and Persistence', () => {
    it('should update state and persist string value to localStorage', () => {
      const { result } = renderHook(() => 
        useLocalStorage('updateKey', 'initial')
      );

      act(() => {
        result.current[1]('updated value');
      });

      expect(result.current[0]).toBe('updated value');
      expect(localStorage.getItem('updateKey')).toBe(JSON.stringify('updated value'));
    });

    it('should update state and persist number value to localStorage', () => {
      const { result } = renderHook(() => 
        useLocalStorage('numberUpdate', 0)
      );

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
      expect(localStorage.getItem('numberUpdate')).toBe(JSON.stringify(42));
    });

    it('should update state and persist boolean value to localStorage', () => {
      const { result } = renderHook(() => 
        useLocalStorage('boolUpdate', false)
      );

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorage.getItem('boolUpdate')).toBe(JSON.stringify(true));
    });

    it('should update state and persist object value to localStorage', () => {
      const { result } = renderHook(() => 
        useLocalStorage('objectUpdate', { count: 0 })
      );

      const newObject = { count: 10, name: 'test' };
      act(() => {
        result.current[1](newObject);
      });

      expect(result.current[0]).toEqual(newObject);
      expect(localStorage.getItem('objectUpdate')).toBe(JSON.stringify(newObject));
    });

    it('should update state and persist array value to localStorage', () => {
      const { result } = renderHook(() => 
        useLocalStorage('arrayUpdate', [])
      );

      const newArray = [1, 2, 3];
      act(() => {
        result.current[1](newArray);
      });

      expect(result.current[0]).toEqual(newArray);
      expect(localStorage.getItem('arrayUpdate')).toBe(JSON.stringify(newArray));
    });

    it('should support functional updates based on previous state', () => {
      localStorage.setItem('funcUpdate', JSON.stringify(5));

      const { result } = renderHook(() => 
        useLocalStorage('funcUpdate', 0)
      );

      act(() => {
        result.current[1]((prev) => prev + 10);
      });

      expect(result.current[0]).toBe(15);
      expect(localStorage.getItem('funcUpdate')).toBe(JSON.stringify(15));
    });

    it('should support multiple sequential updates', () => {
      const { result } = renderHook(() => 
        useLocalStorage('multiUpdate', 0)
      );

      act(() => {
        result.current[1](1);
      });
      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1](2);
      });
      expect(result.current[0]).toBe(2);

      act(() => {
        result.current[1](3);
      });
      expect(result.current[0]).toBe(3);
      expect(localStorage.getItem('multiUpdate')).toBe(JSON.stringify(3));
    });
  });

  // ===========================================================================
  // Remove Functionality
  // ===========================================================================
  describe('Remove Functionality', () => {
    it('should remove value from localStorage and reset to default', () => {
      localStorage.setItem('removeKey', JSON.stringify('stored'));

      const { result } = renderHook(() => 
        useLocalStorage('removeKey', 'default')
      );

      expect(result.current[0]).toBe('stored');

      act(() => {
        result.current[2](); // Call remove function
      });

      expect(result.current[0]).toBe('default');
      expect(localStorage.getItem('removeKey')).toBeNull();
    });

    it('should handle remove when key does not exist', () => {
      const { result } = renderHook(() => 
        useLocalStorage('nonExistent', 'default')
      );

      // Should not throw
      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('default');
    });
  });

  // ===========================================================================
  // Custom Serialization Options
  // ===========================================================================
  describe('Custom Serialization Options', () => {
    it('should use custom serialize function', () => {
      const customSerialize = vi.fn((value: string) => value.toUpperCase());
      const customDeserialize = vi.fn((value: string) => value.toLowerCase());

      const { result } = renderHook(() => 
        useLocalStorage('customKey', 'default', {
          serialize: customSerialize,
          deserialize: customDeserialize
        })
      );

      act(() => {
        result.current[1]('test value');
      });

      expect(customSerialize).toHaveBeenCalledWith('test value');
      expect(localStorage.getItem('customKey')).toBe('TEST VALUE');
    });

    it('should use custom deserialize function', () => {
      localStorage.setItem('customDeserialize', 'STORED VALUE');

      const customDeserialize = vi.fn((value: string) => value.toLowerCase());

      const { result } = renderHook(() => 
        useLocalStorage('customDeserialize', 'default', {
          deserialize: customDeserialize
        })
      );

      expect(customDeserialize).toHaveBeenCalledWith('STORED VALUE');
      expect(result.current[0]).toBe('stored value');
    });
  });

  // ===========================================================================
  // Hook Return Value Structure
  // ===========================================================================
  describe('Hook Return Value Structure', () => {
    it('should return a tuple with [state, setValue, remove]', () => {
      const { result } = renderHook(() => 
        useLocalStorage('structureTest', 'default')
      );

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);
      expect(typeof result.current[0]).toBe('string'); // state
      expect(typeof result.current[1]).toBe('function'); // setValue
      expect(typeof result.current[2]).toBe('function'); // remove
    });

    it('should return stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => 
        useLocalStorage('stableRef', 'default')
      );

      const initialSetValue = result.current[1];
      const initialRemove = result.current[2];

      rerender();

      // setValue should be stable due to useCallback
      expect(result.current[1]).toBe(initialSetValue);
      expect(result.current[2]).toBe(initialRemove);
    });
  });

  // ===========================================================================
  // Persistence Across Re-renders
  // ===========================================================================
  describe('Persistence Across Re-renders', () => {
    it('should persist state across hook re-renders', () => {
      const { result, rerender } = renderHook(() => 
        useLocalStorage('persistKey', 'default')
      );

      act(() => {
        result.current[1]('persisted value');
      });

      rerender();

      expect(result.current[0]).toBe('persisted value');
    });

    it('should persist state when hook is unmounted and remounted', () => {
      const { result, unmount } = renderHook(() => 
        useLocalStorage('unmountKey', 'default')
      );

      act(() => {
        result.current[1]('before unmount');
      });

      unmount();

      // Mount a new instance
      const { result: newResult } = renderHook(() => 
        useLocalStorage('unmountKey', 'default')
      );

      expect(newResult.current[0]).toBe('before unmount');
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================
  describe('Error Handling', () => {
    it('should handle localStorage.setItem errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => 
        useLocalStorage('errorKey', 'default')
      );

      // Should not throw, but log error
      act(() => {
        result.current[1]('new value');
      });

      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle localStorage.removeItem errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.removeItem to throw
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => 
        useLocalStorage('removeErrorKey', 'default')
      );

      // Should not throw, but log error
      act(() => {
        result.current[2]();
      });

      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      localStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle empty string as value', () => {
      const { result } = renderHook(() => 
        useLocalStorage('emptyString', 'default')
      );

      act(() => {
        result.current[1]('');
      });

      expect(result.current[0]).toBe('');
      expect(localStorage.getItem('emptyString')).toBe(JSON.stringify(''));
    });

    it('should handle zero as value', () => {
      const { result } = renderHook(() => 
        useLocalStorage('zeroValue', 10)
      );

      act(() => {
        result.current[1](0);
      });

      expect(result.current[0]).toBe(0);
      expect(localStorage.getItem('zeroValue')).toBe(JSON.stringify(0));
    });

    it('should handle false as value', () => {
      const { result } = renderHook(() => 
        useLocalStorage('falseValue', true)
      );

      act(() => {
        result.current[1](false);
      });

      expect(result.current[0]).toBe(false);
      expect(localStorage.getItem('falseValue')).toBe(JSON.stringify(false));
    });

    it('should handle undefined in object values', () => {
      const { result } = renderHook(() => 
        useLocalStorage('undefinedProp', { a: 1, b: undefined })
      );

      // JSON.stringify removes undefined properties
      expect(result.current[0]).toEqual({ a: 1 });
    });

    it('should handle special characters in key names', () => {
      const { result } = renderHook(() => 
        useLocalStorage('special-key_with.chars', 'value')
      );

      act(() => {
        result.current[1]('updated');
      });

      expect(localStorage.getItem('special-key_with.chars')).toBe(JSON.stringify('updated'));
    });
  });
});
