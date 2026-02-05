# Implementation Tasks

## Task 1: Create StreamingTranscribeManager
**Priority: Critical (Speed)**
**Requirement:** R11 (Real-Time Streaming Transcription)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 1.1 Create `src/helpers/streamingTranscribeManager.js` with WebSocket connection to AWS Transcribe Streaming
- [x] 1.2 Implement AWS SDK streaming client (uses @aws-sdk/client-transcribe-streaming)
- [x] 1.3 Implement audio event encoding via PassThrough stream
- [x] 1.4 Handle partial and final transcript results
- [x] 1.5 Add auto-detect language support (`IdentifyLanguage` parameter)
- [x] 1.6 Add IPC handlers in `src/helpers/ipcHandlers.js` for streaming transcription
- [x] 1.7 Expose streaming API in `preload.js`

### Acceptance Criteria
- ✅ WebSocket connects via AWS SDK
- ✅ Audio chunks stream in real-time during recording
- ✅ Final transcript available within timeout of recording stop
- ✅ Supports auto language detection

---

## Task 2: Create AudioWorklet for Low-Latency Capture
**Priority: Critical (Speed)**
**Requirement:** R11, R13 (Performance)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 2.1 Create `src/public/worklets/pcm-processor.js` AudioWorklet
- [x] 2.2 Implement 100ms chunk buffering at 16kHz
- [x] 2.3 Convert Float32 to Int16 PCM format
- [x] 2.4 Configure Vite to serve worklet file correctly

### Acceptance Criteria
- ✅ Audio captured with low latency
- ✅ Chunks sent every 100ms
- ✅ Fallback to ScriptProcessor if AudioWorklet unavailable

---

## Task 3: Refactor AudioManager for Streaming
**Priority: Critical (Speed)**
**Requirement:** R11, R12, R13
**Status:** ✅ COMPLETE

### Subtasks
- [x] 3.1 Create `src/helpers/streamingAudioManager.js` with AudioWorklet approach
- [x] 3.2 Open streaming session when recording starts (not after)
- [x] 3.3 Stream audio chunks in real-time during recording
- [x] 3.4 Add partial transcript callback for UI feedback
- [x] 3.5 Implement enhancement timeout (paste raw if >1.5s)
- [x] 3.6 Include ScriptProcessor fallback for compatibility
- [x] 3.7 Integrate StreamingAudioManager into useAudioRecording hook

### Acceptance Criteria
- ✅ Recording starts and opens WebSocket immediately
- ✅ Transcription ready quickly after stop
- ✅ Enhancement has timeout fallback
- ✅ Hook uses StreamingAudioManager instead of batch AudioManager

---

## Task 4: Create ContextDetector
**Priority: High**
**Requirement:** R5 (Context-Aware Application Detection)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 4.1 Create `src/helpers/contextDetector.js`
- [x] 4.2 Implement macOS detection using AppleScript fallback
- [x] 4.3 Implement Windows detection support (via active-win package)
- [x] 4.4 Add IPC handler in `ipcHandlers.js` for `getActiveAppContext`
- [x] 4.5 Expose in `preload.js`
- [x] 4.6 Add fallback for unsupported platforms

### Acceptance Criteria
- ✅ Returns app name, bundle ID (macOS), executable path (Windows)
- ✅ Detection completes quickly with caching
- ✅ Graceful fallback if detection fails

---

## Task 5: Create StyleManager
**Priority: High**
**Requirement:** R6, R7 (Formality Styles & Mapping)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 5.1 Create `src/helpers/styleManager.js`
- [x] 5.2 Define default app-to-style mappings
- [x] 5.3 Implement pattern matching (wildcards, bundle IDs)
- [x] 5.4 Add localStorage persistence for custom mappings
- [x] 5.5 Implement import/export functionality

### Acceptance Criteria
- ✅ Email apps → Formal, Chat apps → Casual, Others → Neutral
- ✅ Custom mappings persist across restarts
- ✅ Pattern matching supports wildcards

---

## Task 6: Update BedrockService with Style Prompts
**Priority: High**
**Requirement:** R6, R8 (Text Enhancement Flow)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 6.1 Add formal/casual/neutral prompt templates
- [x] 6.2 Create `processTextWithStyle(text, style)` method
- [x] 6.3 Integrate with ContextDetector and StyleManager in StreamingAudioManager
- [x] 6.4 Default to Claude 3 Haiku for speed

### Acceptance Criteria
- ✅ Style-appropriate text output
- ✅ Enhancement uses detected context
- ✅ Falls back gracefully if context detection fails

---

## Task 7: Settings UI for Context-Aware Styling
**Priority: Medium**
**Requirement:** R10 (Settings UI)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 7.1 Add "Context-Aware Styling" section to SettingsPage
- [x] 7.2 Create toggle for enabling/disabling feature
- [x] 7.3 Create default style selector
- [x] 7.4 Create app mapping list with add/edit/delete
- [x] 7.5 Add import/export buttons for mappings

### Acceptance Criteria
- Users can view and edit all mappings
- Changes persist immediately
- Clear visual feedback for actions

---

## Task 8: Simplify Onboarding Wizard
**Priority: Medium**
**Requirement:** R3 (Simplified Onboarding)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 8.1 Remove OpenAI and local Whisper options
- [x] 8.2 Set AWS Transcribe as sole transcription method
- [x] 8.3 Add context-aware styling intro step
- [x] 8.4 Enable text enhancement by default
- [x] 8.5 Set auto-detect language by default
- [x] 8.6 Reduce to 4-5 steps maximum

### Acceptance Criteria
- Onboarding completes in <2 minutes
- All AWS settings configured automatically
- No confusing options for non-AWS methods

---

## Task 9: AWS AI Theme Styling
**Priority: Medium**
**Requirement:** R1 (AWS AI Theme)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 9.1 Update CSS variables with AWS colors (#FF9900, #232F3E)
- [x] 9.2 Update button styles with AWS aesthetic
- [x] 9.3 Update card and input styles
- [x] 9.4 Ensure accessibility (contrast ratios)
- [x] 9.5 Update app icon if needed (Reviewed: Current blue icon works but could be updated to AWS Orange theme for full consistency - requires graphic design tools)

### Acceptance Criteria
- Consistent AWS AI look across all screens
- WCAG AA contrast compliance
- Modern, professional appearance

---

## Task 10: Auto-Detect Language
**Priority: Medium**
**Requirement:** R4 (Auto-detect Language)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 10.1 Set `identify-language` as default in StreamingTranscribeManager
- [x] 10.2 Update settings to show "Auto-detect" as default option
- [x] 10.3 Allow override to specific language
- [x] 10.4 Display detected language in UI (optional)

### Acceptance Criteria
- Auto-detect works for supported languages
- Users can override if needed
- No manual language selection required by default

---

## Task 11: Connection Pre-warming
**Priority: Medium**
**Requirement:** R13 (Performance)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 11.1 Create connection pool/warmup service
- [x] 11.2 Verify AWS credentials on app startup
- [x] 11.3 Pre-initialize Bedrock client
- [x] 11.4 Add health check indicator in UI

### Acceptance Criteria
- First transcription as fast as subsequent ones
- No cold-start delay on first use
- Clear indicator if AWS connection fails

---

## Task 12: Cleanup Legacy Code
**Priority: Low**
**Requirement:** R3 (Simplified)
**Status:** ✅ COMPLETE

### Subtasks
- [x] 12.1 Remove OpenAI-related code and dependencies
- [x] 12.2 Remove local Whisper code and Python bridge
- [x] 12.3 Remove unused processing mode selectors
- [x] 12.4 Update package.json (remove unused deps)
- [x] 12.5 Update documentation

### Acceptance Criteria
- No dead code paths
- Reduced bundle size
- Clean, maintainable codebase

---

## Implementation Order

1. **Phase 1 - Speed (Critical)**
   - Task 1: StreamingTranscribeManager
   - Task 2: AudioWorklet
   - Task 3: Refactor AudioManager

2. **Phase 2 - Context-Aware Styling**
   - Task 4: ContextDetector
   - Task 5: StyleManager
   - Task 6: BedrockService updates

3. **Phase 3 - UI & Polish**
   - Task 7: Settings UI
   - Task 8: Onboarding Wizard
   - Task 9: AWS Theme
   - Task 10: Auto-detect Language
   - Task 11: Connection Pre-warming

4. **Phase 4 - Cleanup**
   - Task 12: Remove legacy code

## Estimated Timeline

- Phase 1: 2-3 days (critical path)
- Phase 2: 1-2 days
- Phase 3: 1-2 days
- Phase 4: 0.5 day

**Total: ~5-7 days**
