const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain, screen } = require('electron');

// Suppress Wayland color management errors on Fedora/GNOME
app.commandLine.appendSwitch('disable-features', 'WaylandColorManager');
app.commandLine.appendSwitch('disable-gpu-sandbox');
const path = require('path');
const { fork } = require('child_process');
const net = require('net');

let mainWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;
const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';

// ── Kill anything on our port first ──

function killPort(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => {
      // Port in use — try to free it
      if (IS_WIN) {
        require('child_process').exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (err, out) => {
          if (out) {
            const pid = out.trim().split(/\s+/).pop();
            if (pid && pid !== '0') require('child_process').exec(`taskkill /PID ${pid} /F`, () => resolve());
            else resolve();
          } else resolve();
        });
      } else {
        require('child_process').exec(`fuser -k ${port}/tcp`, () => setTimeout(resolve, 500));
      }
    });
    s.once('listening', () => { s.close(); resolve(); });
    s.listen(port);
  });
}

// ── Server Management ──

function startServer() {
  return new Promise(async (resolve) => {
    await killPort(PORT);

    const serverPath = path.join(__dirname, '..', 'index.js');
    serverProcess = fork(serverPath, [], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ELECTRON: '1' },
      silent: true,
    });

    let resolved = false;

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      process.stdout.write(`[server] ${msg}`);
      if (!resolved && msg.includes('Dashboard running')) {
        resolved = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(`[server-err] ${data.toString()}`);
    });

    serverProcess.on('error', (err) => {
      console.error('[server] Failed to start:', err.message);
      if (!resolved) { resolved = true; resolve(); }
    });

    serverProcess.on('exit', (code) => {
      if (!isQuitting) console.log(`[server] Exited with code ${code}`);
    });

    setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, 10000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill(IS_WIN ? 'SIGKILL' : 'SIGTERM');
    serverProcess = null;
  }
}

// ── Window ──

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const winW = Math.min(1360, Math.floor(screenW * 0.85));
  const winH = Math.min(860, Math.floor(screenH * 0.85));

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    minWidth: 800,
    minHeight: 500,
    center: true,
    title: 'Selfbot Dashboard',
    backgroundColor: '#08080a',
    show: false,
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    trafficLightPosition: { x: -100, y: -100 }, // hide macOS traffic lights
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Send maximize state to renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state', 'maximized');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state', 'normal');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Tray ──

function createTray() {
  // Generate a 16x16 indigo circle as PNG
  const size = 16;
  const icon = nativeImage.createEmpty();

  // Use a simple built-in approach
  try {
    tray = new Tray(nativeImage.createEmpty());
  } catch {
    return; // Tray not supported
  }

  tray.setToolTip('Selfbot Dashboard');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Dashboard', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Open in Browser', click: () => shell.openExternal(SERVER_URL) },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

// ── IPC ──

ipcMain.on('win-minimize', () => mainWindow?.minimize());
ipcMain.on('win-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('win-close', () => {
  if (mainWindow) mainWindow.hide();
});
ipcMain.handle('win-is-maximized', () => mainWindow?.isMaximized() ?? false);

// ── App Lifecycle ──

app.whenReady().then(async () => {
  console.log('[electron] Starting server...');
  await startServer();
  console.log('[electron] Creating window...');
  createWindow();
  createTray();
});

app.on('window-all-closed', () => { /* tray keeps alive */ });

app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

// Windows: single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
