const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');

let mainWindow;
let port;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('index.html');
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
});

app.on('window-all-closed', () => {
  if (port && port.isOpen) port.close();
  if (process.platform !== 'darwin') app.quit();
});
