const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const net = require('net');

let mainWindow;
let serverProcess;
let bridgeProcess;

const isDev = process.env.NODE_ENV === 'development';

const binPath = isDev
  ? path.join(__dirname, '..', 'backend', 'build')
  : path.join(process.resourcesPath, 'bin');

// Check karo port free hai kya
function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))  // port busy — server already running
      .once('listening', () => {
        tester.close(() => resolve(true));   // port free — start server
      })
      .listen(port, '0.0.0.0');
  });
}

function startServer() {
  console.log('[Electron] Starting C++ server...');
  serverProcess = spawn(
    path.join(binPath, 'lanshare_server.exe'), [], {
    cwd: binPath, stdio: 'pipe'
  });
  serverProcess.stdout.on('data', (d) => process.stdout.write('[Server] ' + d));
  serverProcess.stderr.on('data', (d) => process.stderr.write('[Server ERR] ' + d));
  serverProcess.on('error', (e) => console.error('[Server spawn error]', e));
}

function startBridge() {
  console.log('[Electron] Starting C++ bridge...');
  bridgeProcess = spawn(
    path.join(binPath, 'lanshare_app.exe'), [], {
    cwd: binPath, stdio: 'pipe'
  });
  bridgeProcess.stdout.on('data', (d) => process.stdout.write('[Bridge] ' + d));
  bridgeProcess.stderr.on('data', (d) => process.stderr.write('[Bridge ERR] ' + d));
  bridgeProcess.on('error', (e) => console.error('[Bridge spawn error]', e));
}

function tryLoadURL(win, attempts = 0) {
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
        tryPort(portIndex + 1);
      }
    });
  };
  
  tryPort(0);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 900, minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: '⚡ LanShare v2',
    backgroundColor: '#050810',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Electron] Window ready!');
  });

  tryLoadURL(mainWindow);
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  console.log('[Electron] App ready...');

  // Auto detect — server start karna hai kya?
  const serverFree = await checkPort(5555);
  
  if (serverFree) {
    console.log('[Electron] Port 5555 free — I am the SERVER');
    startServer();
    setTimeout(startBridge, 2000); // server start hone do
  } else {
    console.log('[Electron] Port 5555 busy — joining existing server');
    startBridge(); // sirf bridge
  }

  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  console.log('[Electron] Closing...');
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  if (bridgeProcess) { bridgeProcess.kill(); bridgeProcess = null; }
  app.quit();
});
```

---

## Kaise Kaam Karega
```
Laptop 1 — pehle kholo:
Port 5555 free hai → SERVER + BRIDGE start

Laptop 2 — baad mein kholo:
Port 5555 busy hai → sirf BRIDGE start
IP field mein Laptop 1 ka IP daalo → CONNECT