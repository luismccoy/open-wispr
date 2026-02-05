# Ollie Technical Reference for AI Assistants

This document provides comprehensive technical details about the Ollie project architecture for AI assistants working on the codebase.

## Project Overview

Ollie is an Electron-based desktop dictation application that uses AWS Transcribe for speech-to-text transcription. It provides a simple, AWS-powered voice dictation experience.

## Architecture Overview

### Core Technologies
- **Electron**: Desktop application framework
- **React**: UI framework with JSX/TSX components
- **Vite**: Build tool and dev server
- **AWS Transcribe Streaming**: Real-time speech-to-text
- **AWS Bedrock (Claude)**: Text enhancement

### Directory Structure
```
ollie/
├── main.js                 # Electron main process entry
├── preload.js              # Preload script for IPC bridge
├── src/
│   ├── App.jsx             # Main React application
│   ├── main.jsx            # React entry point
│   ├── index.html          # HTML template
│   ├── index.css           # Global styles
│   ├── components/         # React components
│   │   ├── ControlPanel.tsx
│   │   ├── OnboardingFlow.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── SimpleSettings.tsx
│   │   ├── TitleBar.tsx
│   │   └── ui/             # Reusable UI components
│   ├── helpers/            # Main process helpers
│   │   ├── audioManager.js      # Audio recording (renderer)
│   │   ├── transcribeManager.js # AWS Transcribe handler
│   │   ├── clipboard.js         # Clipboard operations
│   │   ├── database.js          # SQLite database
│   │   ├── hotkeyManager.js     # Global hotkey registration
│   │   ├── ipcHandlers.js       # IPC communication
│   │   ├── tray.js              # System tray
│   │   └── windowManager.js     # Window management
│   ├── hooks/              # React hooks
│   │   ├── useAudioRecording.js
│   │   ├── useSettings.ts
│   │   └── usePermissions.ts
│   ├── services/           # AI services
│   │   ├── BedrockService.js    # AWS Bedrock integration
│   │   └── ReasoningService.js  # Text enhancement
│   └── utils/              # Utility functions
├── assets/                 # App icons and images
└── scripts/                # Build scripts
```

## Key Components

### 1. Main Process (main.js)
Entry point for Electron. Initializes:
- Window manager
- IPC handlers
- Hotkey manager
- Tray icon
- Auto-updater

### 2. Audio Pipeline
1. **Recording**: `audioManager.js` uses MediaRecorder API
2. **Processing**: Converts WebM to PCM audio
3. **Transcription**: `transcribeManager.js` sends to AWS Transcribe Streaming
4. **Enhancement**: Optional text cleanup via Bedrock Claude
5. **Output**: Auto-paste via clipboard manager

### 3. AWS Integration
- **Credentials**: Read from `~/.aws/credentials` file
- **Region**: us-east-1 (configurable)
- **Services**: Transcribe Streaming, Bedrock

### 4. IPC Communication
Preload script exposes `window.electronAPI` with methods:
- `transcribeAWS(audioBuffer)` - Send audio to AWS Transcribe
- `getAWSCredentials()` - Get AWS credentials
- `pasteText(text)` - Paste text at cursor
- `updateHotkey(key)` - Change dictation hotkey

## Development

### Running Development Server
```bash
npm run dev
```
This starts both Vite dev server and Electron.

### Building
```bash
npm run build    # Build for production
npm run pack     # Package without signing
npm run dist     # Full distribution build
```

## Configuration

### AWS Credentials
Ollie reads credentials from `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = YOUR_KEY
aws_secret_access_key = YOUR_SECRET
```

### Settings Storage
User settings stored in localStorage:
- `dictationKey` - Hotkey for dictation
- `preferredLanguage` - Transcription language
- `useTextEnhancement` - Enable Bedrock enhancement

## Debug Mode

Enable with `--debug` flag or `OLLIE_DEBUG=true`:
- Logs saved to platform-specific app data directory
- Comprehensive logging of audio pipeline
