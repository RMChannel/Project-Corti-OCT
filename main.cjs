const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

let controllerWindow;
let presenterWindow;

const SUPPORTED_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);
const CORTI_FOLDER = path.join(__dirname, 'Corti');
const EXCLUDED_STATE_FILE = path.join(app.getPath('userData'), 'excluded-items.json');

function getAllVideoFiles(folderPath) {
  const results = [];

  function walk(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!item.isFile()) {
        continue;
      }

      const extension = path.extname(item.name).toLowerCase();
      if (!SUPPORTED_VIDEO_EXTENSIONS.has(extension)) {
        continue;
      }

      results.push({
        name: item.name,
        absolutePath: fullPath,
        relativePath: path.relative(folderPath, fullPath)
      });
    }
  }

  walk(folderPath);

  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function createWindows() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.length > 1 ? displays[1] : displays[0];

  presenterWindow = new BrowserWindow({
    title: 'Presenter',
    x: externalDisplay.bounds.x,
    y: externalDisplay.bounds.y,
    width: externalDisplay.workAreaSize.width,
    height: externalDisplay.workAreaSize.height,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload-presenter.cjs'),
      webSecurity: false
    }
  });

  controllerWindow = new BrowserWindow({
    title: 'Controller',
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 650,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload-controller.cjs')
    }
  });

  presenterWindow.loadFile(path.join(__dirname, 'presenter.html'));
  controllerWindow.loadFile(path.join(__dirname, 'controller.html'));

  presenterWindow.on('closed', () => {
    presenterWindow = null;
  });

  controllerWindow.on('closed', () => {
    controllerWindow = null;
  });
}

function sendToPresenter(channel, payload) {
  if (!presenterWindow || presenterWindow.isDestroyed()) {
    return;
  }

  presenterWindow.webContents.send(channel, payload);
}

function sendToController(channel, payload) {
  if (!controllerWindow || controllerWindow.isDestroyed()) {
    return;
  }

  controllerWindow.webContents.send(channel, payload);
}

app.whenReady().then(() => {
  createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('videos:get-from-corti', async () => {
  if (!fs.existsSync(CORTI_FOLDER)) {
    return {
      ok: false,
      folderPath: CORTI_FOLDER,
      videos: [],
      message: 'Cartella Corti non trovata.'
    };
  }

  const videos = getAllVideoFiles(CORTI_FOLDER);
  return {
    ok: true,
    folderPath: CORTI_FOLDER,
    videos
  };
});

ipcMain.handle('excluded:load-state', async () => {
  try {
    if (!fs.existsSync(EXCLUDED_STATE_FILE)) {
      return { ok: true, excludedItems: [], filePath: EXCLUDED_STATE_FILE };
    }

    const raw = fs.readFileSync(EXCLUDED_STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const excludedItems = Array.isArray(parsed) ? parsed : [];

    return { ok: true, excludedItems, filePath: EXCLUDED_STATE_FILE };
  } catch (error) {
    return { ok: false, excludedItems: [], filePath: EXCLUDED_STATE_FILE, message: String(error) };
  }
});

ipcMain.handle('excluded:save-state', async (_event, excludedItems) => {
  try {
    const safeItems = Array.isArray(excludedItems) ? excludedItems : [];
    const parentFolder = path.dirname(EXCLUDED_STATE_FILE);

    if (!fs.existsSync(parentFolder)) {
      fs.mkdirSync(parentFolder, { recursive: true });
    }

    fs.writeFileSync(EXCLUDED_STATE_FILE, JSON.stringify(safeItems, null, 2), 'utf8');

    return { ok: true, filePath: EXCLUDED_STATE_FILE };
  } catch (error) {
    return { ok: false, filePath: EXCLUDED_STATE_FILE, message: String(error) };
  }
});

ipcMain.on('controller:show-text', (_event, payload) => {
  sendToPresenter('presenter:show-text', payload);
});

ipcMain.on('controller:blackout', () => {
  sendToPresenter('presenter:blackout');
});

ipcMain.on('controller:load-video', (_event, payload) => {
  if (!payload || !payload.absolutePath) {
    return;
  }

  const videoUrl = pathToFileURL(payload.absolutePath).href;
  sendToPresenter('presenter:load-video', { ...payload, videoUrl });
});

ipcMain.on('controller:play-video', () => {
  sendToPresenter('presenter:play-video');
});

ipcMain.on('controller:pause-video', () => {
  sendToPresenter('presenter:pause-video');
});

ipcMain.on('presenter:state', (_event, payload) => {
  sendToController('controller:presenter-state', payload);
});

ipcMain.on('presenter:timeupdate', (_event, payload) => {
  sendToController('controller:timeupdate', payload);
});

ipcMain.on('controller:seek-video', (_event, time) => {
  sendToPresenter('presenter:seek-video', time);
});
