# Requirements Document

## Introduction

This feature enhances the Ollie voice dictation app with context-aware text styling capabilities, significant speed improvements, and an AWS AI-themed UI refresh. **Speed is the primary focus** - the goal is to match or exceed competitors like Wispr Flow (4x faster than typing, ~150+ WPM effective speed). The system will use real-time streaming transcription instead of batch processing, automatically detect the active application for context-aware styling (Formal, Casual, or Neutral), and provide an optimized AWS-only experience. The UI will be updated to reflect an AWS AI aesthetic, the onboarding wizard will be simplified, and default settings will be optimized for the best user experience.

## Glossary

- **Context_Detector**: The component responsible for detecting the currently active application on the user's system using Electron's native APIs
- **Style_Manager**: The component that manages text formality styles and their mappings to applications
- **Text_Enhancer**: The component that processes transcribed text through AWS Bedrock Claude with context-appropriate prompts
- **App_Mapping**: A user-configurable association between an application identifier and a text formality style
- **Formality_Style**: One of three text enhancement modes: Formal, Casual, or Neutral
- **Onboarding_Wizard**: The step-by-step setup flow that guides new users through initial configuration
- **Settings_Manager**: The component responsible for persisting and retrieving user preferences
- **Audio_Pipeline**: The component that captures, processes, and streams audio data to the transcription service
- **Transcription_Service**: The AWS Transcribe Streaming service that converts speech to text in real-time
- **WebSocket_Connection**: The persistent bidirectional connection used for real-time audio streaming to AWS Transcribe
- **Partial_Result**: Intermediate transcription text returned by AWS Transcribe before the final result is confirmed
- **Streaming_Transcription**: Real-time processing of audio as it's being recorded, as opposed to batch processing after recording stops

## Requirements

### Requirement 1: AWS AI Theme Rebranding

**User Story:** As a user, I want the app to have an AWS AI-inspired visual theme, so that it feels modern and aligned with AWS branding.

#### Acceptance Criteria

1. THE UI_Theme SHALL use AWS AI color palette including AWS orange (#FF9900), dark backgrounds, and modern accent colors
2. THE UI_Theme SHALL apply consistent styling across all components including buttons, cards, inputs, and navigation elements
3. THE UI_Theme SHALL maintain accessibility standards with sufficient color contrast ratios
4. WHEN the app launches THEN THE UI_Theme SHALL display the AWS AI aesthetic throughout all screens

### Requirement 2: Default Text Enhancement

**User Story:** As a user, I want AI text enhancement enabled by default, so that my transcriptions are automatically improved without manual configuration.

#### Acceptance Criteria

1. WHEN a new user completes onboarding THEN THE Settings_Manager SHALL set text enhancement to enabled by default
2. WHEN text enhancement is enabled THEN THE Text_Enhancer SHALL process all transcriptions through AWS Bedrock Claude
3. THE Settings_Manager SHALL allow users to disable text enhancement if desired
4. WHEN text enhancement is disabled THEN THE Text_Enhancer SHALL pass transcriptions through without modification

### Requirement 3: Simplified Onboarding Wizard

**User Story:** As a new user, I want a streamlined onboarding experience focused on AWS services, so that I can start using the app quickly without unnecessary configuration steps.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL remove all non-AWS processing options (OpenAI, local Whisper)
2. THE Onboarding_Wizard SHALL present AWS Transcribe as the sole transcription method
3. THE Onboarding_Wizard SHALL guide users through AWS credential verification
4. THE Onboarding_Wizard SHALL include a step for configuring context-aware styling preferences
5. WHEN a user completes onboarding THEN THE Onboarding_Wizard SHALL have configured all necessary AWS settings
6. THE Onboarding_Wizard SHALL complete in no more than 5 steps

### Requirement 4: Auto-detect Language

**User Story:** As a user, I want the app to automatically detect my spoken language, so that I don't need to manually configure language settings.

#### Acceptance Criteria

1. THE Settings_Manager SHALL set language detection to automatic by default
2. WHEN automatic language detection is enabled THEN THE Transcription_Service SHALL use AWS Transcribe's automatic language identification
3. THE Settings_Manager SHALL allow users to override automatic detection with a specific language preference
4. WHEN a specific language is selected THEN THE Transcription_Service SHALL use that language code for transcription

### Requirement 5: Context-Aware Application Detection

**User Story:** As a user, I want the app to detect which application I'm pasting text into, so that the text can be styled appropriately for that context.

#### Acceptance Criteria

1. WHEN the user initiates text paste THEN THE Context_Detector SHALL identify the currently active application
2. THE Context_Detector SHALL retrieve the application name, bundle identifier, and window title on macOS
3. THE Context_Detector SHALL retrieve the application name and executable path on Windows
4. IF the Context_Detector cannot identify the active application THEN THE Context_Detector SHALL return a default unknown context
5. THE Context_Detector SHALL expose the detected application information to the Style_Manager

### Requirement 6: Text Formality Styles

**User Story:** As a user, I want different text formality levels applied based on context, so that my dictated text matches the tone expected in different applications.

#### Acceptance Criteria

1. THE Style_Manager SHALL support three formality styles: Formal, Casual, and Neutral
2. WHEN Formal style is applied THEN THE Text_Enhancer SHALL use professional tone, proper grammar, complete sentences, and avoid contractions
3. WHEN Casual style is applied THEN THE Text_Enhancer SHALL use conversational tone, allow contractions, and permit informal expressions
4. WHEN Neutral style is applied THEN THE Text_Enhancer SHALL apply basic grammar corrections without altering tone
5. THE Style_Manager SHALL provide distinct enhancement prompts for each formality style

### Requirement 7: Application-to-Style Mapping

**User Story:** As a user, I want to configure which applications use which text style, so that I have control over how my text is formatted in different contexts.

#### Acceptance Criteria

1. THE Style_Manager SHALL maintain a configurable mapping between application identifiers and formality styles
2. THE Style_Manager SHALL provide default mappings for common applications:
   - Email clients (Mail, Outlook, Gmail) → Formal
   - Chat applications (Slack, Discord, Messages) → Casual
   - All other applications → Neutral
3. WHEN a user adds a custom App_Mapping THEN THE Settings_Manager SHALL persist the mapping to local storage
4. WHEN a user removes an App_Mapping THEN THE Settings_Manager SHALL delete the mapping and fall back to default behavior
5. THE Settings_Manager SHALL provide a UI for viewing and editing App_Mappings
6. WHEN an application matches multiple mapping rules THEN THE Style_Manager SHALL use the most specific match

### Requirement 8: Context-Aware Text Enhancement Flow

**User Story:** As a user, I want my dictated text to be automatically enhanced based on the target application, so that I get appropriately styled text without manual intervention.

#### Acceptance Criteria

1. WHEN transcription completes THEN THE Context_Detector SHALL identify the target application
2. WHEN the target application is identified THEN THE Style_Manager SHALL determine the appropriate formality style
3. WHEN the formality style is determined THEN THE Text_Enhancer SHALL apply the corresponding enhancement prompt
4. WHEN enhancement completes THEN THE System SHALL paste the styled text into the target application
5. IF text enhancement fails THEN THE System SHALL paste the original transcription and notify the user
6. THE System SHALL complete the entire flow (transcription → detection → enhancement → paste) within 2 seconds for typical utterances (under 30 seconds of speech)

### Requirement 9: Settings Persistence and Configuration

**User Story:** As a user, I want my context-aware styling preferences saved, so that they persist across app restarts.

#### Acceptance Criteria

1. THE Settings_Manager SHALL persist all App_Mappings to localStorage
2. THE Settings_Manager SHALL persist the user's default formality style preference
3. THE Settings_Manager SHALL persist the text enhancement enabled/disabled state
4. WHEN the app launches THEN THE Settings_Manager SHALL restore all persisted settings
5. THE Settings_Manager SHALL provide import/export functionality for App_Mappings
6. THE Settings_Manager SHALL validate imported mappings before applying them

### Requirement 10: Settings UI for Context-Aware Styling

**User Story:** As a user, I want a dedicated settings section for managing context-aware styling, so that I can easily customize the behavior.

#### Acceptance Criteria

1. THE Settings_UI SHALL display a list of all configured App_Mappings
2. THE Settings_UI SHALL allow adding new App_Mappings with application name and style selection
3. THE Settings_UI SHALL allow editing existing App_Mappings
4. THE Settings_UI SHALL allow deleting App_Mappings
5. THE Settings_UI SHALL provide a toggle for enabling/disabling context-aware styling globally
6. THE Settings_UI SHALL display the current default style for unmapped applications
7. WHEN context-aware styling is disabled THEN THE Text_Enhancer SHALL use the default style for all applications

### Requirement 11: Real-Time Streaming Transcription (Speed Optimization)

**User Story:** As a user, I want my speech transcribed in real-time as I speak, so that I experience minimal delay between speaking and seeing text output.

#### Acceptance Criteria

1. THE Transcription_Service SHALL use AWS Transcribe Streaming with WebSocket connection for real-time processing
2. THE Audio_Pipeline SHALL stream audio chunks of 100-200ms to AWS Transcribe while recording (not after recording stops)
3. THE System SHALL display partial transcription results as they arrive during recording
4. WHEN recording stops THEN THE System SHALL have the transcription ready within 500ms (excluding enhancement time)
5. THE Audio_Pipeline SHALL use optimal chunk sizes (100-200ms) as recommended by AWS for lowest latency
6. THE System SHALL maintain a persistent WebSocket connection during recording to eliminate connection overhead
7. THE Transcription_Service SHALL process audio in parallel with recording, not sequentially after recording completes

### Requirement 12: Optimized Text Enhancement Pipeline

**User Story:** As a user, I want text enhancement to be fast and non-blocking, so that the overall dictation experience feels instantaneous.

#### Acceptance Criteria

1. THE Text_Enhancer SHALL use Claude 3 Haiku (fastest model) by default for text enhancement
2. THE Text_Enhancer SHALL process enhancement requests with a maximum latency of 1 second for typical utterances (under 100 words)
3. THE System SHALL begin enhancement processing immediately when final transcription is available
4. IF enhancement takes longer than 2 seconds THEN THE System SHALL paste the raw transcription and apply enhancement asynchronously
5. THE Text_Enhancer SHALL use streaming responses from Bedrock when available to reduce perceived latency
6. THE Settings_Manager SHALL allow users to disable enhancement entirely for maximum speed

### Requirement 13: End-to-End Performance Target

**User Story:** As a user, I want the complete dictation flow to feel as fast as competitors like Wispr Flow, so that voice input is genuinely faster than typing.

#### Acceptance Criteria

1. THE System SHALL complete the full flow (speak → transcribe → enhance → paste) within 2 seconds of stopping recording for utterances under 30 seconds
2. THE System SHALL achieve effective dictation speed of at least 150 words per minute (3x faster than average typing)
3. THE System SHALL display visual feedback (partial transcription or progress indicator) within 500ms of starting to speak
4. THE Audio_Pipeline SHALL NOT introduce more than 200ms of processing overhead beyond network latency
5. THE System SHALL pre-initialize AWS connections on app startup to eliminate cold-start delays
6. WHEN the user presses the hotkey THEN recording SHALL start within 100ms
