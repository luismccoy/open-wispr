import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export const Toggle = ({ checked, onChange, disabled = false, "aria-label": ariaLabel }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aws-orange)] focus-visible:ring-offset-2 ${
      checked ? 'bg-[var(--aws-orange)]' : 'bg-[var(--color-border)]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

