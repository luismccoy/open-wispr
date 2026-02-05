/**
 * Unit Tests for Toast Component
 * 
 * Tests the toast notification system including the ToastProvider context,
 * useToast hook, and Toast component rendering with various variants.
 * 
 * @module tests/unit/components/Toast.test.tsx
 * 
 * Validates: Requirements 13.1-13.4
 * - 13.1: WHEN a toast is triggered, THE Toast_System SHALL display title and description
 * - 13.2: WHEN variant is destructive, THE Toast_System SHALL apply error styling
 * - 13.3: WHEN duration expires, THE Toast_System SHALL auto-dismiss the toast
 * - 13.4: WHEN multiple toasts are triggered, THE Toast_System SHALL queue them
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as React from 'react';
import { ToastProvider, useToast, toast } from '../../../src/components/ui/Toast';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Test component that exposes toast functions for testing
 */
const ToastTrigger: React.FC<{
  onMount?: (toastFn: ReturnType<typeof useToast>) => void;
}> = ({ onMount }) => {
  const toastContext = useToast();
  
  React.useEffect(() => {
    if (onMount) {
      onMount(toastContext);
    }
  }, [onMount, toastContext]);

  return (
    <div>
      <button 
        data-testid="trigger-default"
        onClick={() => toastContext.toast({ title: 'Default Toast', description: 'Default description' })}
      >
        Default Toast
      </button>
      <button 
        data-testid="trigger-success"
        onClick={() => toastContext.toast({ ...toast.success('Success message') })}
      >
        Success Toast
      </button>
      <button 
        data-testid="trigger-error"
        onClick={() => toastContext.toast({ ...toast.error('Error message') })}
      >
        Error Toast
      </button>
      <button 
        data-testid="trigger-info"
        onClick={() => toastContext.toast({ ...toast.info('Info message') })}
      >
        Info Toast
      </button>
      <button 
        data-testid="trigger-custom-duration"
        onClick={() => toastContext.toast({ title: 'Custom', duration: 1000 })}
      >
        Custom Duration
      </button>
      <button 
        data-testid="trigger-no-auto-dismiss"
        onClick={() => toastContext.toast({ title: 'Persistent', duration: 0 })}
      >
        No Auto Dismiss
      </button>
      <button 
        data-testid="dismiss-all"
        onClick={() => toastContext.dismiss()}
      >
        Dismiss
      </button>
    </div>
  );
};

/**
 * Wrapper component for testing
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

// ============================================================================
// Test Setup
// ============================================================================

describe('Toast Component Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ==========================================================================
  // Requirement 13.1: Toast Display with Title and Description
  // ==========================================================================
  describe('Toast Display (Requirement 13.1)', () => {
    it('should display toast with title and description', async () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-default'));

      // Find the toast content (not the button)
      const toastTitle = screen.getAllByText('Default Toast');
      expect(toastTitle.length).toBeGreaterThan(0);
      expect(screen.getByText('Default description')).toBeDefined();
    });

    it('should display toast with only title', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Title Only' });
      });

      expect(screen.getByText('Title Only')).toBeDefined();
    });

    it('should display toast with only description', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ description: 'Description Only' });
      });

      expect(screen.getByText('Description Only')).toBeDefined();
    });

    it('should display success toast with correct content', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-success'));

      // Find toast title (not button)
      const successTitles = screen.getAllByText('Success');
      expect(successTitles.length).toBeGreaterThan(0);
      expect(screen.getByText('Success message')).toBeDefined();
    });

    it('should display error toast with correct content', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-error'));

      // Find toast title (not button)
      const errorTitles = screen.getAllByText('Error');
      expect(errorTitles.length).toBeGreaterThan(0);
      expect(screen.getByText('Error message')).toBeDefined();
    });

    it('should display info toast with correct content', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-info'));

      expect(screen.getByText('Info message')).toBeDefined();
    });

    it('should display toast with custom action', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ 
          title: 'With Action',
          action: <button data-testid="custom-action">Undo</button>
        });
      });

      expect(screen.getByText('With Action')).toBeDefined();
      expect(screen.getByTestId('custom-action')).toBeDefined();
    });

    it('should render close button', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-default'));

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeDefined();
    });

    it('should close toast when close button is clicked', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-default'));
      expect(screen.getByText('Default description')).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByText('Default description')).toBeNull();
    });
  });

  // ==========================================================================
  // Requirement 13.2: Destructive Variant Styling
  // ==========================================================================
  describe('Destructive Variant Styling (Requirement 13.2)', () => {
    it('should apply destructive styling for error variant', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-error'));

      // Find the toast container element (has the variant classes)
      const toastContainer = screen.getByText('Error message').closest('.rounded-lg');
      expect(toastContainer?.className).toContain('bg-red-50');
      expect(toastContainer?.className).toContain('border-red-200');
      expect(toastContainer?.className).toContain('text-red-900');
    });

    it('should apply success styling for success variant', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-success'));

      const toastContainer = screen.getByText('Success message').closest('.rounded-lg');
      expect(toastContainer?.className).toContain('bg-green-50');
      expect(toastContainer?.className).toContain('border-green-200');
      expect(toastContainer?.className).toContain('text-green-900');
    });

    it('should apply default styling for default variant', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-default'));

      const toastContainer = screen.getByText('Default description').closest('.rounded-lg');
      expect(toastContainer?.className).toContain('bg-white');
      expect(toastContainer?.className).toContain('border-gray-200');
      expect(toastContainer?.className).toContain('text-gray-900');
    });

    it('should apply default styling when no variant specified', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'No Variant' });
      });

      const toastContainer = screen.getByText('No Variant').closest('.rounded-lg');
      expect(toastContainer?.className).toContain('bg-white');
    });
  });

  // ==========================================================================
  // Requirement 13.3: Auto-Dismiss
  // ==========================================================================
  describe('Auto-Dismiss (Requirement 13.3)', () => {
    it('should auto-dismiss after default duration (3500ms)', async () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-default'));
      expect(screen.getByText('Default description')).toBeDefined();

      // Advance time past default duration
      act(() => {
        vi.advanceTimersByTime(3500);
      });

      expect(screen.queryByText('Default description')).toBeNull();
    });

    it('should auto-dismiss after custom duration', async () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-custom-duration'));
      expect(screen.getByText('Custom')).toBeDefined();

      // Should still be visible before duration
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByText('Custom')).toBeDefined();

      // Should be dismissed after duration
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByText('Custom')).toBeNull();
    });

    it('should not auto-dismiss when duration is 0', async () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('trigger-no-auto-dismiss'));
      expect(screen.getByText('Persistent')).toBeDefined();

      // Advance time significantly
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Should still be visible
      expect(screen.getByText('Persistent')).toBeDefined();
    });

    it('should dismiss toast manually via dismiss function', async () => {
      let toastFn: ReturnType<typeof useToast>;
      let toastId: string;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastId = toastFn!.toast({ title: 'Manual Dismiss', duration: 0 }) as unknown as string;
      });

      expect(screen.getByText('Manual Dismiss')).toBeDefined();

      act(() => {
        toastFn!.dismiss(toastId);
      });

      expect(screen.queryByText('Manual Dismiss')).toBeNull();
    });

    it('should dismiss last toast when dismiss called without id', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'First', duration: 0 });
        toastFn!.toast({ title: 'Second', duration: 0 });
      });

      expect(screen.getByText('First')).toBeDefined();
      expect(screen.getByText('Second')).toBeDefined();

      act(() => {
        toastFn!.dismiss();
      });

      expect(screen.getByText('First')).toBeDefined();
      expect(screen.queryByText('Second')).toBeNull();
    });
  });

  // ==========================================================================
  // Requirement 13.4: Toast Queuing
  // ==========================================================================
  describe('Toast Queuing (Requirement 13.4)', () => {
    it('should display multiple toasts simultaneously', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Toast 1', duration: 0 });
        toastFn!.toast({ title: 'Toast 2', duration: 0 });
        toastFn!.toast({ title: 'Toast 3', duration: 0 });
      });

      expect(screen.getByText('Toast 1')).toBeDefined();
      expect(screen.getByText('Toast 2')).toBeDefined();
      expect(screen.getByText('Toast 3')).toBeDefined();
    });

    it('should maintain order of toasts', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'First', duration: 0 });
        toastFn!.toast({ title: 'Second', duration: 0 });
        toastFn!.toast({ title: 'Third', duration: 0 });
      });

      const toasts = screen.getAllByText(/First|Second|Third/);
      expect(toasts[0].textContent).toBe('First');
      expect(toasts[1].textContent).toBe('Second');
      expect(toasts[2].textContent).toBe('Third');
    });

    it('should dismiss toasts independently', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Toast A', duration: 1000 });
        toastFn!.toast({ title: 'Toast B', duration: 2000 });
        toastFn!.toast({ title: 'Toast C', duration: 3000 });
      });

      expect(screen.getByText('Toast A')).toBeDefined();
      expect(screen.getByText('Toast B')).toBeDefined();
      expect(screen.getByText('Toast C')).toBeDefined();

      // First toast should dismiss
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('Toast A')).toBeNull();
      expect(screen.getByText('Toast B')).toBeDefined();
      expect(screen.getByText('Toast C')).toBeDefined();

      // Second toast should dismiss
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('Toast B')).toBeNull();
      expect(screen.getByText('Toast C')).toBeDefined();

      // Third toast should dismiss
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.queryByText('Toast C')).toBeNull();
    });

    it('should handle mixed variants in queue', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ ...toast.success('Success!'), duration: 0 });
        toastFn!.toast({ ...toast.error('Error!'), duration: 0 });
        toastFn!.toast({ ...toast.info('Info!'), duration: 0 });
      });

      expect(screen.getByText('Success!')).toBeDefined();
      expect(screen.getByText('Error!')).toBeDefined();
      expect(screen.getByText('Info!')).toBeDefined();
    });

    it('should handle rapid toast creation', async () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          toastFn!.toast({ title: `Toast ${i}`, duration: 0 });
        }
      });

      // All toasts should be visible
      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`Toast ${i}`)).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // useToast Hook Tests
  // ==========================================================================
  describe('useToast Hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      const TestComponent = () => {
        useToast();
        return null;
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestComponent />)).toThrow(
        'useToast must be used within a ToastProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should provide toast and dismiss functions', () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      expect(toastFn!).toBeDefined();
      expect(typeof toastFn!.toast).toBe('function');
      expect(typeof toastFn!.dismiss).toBe('function');
    });
  });

  // ==========================================================================
  // Toast Helper Functions Tests
  // ==========================================================================
  describe('Toast Helper Functions', () => {
    it('should create success toast config', () => {
      const config = toast.success('Operation completed');
      
      expect(config).toEqual({
        title: 'Success',
        description: 'Operation completed',
        variant: 'success'
      });
    });

    it('should create error toast config', () => {
      const config = toast.error('Something went wrong');
      
      expect(config).toEqual({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive'
      });
    });

    it('should create info toast config', () => {
      const config = toast.info('Just letting you know');
      
      expect(config).toEqual({
        description: 'Just letting you know',
        variant: 'default'
      });
    });
  });

  // ==========================================================================
  // ToastViewport Tests
  // ==========================================================================
  describe('ToastViewport', () => {
    it('should not render when no toasts', () => {
      render(
        <TestWrapper>
          <ToastTrigger />
        </TestWrapper>
      );

      // No toast viewport should be rendered (no close buttons visible)
      expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
    });

    it('should render viewport when toasts exist', () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Viewport Test', description: 'Testing viewport', duration: 0 });
      });

      // Viewport should contain the toast
      expect(screen.getByText('Viewport Test')).toBeDefined();
      expect(screen.getByText('Testing viewport')).toBeDefined();
    });

    it('should position toasts in bottom-right corner', () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Positioned Toast', duration: 0 });
      });

      const viewport = screen.getByText('Positioned Toast').closest('.fixed');
      expect(viewport?.className).toContain('bottom-4');
      expect(viewport?.className).toContain('right-4');
    });
  });

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Accessible Toast', duration: 0 });
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeDefined();
      expect(closeButton.querySelector('.sr-only')?.textContent).toBe('Close');
    });

    it('should be keyboard accessible', () => {
      let toastFn: ReturnType<typeof useToast>;
      
      render(
        <TestWrapper>
          <ToastTrigger onMount={(ctx) => { toastFn = ctx; }} />
        </TestWrapper>
      );

      act(() => {
        toastFn!.toast({ title: 'Keyboard Test', duration: 0 });
      });
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      
      // Verify button is focusable
      expect(document.activeElement).toBe(closeButton);
    });
  });
});
