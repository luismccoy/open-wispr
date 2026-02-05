const { screen, BrowserWindow } = require("electron");
const HotkeyManager = require("./hotkeyManager");
const DragManager = require("./dragManager");
const MenuManager = require("./menuManager");
const DevServerManager = require("./devServerManager");
const {
  MAIN_WINDOW_CONFIG,
  CONTROL_PANEL_CONFIG,
  WindowPositionUtil,
} = require("./windowConfig");

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.controlPanelWindow = null;
    this.tray = null;
    this.hotkeyManager = new HotkeyManager();
    this.dragManager = new DragManager();
  }

  async createMainWindow() {
    const display = screen.getPrimaryDisplay();
    const position = WindowPositionUtil.getMainWindowPosition(display);
    
    console.log('[WindowManager] Creating main window at position:', position);
    console.log('[WindowManager] Display info:', {
      bounds: display.bounds,
      workArea: display.workArea
    });

    this.mainWindow = new BrowserWindow({
      ...MAIN_WINDOW_CONFIG,
      ...position,
    });

    console.log('[WindowManager] Main window created, loading content...');
    await this.loadMainWindow();
    console.log('[WindowManager] Main window content loaded');
    
    await this.initializeHotkey();
    this.dragManager.setTargetWindow(this.mainWindow);
    MenuManager.setupMainMenu();

    this.mainWindow.webContents.on(
      "did-fail-load",
      async (_event, errorCode, errorDescription, validatedURL) => {
        console.error(
          "Failed to load main window:",
          errorCode,
          errorDescription,
          validatedURL
        );
        if (
          process.env.NODE_ENV === "development" &&
          validatedURL.includes("localhost:5174")
        ) {
          // Retry connection to dev server
          setTimeout(async () => {
            const isReady = await DevServerManager.waitForDevServer();
            if (isReady) {
              console.log("Dev server ready, reloading...");
              this.mainWindow.reload();
            }
          }, 2000);
        }
      }
    );

    this.mainWindow.webContents.on("did-finish-load", () => {
      console.log('[WindowManager] Main window did-finish-load');
      // Ensure window is visible after loading
      setTimeout(() => {
        if (!this.mainWindow.isVisible()) {
          console.log('[WindowManager] Window not visible, showing...');
          this.mainWindow.show();
          this.mainWindow.focus();
        } else {
          console.log('[WindowManager] Window is visible');
        }
      }, 1000);
    });

    // Ensure window is always on top, even above fullscreen apps
    WindowPositionUtil.setupAlwaysOnTop(this.mainWindow);
    this.mainWindow.on("show", () => {
      WindowPositionUtil.setupAlwaysOnTop(this.mainWindow);
    });
    
    console.log('[WindowManager] Main window setup complete');
  }

  async loadMainWindow() {
    const appUrl = DevServerManager.getAppUrl(false);
    if (process.env.NODE_ENV === "development") {
      const isReady = await DevServerManager.waitForDevServer();
      if (!isReady) {
        // Dev server not ready, continue anyway
      }
    }
    this.mainWindow.loadURL(appUrl);
  }

  async initializeHotkey() {
    const callback = () => {
      console.log('[WindowManager] >>>>>> HOTKEY PRESSED! <<<<<<');
      console.log('[WindowManager] mainWindow exists:', !!this.mainWindow);
      console.log('[WindowManager] mainWindow visible:', this.mainWindow?.isVisible());
      console.log('[WindowManager] mainWindow destroyed:', this.mainWindow?.isDestroyed());
      
      if (this.mainWindow.isDestroyed()) {
        console.error('[WindowManager] Main window is destroyed!');
        return;
      }
      
      if (!this.mainWindow.isVisible()) {
        console.log('[WindowManager] Showing main window...');
        this.mainWindow.show();
      }
      
      // Check if webContents is ready
      const webContents = this.mainWindow.webContents;
      console.log('[WindowManager] webContents exists:', !!webContents);
      console.log('[WindowManager] webContents isLoading:', webContents?.isLoading());
      console.log('[WindowManager] webContents isCrashed:', webContents?.isCrashed());
      
      if (webContents && !webContents.isLoading() && !webContents.isCrashed()) {
        console.log('[WindowManager] Sending toggle-dictation to webContents...');
        webContents.send("toggle-dictation");
        console.log('[WindowManager] toggle-dictation sent!');
      } else {
        console.error('[WindowManager] webContents not ready, waiting...');
        // Wait for page to load then send
        webContents.once('did-finish-load', () => {
          console.log('[WindowManager] Page loaded, sending toggle-dictation...');
          webContents.send("toggle-dictation");
        });
      }
    };

    console.log('[WindowManager] Initializing hotkey...');
    await this.hotkeyManager.initializeHotkey(this.mainWindow, callback);
    console.log('[WindowManager] Hotkey initialized');
  }

  async updateHotkey(hotkey) {
    const callback = () => {
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show();
      }
      this.mainWindow.webContents.send("toggle-dictation");
    };

    return await this.hotkeyManager.updateHotkey(hotkey, callback);
  }

  async startWindowDrag() {
    return await this.dragManager.startWindowDrag();
  }

  async stopWindowDrag() {
    return await this.dragManager.stopWindowDrag();
  }

  async createControlPanelWindow() {
    if (this.controlPanelWindow && !this.controlPanelWindow.isDestroyed()) {
      if (!this.controlPanelWindow.isVisible()) {
        this.controlPanelWindow.show();
      }
      this.controlPanelWindow.focus();
      return;
    }

    this.controlPanelWindow = new BrowserWindow(CONTROL_PANEL_CONFIG);

    console.log("📱 Loading control panel content...");
    await this.loadControlPanel();

    // Set up menu for control panel to ensure text input works
    MenuManager.setupControlPanelMenu(this.controlPanelWindow);

    this.controlPanelWindow.show();
    this.controlPanelWindow.focus();

    this.controlPanelWindow.on("closed", () => {
      this.controlPanelWindow = null;
    });
  }

  async loadControlPanel() {
    const appUrl = DevServerManager.getAppUrl(true);
    if (process.env.NODE_ENV === "development") {
      const isReady = await DevServerManager.waitForDevServer();
      if (!isReady) {
        console.error(
          "Dev server not ready for control panel, loading anyway..."
        );
      }
    }
    this.controlPanelWindow.loadURL(appUrl);
  }

  showDictationPanel() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show();
      }
      this.mainWindow.focus();
    }
  }
}

module.exports = WindowManager;
