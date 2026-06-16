import { app, BrowserWindow, dialog } from 'electron';
import pkgUpdater from 'electron-updater';
const { autoUpdater } = pkgUpdater;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const PORT = process.env.PORT || 5011;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Trickwrick CRM",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'public/favicon.svg')
  });

  mainWindow.setMenuBarVisibility(false);

  // Wait for the server to be ready before loading the window
  const checkServer = () => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        fetch(`http://127.0.0.1:${PORT}/api/health`)
          .then(res => {
            if (res.ok) {
              clearInterval(interval);
              resolve();
            }
          })
          .catch(() => {}); // ignore errors while waiting
      }, 500);
    });
  };

  // Give the server a few seconds to start
  await checkServer();
  
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    try {
      fs.appendFileSync(path.join(os.homedir(), 'Desktop', 'crm_console.log'), `[${level}] ${message} at ${sourceId}:${line}\n`);
    } catch(e) {}
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

import fs from 'fs';
import os from 'os';

app.whenReady().then(async () => {
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    console.log('Update available.');
  });
  
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart the application to apply the updates.',
      buttons: ['Restart', 'Later']
    }).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });

  // Start the Express server directly in the main process to avoid asar path issues
  try {
    process.env.PORT = PORT.toString();
    await import('./server/server.js');
  } catch (err) {
    fs.writeFileSync(path.join(os.homedir(), 'Desktop', 'crm_error.log'), String(err.stack || err));
    console.error('Failed to start server:', err);
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  // Server runs in the same process, it will exit automatically
});
