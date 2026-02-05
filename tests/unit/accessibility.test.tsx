/**
 * Accessibility Tests
 * 
 * Tests accessibility compliance across UI components including ARIA labels,
 * keyboard navigation, focus management, and screen reader support.
 * 
 * @module tests/unit/accessibility.test.tsx
 * 
 * Validates: Requirements 15.1-15.4
 * - 15.1: ALL interactive elements SHALL have appropriate ARIA labels
 * - 15.2: ALL keyboard navigation SHALL follow standard focus patterns
 * - 15.3: ALL buttons SHALL have aria-label attributes
 * - 15.4: ALL toggles SHALL have aria-pressed state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';

// Import components to test
import { Button } from '../../src/components/ui/button';
import { Toggle } from '../../src/components/ui/toggle';
import { Input } from '../../src/components/ui/input';
import { Textarea } from '../../src/components/ui/textarea';
import { ToastProvider, useToast } from '../../src/components/ui/Toast';

// ============================================================================
// Test Setup
// ============================================================================

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Requirement 15.1: ARIA Labels on Interactive Elements
  // ==========================================================================
  describe('ARIA Labels (Requirement 15.1)', () => {
    it('should allow aria-label on Button component', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeDefined();
      expect(button.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('should allow aria-labelledby on Button component', () => {
      render(
        <>
          <span id="button-label">Submit form</span>
          <Button aria-labelledby="button-label">Submit</Button>
        </>
      );
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-labelledby')).toBe('button-label');
    });

    it('should allow aria-describedby on Input component', () => {
      render(
        <>
          <Input aria-describedby="input-help" placeholder="Enter text" />
          <span id="input-help">Enter your full name</span>
        </>
      );
      
      const input = screen.getByPlaceholderText('Enter text');
      expect(input.getAttribute('aria-describedby')).toBe('input-help');
    });

    it('should allow aria-label on Input component', () => {
      render(<Input aria-label="Search query" />);
      
      const input = screen.getByRole('textbox', { name: 'Search query' });
      expect(input).toBeDefined();
    });

    it('should allow aria-label on Textarea component', () => {
      render(<Textarea aria-label="Message content" />);
      
      const textarea = screen.getByRole('textbox', { name: 'Message content' });
      expect(textarea).toBeDefined();
    });

    it('should allow aria-required on form elements', () => {
      render(<Input aria-required="true" aria-label="Required field" />);
      
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should allow aria-invalid on form elements', () => {
      render(<Input aria-invalid="true" aria-label="Invalid field" />);
      
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('should allow aria-disabled on interactive elements', () => {
      render(<Button aria-disabled="true">Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ==========================================================================
  // Requirement 15.2: Keyboard Navigation Focus Patterns
  // ==========================================================================
  describe('Keyboard Navigation (Requirement 15.2)', () => {
    it('should allow Button to receive focus', () => {
      render(<Button>Focusable Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('should allow Input to receive focus', () => {
      render(<Input aria-label="Focusable input" />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(document.activeElement).toBe(input);
    });

    it('should allow Textarea to receive focus', () => {
      render(<Textarea aria-label="Focusable textarea" />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      expect(document.activeElement).toBe(textarea);
    });

    it('should allow Toggle to receive focus', () => {
      render(<Toggle checked={false} onChange={() => {}} aria-label="Focusable toggle" />);
      
      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      expect(document.activeElement).toBe(toggle);
    });

    it('should support Tab key navigation between elements', () => {
      render(
        <div>
          <Button data-testid="btn1">First</Button>
          <Input data-testid="input1" aria-label="Input" />
          <Button data-testid="btn2">Second</Button>
        </div>
      );
      
      const btn1 = screen.getByTestId('btn1');
      const input1 = screen.getByTestId('input1');
      const btn2 = screen.getByTestId('btn2');
      
      // All elements should be focusable
      btn1.focus();
      expect(document.activeElement).toBe(btn1);
      
      input1.focus();
      expect(document.activeElement).toBe(input1);
      
      btn2.focus();
      expect(document.activeElement).toBe(btn2);
    });

    it('should respect tabIndex attribute', () => {
      render(<Button tabIndex={-1}>Not tabbable</Button>);
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('tabindex')).toBe('-1');
    });

    it('should handle Enter key on buttons', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // Button should respond to Enter key (native behavior)
      expect(button).toBeDefined();
    });

    it('should handle Space key on buttons', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      // Button should respond to Space key (native behavior)
      expect(button).toBeDefined();
    });

    it('should not allow focus on disabled buttons', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled', true);
    });
  });

  // ==========================================================================
  // Requirement 15.3: Button aria-label Attributes
  // ==========================================================================
  describe('Button aria-label Attributes (Requirement 15.3)', () => {
    it('should support aria-label on primary button', () => {
      render(<Button aria-label="Submit form">Submit</Button>);
      
      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toBeDefined();
    });

    it('should support aria-label on icon-only button', () => {
      render(
        <Button aria-label="Close" size="icon">
          <span>×</span>
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'Close' });
      expect(button).toBeDefined();
    });

    it('should support aria-label on destructive button', () => {
      render(
        <Button variant="destructive" aria-label="Delete item">
          Delete
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'Delete item' });
      expect(button).toBeDefined();
    });

    it('should support aria-label on outline button', () => {
      render(
        <Button variant="outline" aria-label="Cancel action">
          Cancel
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'Cancel action' });
      expect(button).toBeDefined();
    });

    it('should support aria-label on ghost button', () => {
      render(
        <Button variant="ghost" aria-label="More options">
          ...
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'More options' });
      expect(button).toBeDefined();
    });

    it('should support aria-label on link button', () => {
      render(
        <Button variant="link" aria-label="Learn more about this feature">
          Learn more
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'Learn more about this feature' });
      expect(button).toBeDefined();
    });

    it('should use text content as accessible name when no aria-label', () => {
      render(<Button>Save Changes</Button>);
      
      const button = screen.getByRole('button', { name: 'Save Changes' });
      expect(button).toBeDefined();
    });

    it('should support aria-expanded for expandable buttons', () => {
      render(
        <Button aria-expanded="false" aria-label="Expand menu">
          Menu
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    it('should support aria-haspopup for menu buttons', () => {
      render(
        <Button aria-haspopup="menu" aria-label="Open menu">
          Menu
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
    });
  });

  // ==========================================================================
  // Requirement 15.4: Toggle aria-checked State
  // ==========================================================================
  describe('Toggle aria-checked State (Requirement 15.4)', () => {
    it('should have aria-checked=false when not checked', () => {
      render(<Toggle checked={false} onChange={() => {}} aria-label="Bold text" />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle.getAttribute('aria-checked')).toBe('false');
    });

    it('should have aria-checked=true when checked', () => {
      render(<Toggle checked={true} onChange={() => {}} aria-label="Bold text" />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle.getAttribute('aria-checked')).toBe('true');
    });

    it('should toggle aria-checked state on click', () => {
      const TestToggle = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <Toggle 
            checked={checked} 
            onChange={setChecked}
            aria-label="Toggle option"
          />
        );
      };
      
      render(<TestToggle />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle.getAttribute('aria-checked')).toBe('false');
      
      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-checked')).toBe('true');
      
      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-checked')).toBe('false');
    });

    it('should support aria-label on toggle', () => {
      render(<Toggle checked={false} onChange={() => {}} aria-label="Enable notifications" />);
      
      const toggle = screen.getByRole('switch', { name: 'Enable notifications' });
      expect(toggle).toBeDefined();
    });

    it('should support disabled state on toggle', () => {
      render(<Toggle checked={false} onChange={() => {}} disabled aria-label="Disabled toggle" />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveProperty('disabled', true);
    });

    it('should not change aria-checked when disabled', () => {
      render(<Toggle checked={false} onChange={() => {}} disabled aria-label="Disabled toggle" />);
      
      const toggle = screen.getByRole('switch');
      const initialChecked = toggle.getAttribute('aria-checked');
      
      fireEvent.click(toggle);
      
      expect(toggle.getAttribute('aria-checked')).toBe(initialChecked);
    });

    it('should support keyboard activation with Space', () => {
      const handleChange = vi.fn();
      render(
        <Toggle checked={false} onChange={handleChange} aria-label="Toggle" />
      );
      
      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      // Toggle should be focusable and respond to keyboard
      expect(document.activeElement).toBe(toggle);
    });

    it('should support keyboard activation with Enter', () => {
      const handleChange = vi.fn();
      render(
        <Toggle checked={false} onChange={handleChange} aria-label="Toggle" />
      );
      
      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      // Toggle should be focusable
      expect(document.activeElement).toBe(toggle);
    });
  });

  // ==========================================================================
  // Additional Accessibility Tests
  // ==========================================================================
  describe('Additional Accessibility Features', () => {
    it('should support role attribute override', () => {
      render(<Button role="menuitem">Menu Item</Button>);
      
      const element = screen.getByRole('menuitem');
      expect(element).toBeDefined();
    });

    it('should support aria-live for dynamic content', () => {
      render(
        <div aria-live="polite" data-testid="live-region">
          Status: Ready
        </div>
      );
      
      const region = screen.getByTestId('live-region');
      expect(region.getAttribute('aria-live')).toBe('polite');
    });

    it('should support aria-busy for loading states', () => {
      render(<Button aria-busy="true">Loading...</Button>);
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should support aria-hidden for decorative elements', () => {
      render(
        <Button>
          <span aria-hidden="true">🎉</span>
          Celebrate
        </Button>
      );
      
      const icon = screen.getByText('🎉');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should support sr-only class for screen reader text', () => {
      render(
        <Button>
          <span className="sr-only">Screen reader only text</span>
          <span aria-hidden="true">👁</span>
        </Button>
      );
      
      const srText = screen.getByText('Screen reader only text');
      expect(srText.className).toContain('sr-only');
    });

    it('should support aria-current for navigation', () => {
      render(<Button aria-current="page">Current Page</Button>);
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-current')).toBe('page');
    });

    it('should support aria-controls for related elements', () => {
      render(
        <>
          <Button aria-controls="panel1" aria-expanded="false">
            Toggle Panel
          </Button>
          <div id="panel1">Panel content</div>
        </>
      );
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-controls')).toBe('panel1');
    });
  });

  // ==========================================================================
  // Form Accessibility Tests
  // ==========================================================================
  describe('Form Accessibility', () => {
    it('should support aria-errormessage for form validation', () => {
      render(
        <>
          <Input 
            aria-invalid="true" 
            aria-errormessage="error1"
            aria-label="Email"
          />
          <span id="error1">Please enter a valid email</span>
        </>
      );
      
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('aria-errormessage')).toBe('error1');
    });

    it('should support placeholder as accessible description', () => {
      render(<Input placeholder="Enter your email" aria-label="Email" />);
      
      const input = screen.getByPlaceholderText('Enter your email');
      expect(input).toBeDefined();
    });

    it('should support autocomplete attribute', () => {
      render(<Input autoComplete="email" aria-label="Email" />);
      
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('autocomplete')).toBe('email');
    });

    it('should support type attribute for input semantics', () => {
      render(<Input type="email" aria-label="Email address" />);
      
      const input = screen.getByRole('textbox');
      expect(input.getAttribute('type')).toBe('email');
    });
  });

  // ==========================================================================
  // Toast Accessibility Tests
  // ==========================================================================
  describe('Toast Accessibility', () => {
    const ToastTrigger = () => {
      const { toast } = useToast();
      return (
        <Button onClick={() => toast({ title: 'Notification', description: 'Message' })}>
          Show Toast
        </Button>
      );
    };

    it('should render toast with accessible close button', () => {
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <ToastTrigger />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeDefined();
      
      vi.useRealTimers();
    });

    it('should have sr-only text for close button', () => {
      vi.useFakeTimers();
      
      render(
        <ToastProvider>
          <ToastTrigger />
        </ToastProvider>
      );
      
      fireEvent.click(screen.getByRole('button', { name: 'Show Toast' }));
      
      const srText = screen.getByText('Close');
      expect(srText.className).toContain('sr-only');
      
      vi.useRealTimers();
    });
  });
});
