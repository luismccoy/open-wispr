# Ollie

A desktop voice dictation app powered by AWS. Press a hotkey, speak, and your words appear wherever your cursor is.

## Features

- 🎤 **Voice to Text**: Real-time streaming transcription using AWS Transcribe
- ⚡ **Global Hotkey**: Dictate from anywhere with a single keypress
- 🧠 **AI Enhancement**: Optional text cleanup via AWS Bedrock Claude
- 🎯 **Context-Aware Styling**: Automatically adjusts text formality based on active app
- 🌍 **Auto Language Detection**: No manual language selection required
- 🔒 **AWS-Powered**: Your data stays within AWS services

## Quick Start

### Prerequisites
- Node.js 18+
- AWS credentials configured (`~/.aws/credentials`)

### Installation

```bash
# Clone the repository
git clone https://github.com/luiscoy/ollie.git
cd ollie

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### AWS Setup

Ollie requires AWS credentials with access to:
- **Amazon Transcribe** (for speech-to-text)
- **Amazon Bedrock** (optional, for text enhancement)

Configure your credentials:
```bash
# Using AWS CLI
aws configure

# Or manually create ~/.aws/credentials
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
region = us-east-1
```

## Usage

1. **Start the app**: Run `npm run dev` or launch the built application
2. **Press the hotkey**: Default is backtick (`) - configurable in settings
3. **Speak**: The dictation panel shows recording status
4. **Press hotkey again**: Your transcribed text is automatically pasted

## Building

```bash
# Development
npm run dev

# Production build
npm run build

# Package for distribution
npm run dist
```

## Configuration

Access settings through the Control Panel (click the tray icon):

- **Hotkey**: Change the dictation activation key
- **Language**: Set preferred transcription language (or use auto-detect)
- **Text Enhancement**: Enable AI-powered text cleanup
- **Context-Aware Styling**: Configure app-to-style mappings
  - Email apps → Formal style
  - Chat apps → Casual style
  - Others → Neutral style

## Permissions (macOS)

1. **Microphone**: Required for voice recording
2. **Accessibility**: Required for automatic text pasting
   - System Settings → Privacy & Security → Accessibility
   - Add Ollie and enable the checkbox

## Tech Stack

- **Electron** - Desktop framework
- **React** - UI components
- **Vite** - Build tooling
- **AWS Transcribe Streaming** - Real-time transcription
- **AWS Bedrock** - Text enhancement (Claude)

## License

MIT License - see [LICENSE](LICENSE) for details.
