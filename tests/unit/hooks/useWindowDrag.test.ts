/**
 * Unit tests for useWindowDrag hook
 * Tests drag initialization and mouse event handling
 * 
 * **Validates: Requirements 17.6**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowDrag } from '../../../src/hooks/useWindowDrag';

describe('useWindowDrag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Drag Initialization', () => {
    it('should initialize with isDragging set to false', () => {
      const { result } = renderHook(() => useWindowDrag());

      expect(result.current.isDragging).toBe(false);
    });

    it('should return handleMouseDown, handleMouseUp, and handleClick functions', () => {
      const { result } = renderHook(() => useWindowDrag());

      expect(typeof result.current.handleMouseDown).toBe('function');
      expect(typeof result.current.handleMouseUp).toBe('function');
      expect(typeof result.current.handleClick).toBe('function');
    });
  });

  describe('Mouse Event Handling', () => {
    describe('handleMouseDown', () => {
      it('should set isDragging to true on left mouse button click', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          button: 0, // Left mouse button
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mockEvent);
        });

        expect(result.current.isDragging).toBe(true);
      });

      it('should call window.electronAPI.startWindowDrag on left mouse button click', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mockEvent);
        });

        expect(window.electronAPI.startWindowDrag).toHaveBeenCalledTimes(1);
      });

      it('should call preventDefault on left mouse button click', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      });

      it('should NOT set isDragging to true on right mouse button click', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          button: 2, // Right mouse button
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mockEvent);
        });

        expect(result.current.isDragging).toBe(false);
      });

      it('should NOT call startWindowDrag on right mouse button click', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          button: 2, // Right mouse button
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mockEvent);
        });

        expect(window.electronAPI.startWindowDrag).not.toHaveBeenCalled();
      });

      it('should NOT set isDragging to true on middle mouse button click', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          button: 1, // Middle mouse button
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mockEvent);
        });

        expect(result.current.isDragging).toBe(false);
      });
    });

    describe('handleMouseUp', () => {
      it('should set isDragging to false when currently dragging', () => {
        const { result } = renderHook(() => useWindowDrag());

        // First, start dragging
        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        expect(result.current.isDragging).toBe(true);

        // Then, stop dragging
        act(() => {
          result.current.handleMouseUp();
        });

        expect(result.current.isDragging).toBe(false);
      });

      it('should call window.electronAPI.stopWindowDrag when currently dragging', () => {
        const { result } = renderHook(() => useWindowDrag());

        // First, start dragging
        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        vi.clearAllMocks(); // Clear the startWindowDrag call

        // Then, stop dragging
        act(() => {
          result.current.handleMouseUp();
        });

        expect(window.electronAPI.stopWindowDrag).toHaveBeenCalledTimes(1);
      });

      it('should NOT call stopWindowDrag when not currently dragging', () => {
        const { result } = renderHook(() => useWindowDrag());

        // Call handleMouseUp without starting a drag
        act(() => {
          result.current.handleMouseUp();
        });

        expect(window.electronAPI.stopWindowDrag).not.toHaveBeenCalled();
      });
    });

    describe('handleClick', () => {
      it('should call preventDefault to prevent click actions', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mockEvent = {
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleClick(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      });
    });

    describe('Global mouseup listener', () => {
      it('should add global mouseup listener when dragging starts', () => {
        const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
        
        const { result } = renderHook(() => useWindowDrag());

        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      });

      it('should remove global mouseup listener when dragging stops', () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
        
        const { result, unmount } = renderHook(() => useWindowDrag());

        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        // Stop dragging
        act(() => {
          result.current.handleMouseUp();
        });

        // The cleanup should be called when isDragging changes from true to false
        // This happens via the useEffect cleanup
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      });

      it('should stop dragging when global mouseup event is triggered', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        expect(result.current.isDragging).toBe(true);

        // Simulate global mouseup event
        act(() => {
          document.dispatchEvent(new MouseEvent('mouseup'));
        });

        expect(result.current.isDragging).toBe(false);
      });

      it('should call stopWindowDrag when global mouseup event is triggered', () => {
        const { result } = renderHook(() => useWindowDrag());

        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        vi.clearAllMocks(); // Clear the startWindowDrag call

        // Simulate global mouseup event
        act(() => {
          document.dispatchEvent(new MouseEvent('mouseup'));
        });

        expect(window.electronAPI.stopWindowDrag).toHaveBeenCalledTimes(1);
      });

      it('should clean up event listener on unmount while dragging', () => {
        const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
        
        const { result, unmount } = renderHook(() => useWindowDrag());

        const mouseDownEvent = {
          button: 0,
          preventDefault: vi.fn(),
        } as unknown as React.MouseEvent;

        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });

        // Unmount while dragging
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple consecutive mousedown events', () => {
      const { result } = renderHook(() => useWindowDrag());

      const mouseDownEvent = {
        button: 0,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      // Multiple mousedown events
      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
        result.current.handleMouseDown(mouseDownEvent);
        result.current.handleMouseDown(mouseDownEvent);
      });

      expect(result.current.isDragging).toBe(true);
      // startWindowDrag should be called for each mousedown
      expect(window.electronAPI.startWindowDrag).toHaveBeenCalledTimes(3);
    });

    it('should handle mouseup without prior mousedown gracefully', () => {
      const { result } = renderHook(() => useWindowDrag());

      // Should not throw and should not call stopWindowDrag
      expect(() => {
        act(() => {
          result.current.handleMouseUp();
        });
      }).not.toThrow();

      expect(result.current.isDragging).toBe(false);
      expect(window.electronAPI.stopWindowDrag).not.toHaveBeenCalled();
    });

    it('should handle startWindowDrag being undefined gracefully', () => {
      // Temporarily remove startWindowDrag
      const originalStartWindowDrag = window.electronAPI.startWindowDrag;
      window.electronAPI.startWindowDrag = undefined as any;

      const { result } = renderHook(() => useWindowDrag());

      const mouseDownEvent = {
        button: 0,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleMouseDown(mouseDownEvent);
        });
      }).not.toThrow();

      expect(result.current.isDragging).toBe(true);

      // Restore
      window.electronAPI.startWindowDrag = originalStartWindowDrag;
    });

    it('should handle stopWindowDrag being undefined gracefully', () => {
      // Temporarily remove stopWindowDrag
      const originalStopWindowDrag = window.electronAPI.stopWindowDrag;
      window.electronAPI.stopWindowDrag = undefined as any;

      const { result } = renderHook(() => useWindowDrag());

      const mouseDownEvent = {
        button: 0,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;

      act(() => {
        result.current.handleMouseDown(mouseDownEvent);
      });

      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleMouseUp();
        });
      }).not.toThrow();

      expect(result.current.isDragging).toBe(false);

      // Restore
      window.electronAPI.stopWindowDrag = originalStopWindowDrag;
    });
  });
});
