const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow;
let serverProcess;
let bridgeProcess;

const isDev = process.env.NODE_ENV === 'development';

const binPath = isDev
  ? path.join(__dirname, '..', 'backend', 'build')
  : path.join(process.resourcesPath, 'bin');

function startBackend() {
  console.log('[Electron] Starting server from:', binPath);

  serverProcess = spawn(
    path.join(binPath, 'lanshare_server.exe'), [], {
    cwd: binPath,
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write('[Server] ' + d));
  serverProcess.stderr.on('data', (d) => process.stderr.write('[Server ERR] ' + d));
  serverProcess.on('error', (e) => console.error('[Server spawn error]', e));

  setTimeout(() => {
    console.log('[Electron] Starting bridge...');
    bridgeProcess = spawn(
      path.join(binPath, 'lanshare_app.exe'), [], {
      cwd: binPath,
      stdio: 'pipe'
    });

    bridgeProcess.stdout.on('data', (d) => process.stdout.write('[Bridge] ' + d));
    bridgeProcess.stderr.on('data', (d) => process.stderr.write('[Bridge ERR] ' + d));
    bridgeProcess.on('error', (e) => console.error('[Bridge spawn error]', e));
  }, 2000);
}

function tryLoadURL(win, attempts = 0) {
  // 5173 try karo pehle, phir 5174
  const ports = [5173, 5174, 5175];
  
  const tryPort = (portIndex) => {
    if (portIndex >= ports.length) {
      console.error('[Electron] No Vite port found');
      return;
    }
    const port = ports[portIndex];
    http.get(`http://localhost:${port}`, () => {
      console.log(`[Electron] Vite ready on port ${port}`);
      win.loadURL(`http://localhost:${port}`);
    }).on('error', () => {
      if (attempts < 30) {
        console.log(`[Electron] Waiting for Vite... (${attempts + 1}/30)`);
        setTimeout(() => tryLoadURL(win, attempts + 1), 1000);
      } else {
        // Try next port
        tryPort(portIndex + 1);
      }
    });
  };
  
  tryPort(0);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: '⚡ LanShare v2',
    backgroundColor: '#050810',
    show: false // pehle hide rakho — load hone pe dikhao
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Electron] Window ready!');
  });

  tryLoadURL(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('[Electron] App ready — starting backend...');
  startBackend();
  setTimeout(createWindow, 3000); // 3 sec backend ko start hone do
});

app.on('window-all-closed', () => {
  console.log('[Electron] Closing — killing C++ processes');
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  if (bridgeProcess) { bridgeProcess.kill(); bridgeProcess = null; }
  app.quit();
});