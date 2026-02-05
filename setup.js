const fs = require("fs");
const path = require("path");

console.log("Setting up Ollie...");

const envTemplate = `# Ollie Configuration
# AWS credentials are loaded from ~/.aws/credentials or environment variables
# Run 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

# Optional: Set AWS region (default: us-east-1)
AWS_REGION=us-east-1

# Optional: Set language for better transcription accuracy
# Leave empty for auto-detection (recommended), or use language codes like 'en-US', 'es-ES', 'fr-FR', etc.
LANGUAGE=

# Optional: Debug mode (set to 'true' to enable verbose logging)
DEBUG=false`;

if (!fs.existsSync(".env")) {
  fs.writeFileSync(".env", envTemplate);
  console.log("✅ Created .env file template");
} else {
  console.log("⚠️  .env file already exists");
}

console.log(`
🎉 Setup complete!

Next steps:
1. Configure AWS credentials (run 'aws configure' or set environment variables)
2. Install dependencies: npm install
3. Run the app: npm start

Features:
- Global hotkey: Customizable (default: backtick \`) - set your own in Control Panel
- Draggable dictation panel: Click and drag to position anywhere on screen
- ESC to close the app
- Automatic text pasting at cursor location
- Real-time streaming transcription via AWS Transcribe
- Context-aware text styling (Formal/Casual/Neutral)
- AI text enhancement via AWS Bedrock

Note: Make sure you have the necessary system permissions for:
- Microphone access
- Accessibility permissions (for text pasting)
`);

