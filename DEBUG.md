# Ollie Debug Mode

## Enabling Debug Logging

### Method 1: Command Line Flag
```bash
# macOS
/Applications/Ollie.app/Contents/MacOS/Ollie --debug

# Windows
Ollie.exe --debug
```

### Method 2: Environment Variable
```bash
# macOS/Linux
export OLLIE_DEBUG=true
open /Applications/Ollie.app

# Windows
set OLLIE_DEBUG=true
Ollie.exe
```

### Method 3: Debug File
Create an empty file named `ENABLE_DEBUG` in the app's user data directory:
- macOS: `~/Library/Application Support/Ollie/ENABLE_DEBUG`
- Windows: `%APPDATA%/Ollie/ENABLE_DEBUG`
- Linux: `~/.config/Ollie/ENABLE_DEBUG`

## Log Location

Debug logs are saved to:
- macOS: `~/Library/Application Support/Ollie/logs/`
- Windows: `%APPDATA%/Ollie/logs/`
- Linux: `~/.config/Ollie/logs/`

## What Gets Logged

- System information (platform, versions, paths)
- Audio pipeline events
- AWS Transcribe communication
- IPC messages
- Error details with stack traces

## Disabling Debug Mode

- Remove the `--debug` flag
- Unset the environment variable: `unset OLLIE_DEBUG`
- Delete the `ENABLE_DEBUG` file
