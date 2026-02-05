const path = require("path");
const fs = require("fs");
const { app } = require("electron");

class EnvironmentManager {
  constructor() {
    this.loadEnvironmentVariables();
  }

  loadEnvironmentVariables() {
    // In production, try multiple locations for .env file
    const possibleEnvPaths = [
      // Development path
      path.join(__dirname, "..", ".env"),
      // Production packaged app paths
      path.join(process.resourcesPath, ".env"),
      path.join(process.resourcesPath, "app.asar.unpacked", ".env"),
      path.join(app.getPath("userData"), ".env"), // User data directory
      // Legacy paths
      path.join(process.resourcesPath, "app", ".env"),
    ];

    let envLoaded = false;

    for (const envPath of possibleEnvPaths) {
      try {
        if (fs.existsSync(envPath)) {
          const result = require("dotenv").config({ path: envPath });
          if (!result.error) {
            envLoaded = true;
            break;
          }
        }
      } catch (error) {
        // Continue to next path
      }
    }
  }

  // Note: OpenAI key handling removed per R3 - AWS Transcribe is the sole transcription method
  // AWS credentials are managed via ~/.aws/credentials or environment variables
}

module.exports = EnvironmentManager;
