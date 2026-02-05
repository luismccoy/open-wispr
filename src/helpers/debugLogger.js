const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class DebugLogger {
  constructor() {
    // Only enable debug mode when explicitly requested
    this.debugMode =
      process.env.OLLIE_DEBUG === "true" ||
      process.argv.includes("--debug") ||
      this.checkDebugFile();
    this.logFile = null;
    this.logStream = null;

    if (this.debugMode) {
      // Create logs directory
      const logsDir = path.join(app.getPath("userData"), "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Create log file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      this.logFile = path.join(logsDir, `debug-${timestamp}.log`);

      // Create write stream for better performance
      this.logStream = fs.createWriteStream(this.logFile, { flags: "a" });

      this.log("🚀 Debug logging enabled", `Log file: ${this.logFile}`);
      this.log("System Info:", {
        platform: process.platform,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        appPath: app.getAppPath(),
        userDataPath: app.getPath("userData"),
        resourcesPath: process.resourcesPath,
        environment: process.env.NODE_ENV,
      });
    }
  }

  log(...args) {
    if (!this.debugMode) return;

    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      )
      .join(" ");

    const logLine = `[${timestamp}] ${message}\n`;

    console.log(...args);

    if (this.logStream) {
      this.logStream.write(logLine);
    }
  }

  error(...args) {
    if (!this.debugMode) return;

    const timestamp = new Date().toISOString();
    const message =
      "❌ ERROR: " +
      args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" ");

    const logLine = `[${timestamp}] ${message}\n`;

    console.error(...args);

    if (this.logStream) {
      this.logStream.write(logLine);
    }
  }

  logAudioData(context, audioBlob) {
    if (!this.debugMode) return;

    const audioInfo = {
      context,
      type: audioBlob?.type || "unknown",
      size: audioBlob?.size || 0,
      constructor: audioBlob?.constructor?.name || "unknown",
    };

    if (audioBlob instanceof ArrayBuffer) {
      audioInfo.byteLength = audioBlob.byteLength;
      // Check first few bytes
      const view = new Uint8Array(
        audioBlob,
        0,
        Math.min(16, audioBlob.byteLength)
      );
      audioInfo.firstBytes = Array.from(view)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
    } else if (audioBlob instanceof Uint8Array) {
      audioInfo.byteLength = audioBlob.byteLength;
      const view = audioBlob.slice(0, Math.min(16, audioBlob.byteLength));
      audioInfo.firstBytes = Array.from(view)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
    }

    this.log("🔊 Audio Data Debug", audioInfo);
  }

  logProcessStart(command, args, options = {}) {
    if (!this.debugMode) return;

    this.log("🚀 Starting process", {
      command,
      args,
      cwd: options.cwd || process.cwd(),
    });
  }

  logProcessOutput(processName, type, data) {
    if (!this.debugMode) return;

    const output = data.toString().trim();
    if (output) {
      this.log(`📝 ${processName} ${type}:`, output);
    }
  }

  getLogPath() {
    return this.logFile;
  }

  isEnabled() {
    return this.debugMode;
  }

  close() {
    if (this.logStream) {
      this.log("📝 Debug logger closing");
      this.logStream.end();
      this.logStream = null;
    }
  }

  checkDebugFile() {
    try {
      const debugFilePath = path.join(app.getPath("userData"), "ENABLE_DEBUG");
      return fs.existsSync(debugFilePath);
    } catch (e) {
      return false;
    }
  }
}

// Singleton instance
const debugLogger = new DebugLogger();

module.exports = debugLogger;
