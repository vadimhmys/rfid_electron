const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { SerialPort } = require('serialport');
const path = require('path');

let mainWindow;
let port;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    //mainWindow.loadFile('frontend/build/index.html');
    mainWindow.loadURL('http://localhost:3000');
  }
}

async function findArduinoPort() {
  try {
    const ports = await SerialPort.list();
    const arduinoPortInfo = ports.find((p) => p.manufacturer && p.manufacturer.includes('Arduino'));
    if (arduinoPortInfo) {
      let bufferData = '';
      port = new SerialPort({ path: arduinoPortInfo.path, baudRate: 9600 });
      port.on('data', (data) => {
        bufferData += data.toString();
        if (bufferData.includes('\r') || bufferData.includes('\n')) {
          const code = bufferData.replace(/[\r\n]+/g, '').trim();
          mainWindow.webContents.send('rfid-code', code);
          bufferData = '';
        }
      });
    } else {
      console.log('Arduino port not found');
    }
  } catch (err) {
    console.error('Error listing serial ports:', err);
  }
}

app.whenReady().then(() => {
  createWindow();
  findArduinoPort();

  if (process.env.NODE_ENV === 'development') {
  }
});

app.on('window-all-closed', () => {
  if (port && port.isOpen) port.close();
  if (process.platform !== 'darwin') app.quit();
});
