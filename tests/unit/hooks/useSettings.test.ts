/**
 * Unit Tests for useSettings Hook
 * 
 * Tests the settings hook that manages application settings including
 * transcription preferences, reasoning model configuration, API keys,
 * and hotkey settings.
 * 
 * @module tests/unit/hooks/useSettings.test.ts
 * 
 * Validates: Requirements 17.2
 * - 17.2: useSettings hook tests - Settings retrieval from localStorage
 *         and settings update functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../../../src/hooks/useSettings';

// Mock the getModelProvider utility
vi.mock('../../../src/utils/languages', () => ({
  getModelProvider: vi.fn((modelId: string) => {
    if (modelId.includes('anthropic.claude')) return 'bedrock';
    if (modelId.startsWith('claude-')) return 'anthropic';
    return 'bedrock';
  })
}));

describe('useSettings Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 17.2: Settings Retrieval from localStorage
  // ===========================================================================
  describe('Settings Retrieval from localStorage', () => {
    it('should return default values when no settings exist in localStorage', () => {
      const { result } = renderHook(() => useSettings());

      // Check default values
      expect(result.current.preferredLanguage).toBe('auto');
      expect(result.current.useReasoningModel).toBe(true);
      expect(result.current.reasoningModel).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
      expect(result.current.anthropicApiKey).toBe('');
      expect(result.current.awsAccessKeyId).toBe('');
      expect(result.current.awsSecretAccessKey).toBe('');
      expect(result.current.awsRegion).toBe('us-east-1');
      expect(result.current.dictationKey).toBe('');
    });

    it('should retrieve preferredLanguage from localStorage', () => {
      localStorage.setItem('preferredLanguage', 'en-US');

      const { result } = renderHook(() => useSettings());

      expect(result.current.preferredLanguage).toBe('en-US');
    });

    it('should retrieve useReasoningModel from localStorage', () => {
      localStorage.setItem('useReasoningModel', 'false');

      const { result } = renderHook(() => useSettings());

      expect(result.current.useReasoningModel).toBe(false);
    });

    it('should retrieve reasoningModel from localStorage', () => {
      localStorage.setItem('reasoningModel', 'claude-3-haiku-20240307');

      const { result } = renderHook(() => useSettings());

      expect(result.current.reasoningModel).toBe('claude-3-haiku-20240307');
    });

    it('should retrieve anthropicApiKey from localStorage', () => {
      localStorage.setItem('anthropicApiKey', 'sk-ant-test-key');

      const { result } = renderHook(() => useSettings());

      expect(result.current.anthropicApiKey).toBe('sk-ant-test-key');
    });

    it('should retrieve AWS credentials from localStorage', () => {
      localStorage.setItem('awsAccessKeyId', 'AKIAIOSFODNN7EXAMPLE');
      localStorage.setItem('awsSecretAccessKey', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      localStorage.setItem('awsRegion', 'us-west-2');

      const { result } = renderHook(() => useSettings());

      expect(result.current.awsAccessKeyId).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(result.current.awsSecretAccessKey).toBe('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      expect(result.current.awsRegion).toBe('us-west-2');
    });

    it('should retrieve dictationKey from localStorage', () => {
      localStorage.setItem('dictationKey', 'D');

      const { result } = renderHook(() => useSettings());

      expect(result.current.dictationKey).toBe('D');
    });

    it('should compute reasoningProvider from reasoningModel', () => {
      localStorage.setItem('reasoningModel', 'anthropic.claude-3-haiku-20240307-v1:0');

      const { result } = renderHook(() => useSettings());

      expect(result.current.reasoningProvider).toBe('bedrock');
    });
  });

  // ===========================================================================
  // Requirement 17.2: Settings Update Functionality
  // ===========================================================================
  describe('Settings Update Functionality', () => {
    describe('Individual Setters', () => {
      it('should update preferredLanguage', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setPreferredLanguage('es-ES');
        });

        expect(result.current.preferredLanguage).toBe('es-ES');
        expect(localStorage.getItem('preferredLanguage')).toBe('es-ES');
      });

      it('should update useReasoningModel', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setUseReasoningModel(false);
        });

        expect(result.current.useReasoningModel).toBe(false);
        expect(localStorage.getItem('useReasoningModel')).toBe('false');
      });

      it('should update reasoningModel', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setReasoningModel('claude-3-opus-20240229');
        });

        expect(result.current.reasoningModel).toBe('claude-3-opus-20240229');
        expect(localStorage.getItem('reasoningModel')).toBe('claude-3-opus-20240229');
      });

      it('should update anthropicApiKey', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setAnthropicApiKey('sk-ant-new-key');
        });

        expect(result.current.anthropicApiKey).toBe('sk-ant-new-key');
        expect(localStorage.getItem('anthropicApiKey')).toBe('sk-ant-new-key');
      });

      it('should update AWS credentials individually', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setAwsAccessKeyId('NEWAKIAIOSFODNN7');
        });
        expect(result.current.awsAccessKeyId).toBe('NEWAKIAIOSFODNN7');

        act(() => {
          result.current.setAwsSecretAccessKey('newSecretKey123');
        });
        expect(result.current.awsSecretAccessKey).toBe('newSecretKey123');

        act(() => {
          result.current.setAwsRegion('eu-west-1');
        });
        expect(result.current.awsRegion).toBe('eu-west-1');
      });

      it('should update dictationKey', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setDictationKey('F');
        });

        expect(result.current.dictationKey).toBe('F');
        expect(localStorage.getItem('dictationKey')).toBe('F');
      });

      it('should update reasoning provider by setting appropriate model', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setReasoningProvider('anthropic');
        });

        expect(result.current.reasoningModel).toBe('claude-3-haiku-20240307');
      });

      it('should default to bedrock model for unknown provider', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.setReasoningProvider('unknown');
        });

        expect(result.current.reasoningModel).toBe('anthropic.claude-3-haiku-20240307-v1:0');
      });
    });

    describe('Batch Update Functions', () => {
      it('should update transcription settings via updateTranscriptionSettings', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateTranscriptionSettings({
            preferredLanguage: 'fr-FR'
          });
        });

        expect(result.current.preferredLanguage).toBe('fr-FR');
      });

      it('should handle partial transcription settings update', () => {
        const { result } = renderHook(() => useSettings());

        // Set initial value
        act(() => {
          result.current.setPreferredLanguage('en-US');
        });

        // Update with empty object (should not change anything)
        act(() => {
          result.current.updateTranscriptionSettings({});
        });

        expect(result.current.preferredLanguage).toBe('en-US');
      });

      it('should update reasoning settings via updateReasoningSettings', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateReasoningSettings({
            useReasoningModel: false,
            reasoningModel: 'claude-3-sonnet-20240229'
          });
        });

        expect(result.current.useReasoningModel).toBe(false);
        expect(result.current.reasoningModel).toBe('claude-3-sonnet-20240229');
      });

      it('should handle partial reasoning settings update', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateReasoningSettings({
            useReasoningModel: false
          });
        });

        expect(result.current.useReasoningModel).toBe(false);
        // reasoningModel should remain default
        expect(result.current.reasoningModel).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
      });

      it('should update API keys via updateApiKeys', () => {
        const { result } = renderHook(() => useSettings());

        act(() => {
          result.current.updateApiKeys({
            anthropicApiKey: 'sk-ant-batch-key',
            awsAccessKeyId: 'BATCHAKIAIOSFODNN7',
            awsSecretAccessKey: 'batchSecretKey',
            awsRegion: 'ap-southeast-1'
          });
        });

        expect(result.current.anthropicApiKey).toBe('sk-ant-batch-key');
        expect(result.current.awsAccessKeyId).toBe('BATCHAKIAIOSFODNN7');
        expect(result.current.awsSecretAccessKey).toBe('batchSecretKey');
        expect(result.current.awsRegion).toBe('ap-southeast-1');
      });

      it('should handle partial API keys update', () => {
        const { result } = renderHook(() => useSettings());

        // Set initial values
        act(() => {
          result.current.setAnthropicApiKey('initial-key');
          result.current.setAwsRegion('us-east-1');
        });

        // Update only some keys
        act(() => {
          result.current.updateApiKeys({
            awsRegion: 'eu-central-1'
          });
        });

        expect(result.current.anthropicApiKey).toBe('initial-key');
        expect(result.current.awsRegion).toBe('eu-central-1');
      });
    });
  });

  // ===========================================================================
  // Default Values When No Settings Exist
  // ===========================================================================
  describe('Default Values When No Settings Exist', () => {
    it('should return all default values for a fresh installation', () => {
      const { result } = renderHook(() => useSettings());

      // Verify all defaults
      expect(result.current.preferredLanguage).toBe('auto');
      expect(result.current.useReasoningModel).toBe(true);
      expect(result.current.reasoningModel).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
      expect(result.current.anthropicApiKey).toBe('');
      expect(result.current.awsAccessKeyId).toBe('');
      expect(result.current.awsSecretAccessKey).toBe('');
      expect(result.current.awsRegion).toBe('us-east-1');
      expect(result.current.dictationKey).toBe('');
    });

    it('should handle useReasoningModel default to true when localStorage has invalid value', () => {
      // Set an invalid value that's not 'false'
      localStorage.setItem('useReasoningModel', 'invalid');

      const { result } = renderHook(() => useSettings());

      // Should default to true since value !== 'false'
      expect(result.current.useReasoningModel).toBe(true);
    });

    it('should handle empty string values in localStorage', () => {
      localStorage.setItem('preferredLanguage', '');
      localStorage.setItem('dictationKey', '');

      const { result } = renderHook(() => useSettings());

      expect(result.current.preferredLanguage).toBe('');
      expect(result.current.dictationKey).toBe('');
    });
  });

  // ===========================================================================
  // Hook Return Value Structure
  // ===========================================================================
  describe('Hook Return Value Structure', () => {
    it('should return all expected state values', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current).toHaveProperty('preferredLanguage');
      expect(result.current).toHaveProperty('useReasoningModel');
      expect(result.current).toHaveProperty('reasoningModel');
      expect(result.current).toHaveProperty('reasoningProvider');
      expect(result.current).toHaveProperty('anthropicApiKey');
      expect(result.current).toHaveProperty('awsAccessKeyId');
      expect(result.current).toHaveProperty('awsSecretAccessKey');
      expect(result.current).toHaveProperty('awsRegion');
      expect(result.current).toHaveProperty('dictationKey');
    });

    it('should return all expected setter functions', () => {
      const { result } = renderHook(() => useSettings());

      expect(typeof result.current.setPreferredLanguage).toBe('function');
      expect(typeof result.current.setUseReasoningModel).toBe('function');
      expect(typeof result.current.setReasoningModel).toBe('function');
      expect(typeof result.current.setReasoningProvider).toBe('function');
      expect(typeof result.current.setAnthropicApiKey).toBe('function');
      expect(typeof result.current.setAwsAccessKeyId).toBe('function');
      expect(typeof result.current.setAwsSecretAccessKey).toBe('function');
      expect(typeof result.current.setAwsRegion).toBe('function');
      expect(typeof result.current.setDictationKey).toBe('function');
    });

    it('should return all expected batch update functions', () => {
      const { result } = renderHook(() => useSettings());

      expect(typeof result.current.updateTranscriptionSettings).toBe('function');
      expect(typeof result.current.updateReasoningSettings).toBe('function');
      expect(typeof result.current.updateApiKeys).toBe('function');
    });
  });

  // ===========================================================================
  // Persistence Across Re-renders
  // ===========================================================================
  describe('Persistence Across Re-renders', () => {
    it('should persist settings across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useSettings());

      act(() => {
        result.current.setPreferredLanguage('de-DE');
        result.current.setDictationKey('K');
      });

      // Re-render the hook
      rerender();

      expect(result.current.preferredLanguage).toBe('de-DE');
      expect(result.current.dictationKey).toBe('K');
    });

    it('should persist settings when hook is unmounted and remounted', () => {
      const { result, unmount } = renderHook(() => useSettings());

      act(() => {
        result.current.setPreferredLanguage('ja-JP');
        result.current.setUseReasoningModel(false);
      });

      unmount();

      // Mount a new instance
      const { result: newResult } = renderHook(() => useSettings());

      expect(newResult.current.preferredLanguage).toBe('ja-JP');
      expect(newResult.current.useReasoningModel).toBe(false);
    });
  });
});
