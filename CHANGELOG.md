# Changelog

All notable changes to Ollie will be documented in this file.

## [1.1.0] - 2026-02-04

### Added
- Context-aware text styling - automatically adjusts formality based on active application
- Real-time streaming transcription with AWS Transcribe Streaming
- Auto-detect language support (no manual language selection required)
- Connection pre-warming for faster first transcription
- AWS connection health indicator in settings
- Style mapping configuration in settings (formal/casual/neutral per app)

### Changed
- Simplified onboarding wizard (4-5 steps, AWS-only)
- Updated UI with AWS AI theme (orange/dark blue color scheme)
- Text enhancement enabled by default
- Auto-detect language enabled by default

### Improved
- Transcription speed with streaming architecture
- First-use experience with connection pre-warming
- Settings UI organization

## [1.0.0] - 2026-02-03

### Changed
- Rebranded from OpenWispr to Ollie
- Simplified to AWS-only transcription (removed local Whisper, OpenAI API)
- Now uses AWS Transcribe Streaming for real-time speech-to-text
- AWS Bedrock Claude for optional text enhancement

### Removed
- Local Whisper processing (Python dependency)
- OpenAI API integration
- FFmpeg dependency

### Fixed
- AWS credentials loading from ~/.aws/credentials file
