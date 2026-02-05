# Implementation Plan: Comprehensive App Testing

## Overview

This implementation plan creates a comprehensive testing framework for the Ollie voice dictation app using Vitest, React Testing Library, fast-check for property-based testing, and Playwright for E2E tests. All tests are automated except for final voice input validation.

## Tasks

- [ ] 1. Set up testing infrastructure
  - [x] 1.1 Install testing dependencies (vitest, @testing-library/react, fast-check, playwright)
    - Add vitest, @vitest/coverage-v8, jsdom to devDependencies
    - Add @testing-library/react, @testing-library/user-event
    - Add fast-check for property-based testing
    - Add @playwright/test for E2E tests
    - _Requirements: All_

  - [x] 1.2 Create vitest.config.ts with coverage thresholds
    - Configure jsdom environment
    - Set up coverage with v8 provider
    - Configure 80% coverage thresholds
    - Set test timeout to 10000ms
    - _Requirements: All_

  - [x] 1.3 Create tests/setup.ts with global mocks
    - Mock window.electronAPI
    - Mock localStorage
    - Mock navigator.mediaDevices
    - Mock AudioContext and AudioWorkletNode
    - _Requirements: All_

- [ ] 2. Create mock infrastructure
  - [x] 2.1 Create tests/mocks/electronAPI.ts
    - Implement MockElectronAPI interface
    - Mock window management functions
    - Mock database operations
    - Mock clipboard operations
    - Mock streaming transcription functions
    - Mock Bedrock invocation
    - _Requirements: 10.1-10.7_

  - [x] 2.2 Create tests/mocks/awsServices.ts
    - Mock AWS Transcribe streaming
    - Mock partial/final result simulation
    - Mock language detection simulation
    - Mock Bedrock text enhancement
    - _Requirements: 7.1-7.7, 8.1-8.6_

  - [x] 2.3 Create tests/mocks/audioAPI.ts
    - Mock MediaDevices.getUserMedia
    - Mock MediaDevices.enumerateDevices
    - Mock AudioContext
    - Mock AudioWorkletNode
    - Mock MediaStream
    - _Requirements: 6.1-6.6_

  - [x] 2.4 Create tests/mocks/database.ts
    - In-memory SQLite mock
    - Mock saveTranscription
    - Mock getTranscriptions
    - Mock deleteTranscription
    - Mock clearTranscriptions
    - _Requirements: 11.1-11.5_

- [ ] 3. Create test factories and generators
  - [x] 3.1 Create tests/factories/transcription.ts
    - createTranscriptionItem factory
    - createTranscriptionList factory
    - _Requirements: 2.3, 2.4, 11.1-11.3_

  - [x] 3.2 Create tests/factories/appContext.ts
    - createEmailAppContext factory
    - createChatAppContext factory
    - createUnknownAppContext factory
    - _Requirements: 8.2-8.5, 9.1-9.3_

  - [x] 3.3 Create tests/generators/arbitraries.ts
    - validTranscriptionText arbitrary
    - validHotkey arbitrary
    - validLanguageCode arbitrary
    - transcriptionItem arbitrary
    - appContext arbitrary
    - _Requirements: All property tests_

- [x] 4. Checkpoint - Verify test infrastructure
  - Ensure all mocks are properly configured
  - Verify vitest runs with empty test suite
  - Ask the user if questions arise

- [ ] 5. Implement UI component unit tests
  - [x] 5.1 Create tests/unit/components/App.test.tsx
    - Test idle state rendering
    - Test hover state rendering
    - Test recording state rendering
    - Test processing state rendering
    - Test language badge display
    - Test Escape key handling
    - _Requirements: 1.1-1.6_

  - [ ]* 5.2 Write property test for language badge display
    - **Property 1: Language Badge Display**
    - **Validates: Requirements 1.5**

  - [x] 5.3 Create tests/unit/components/ControlPanel.test.tsx
    - Test initial render with navigation
    - Test transcription history display
    - Test delete transcription
    - Test clear all transcriptions
    - Test refresh functionality
    - _Requirements: 2.1-2.5_

  - [ ]* 5.4 Write property test for transcription list ordering
    - **Property 2: Transcription List Ordering**
    - **Validates: Requirements 2.3, 11.2**

  - [ ]* 5.5 Write property test for transcription deletion
    - **Property 3: Transcription Deletion Consistency**
    - **Validates: Requirements 2.4, 11.3**

  - [x] 5.6 Create tests/unit/components/OnboardingFlow.test.tsx
    - Test welcome step rendering
    - Test setup step with permission cards
    - Test permission gating
    - Test hotkey step with keyboard
    - Test smart styling step
    - Test completion and settings save
    - _Requirements: 3.1-3.8_

  - [ ]* 5.7 Write property test for hotkey selection UI
    - **Property 4: Hotkey Selection UI Update**
    - **Validates: Requirements 3.6**

  - [x] 5.8 Create tests/unit/components/SimpleSettings.test.tsx
    - Test settings loading from localStorage
    - Test hotkey change and validation
    - Test language preference change
    - Test enhancement toggle
    - Test settings save
    - _Requirements: 4.1-4.5_

  - [ ]* 5.9 Write property test for settings persistence
    - **Property 5: Settings Persistence Round-Trip**
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 5.10 Write property test for hotkey validation
    - **Property 6: Hotkey Validation**
    - **Validates: Requirements 4.2**

- [x] 6. Checkpoint - Verify UI component tests pass
  - Run vitest for unit/components
  - Ensure all tests pass
  - Ask the user if questions arise

- [ ] 7. Implement hook unit tests
  - [x] 7.1 Create tests/unit/hooks/useAudioRecording.test.ts
    - Test initialization and callback setup
    - Test startRecording
    - Test stopRecording
    - Test abortRecording
    - Test toggleListening
    - Test state changes
    - _Requirements: 6.1-6.6, 17.1_

  - [ ]* 7.2 Write property test for recording state invariant
    - **Property 10: Recording State Invariant**
    - **Validates: Requirements 6.6**

  - [x] 7.3 Create tests/unit/hooks/useSettings.test.ts
    - Test settings retrieval
    - Test settings update
    - _Requirements: 17.2_

  - [x] 7.4 Create tests/unit/hooks/useLocalStorage.test.ts
    - Test value retrieval
    - Test default value
    - Test value update
    - _Requirements: 17.3_

  - [ ]* 7.5 Write property test for localStorage hook
    - **Property 20: LocalStorage Hook Behavior**
    - **Validates: Requirements 17.2, 17.3**

  - [x] 7.6 Create tests/unit/hooks/usePermissions.test.ts
    - Test permission state retrieval
    - Test permission request
    - _Requirements: 17.4_

  - [x] 7.7 Create tests/unit/hooks/useHotkey.test.ts
    - Test hotkey retrieval
    - Test hotkey update
    - _Requirements: 5.1-5.4, 17.5_

  - [ ]* 7.8 Write property test for hotkey event emission
    - **Property 7: Hotkey Event Emission**
    - **Validates: Requirements 5.2**

  - [ ]* 7.9 Write property test for hotkey update behavior
    - **Property 8: Hotkey Update Behavior**
    - **Validates: Requirements 5.3**

  - [x] 7.10 Create tests/unit/hooks/useWindowDrag.test.ts
    - Test drag initialization
    - Test mouse event handling
    - _Requirements: 17.6_

- [ ] 8. Implement helper module unit tests
  - [x] 8.1 Create tests/unit/helpers/streamingAudioManager.test.ts
    - Test startRecording
    - Test stopRecording
    - Test abortRecording
    - Test callback invocation
    - Test error handling
    - _Requirements: 6.1-6.6_

  - [ ]* 8.2 Write property test for audio chunk streaming
    - **Property 9: Audio Chunk Streaming**
    - **Validates: Requirements 6.2, 7.2**

  - [x] 8.3 Create tests/unit/helpers/styleManager.test.ts
    - Test getStyleForApp with email apps
    - Test getStyleForApp with chat apps
    - Test getStyleForApp with unknown apps
    - Test addCustomMapping
    - Test removeCustomMapping
    - Test exportMappings
    - Test importMappings
    - _Requirements: 9.1-9.7_

  - [ ]* 8.4 Write property test for style mapping lookup
    - **Property 13: Style Mapping Lookup**
    - **Validates: Requirements 8.2-8.5, 9.1-9.3**

  - [ ]* 8.5 Write property test for custom mapping persistence
    - **Property 14: Custom Mapping Persistence**
    - **Validates: Requirements 9.4, 9.5**

  - [ ]* 8.6 Write property test for mapping serialization
    - **Property 15: Mapping Serialization Round-Trip**
    - **Validates: Requirements 9.6, 9.7**

  - [x] 8.7 Create tests/unit/helpers/connectionWarmup.test.ts
    - Test warmup initialization
    - Test getBedrockClient caching
    - Test healthCheck
    - Test reset
    - _Requirements: 12.1-12.5_

  - [ ]* 8.8 Write property test for Bedrock client caching
    - **Property 17: Bedrock Client Caching**
    - **Validates: Requirements 12.3**

- [-] 9. Checkpoint - Verify hook and helper tests pass
  - Run vitest for unit/hooks and unit/helpers
  - Ensure all tests pass
  - Ask the user if questions arise

- [ ] 10. Implement integration tests
  - [x] 10.1 Create tests/integration/ipcHandlers.test.ts
    - Test window-minimize handler
    - Test window-close handler
    - Test db-save-transcription handler
    - Test db-get-transcriptions handler
    - Test paste-text handler
    - Test get-active-app-context handler
    - Test invoke-bedrock-model handler
    - _Requirements: 10.1-10.7_

  - [x] 10.2 Create tests/integration/database.test.ts
    - Test saveTranscription
    - Test getTranscriptions ordering
    - Test deleteTranscription
    - Test clearTranscriptions
    - Test database initialization
    - _Requirements: 11.1-11.5_

  - [ ]* 10.3 Write property test for database CRUD
    - **Property 16: Database CRUD Operations**
    - **Validates: Requirements 10.3, 10.4, 11.1-11.3**

  - [x] 10.4 Create tests/integration/transcription.test.ts ✓
    - Test streaming session start
    - Test audio chunk sending
    - Test partial result handling
    - Test final result handling
    - Test language detection
    - Test session end
    - Test error handling
    - _Requirements: 7.1-7.7_

  - [ ]* 10.5 Write property test for transcription callbacks
    - **Property 11: Transcription Callback Emission**
    - **Validates: Requirements 7.3, 7.4**

  - [ ]* 10.6 Write property test for transcript assembly
    - **Property 12: Transcript Assembly**
    - **Validates: Requirements 7.6**

- [ ] 11. Implement toast and accessibility tests
  - [x] 11.1 Create tests/unit/components/Toast.test.tsx ✓
    - Test toast display with title and description
    - Test destructive variant styling
    - Test auto-dismiss
    - Test toast queuing
    - _Requirements: 13.1-13.4_

  - [ ]* 11.2 Write property test for toast content
    - **Property 18: Toast Content Display**
    - **Validates: Requirements 13.1**

  - [x] 11.3 Create tests/unit/accessibility.test.tsx ✓
    - Test ARIA labels on interactive elements
    - Test keyboard navigation focus
    - Test button aria-label attributes
    - Test toggle aria-pressed state
    - _Requirements: 15.1-15.4_

  - [ ]* 11.4 Write property test for accessibility attributes
    - **Property 19: Accessibility Attributes**
    - **Validates: Requirements 15.1, 15.3, 15.4**

- [x] 12. Implement error handling tests
  - [x] 12.1 Create tests/unit/errorHandling.test.ts
    - Test AWS credentials missing error
    - Test microphone access denied error
    - Test network connection failure error
    - Test transcription failure error
    - Test enhancement failure fallback
    - _Requirements: 16.1-16.5_

- [x] 13. Checkpoint - Verify integration and error tests pass
  - Run vitest for integration tests
  - Ensure all tests pass
  - Ask the user if questions arise

- [ ] 14. Implement performance tests
  - [x] 14.1 Create tests/performance/startup.perf.test.ts
    - Test app initialization time < 3 seconds
    - _Requirements: 14.1_

  - [x] 14.2 Create tests/performance/recording.perf.test.ts
    - Test recording start latency < 100ms
    - Test transcription partial result latency < 500ms
    - Test enhancement latency < 2 seconds
    - _Requirements: 14.2-14.4_

  - [x] 14.3 Create tests/performance/database.perf.test.ts
    - Test database query time < 50ms
    - _Requirements: 14.5_

  - [x] 14.4 Create tests/performance/memory.perf.test.ts
    - Test memory usage during recording < 500MB
    - _Requirements: 14.6_

- [x] 15. Implement E2E tests
  - [x] 15.1 Create tests/e2e/onboarding.e2e.test.ts
    - Test new user sees onboarding
    - Test onboarding step navigation
    - Test permission granting flow
    - Test onboarding completion
    - _Requirements: 18.1, 18.2_

  - [x] 15.2 Create tests/e2e/dictation.e2e.test.ts
    - Test hotkey triggers recording
    - Test recording state display
    - Test processing state display
    - Test transcription paste (mocked audio)
    - _Requirements: 18.3-18.5_

  - [x] 15.3 Create tests/e2e/settings.e2e.test.ts
    - Test control panel display
    - Test settings modification
    - Test transcription history display
    - _Requirements: 18.6_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Run full test suite with coverage
  - Verify coverage thresholds are met
  - Generate coverage report
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each property test references specific requirements for traceability
- All tests use mocked AWS services and Electron APIs
- Manual testing is only required for actual voice input validation at the end
- Performance tests use mocked services with simulated latencies
