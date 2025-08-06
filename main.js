const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { SerialPort } = require('serialport');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;
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

  // Открываем или создаем базу
  db = new sqlite3.Database('mydatabase.db', (err) => {
    if (err) {
      console.error('Ошибка базы:', err);
    } else {
      console.log('База данных открыта');
      // Создаем таблицу, если нет
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,
        patronymic TEXT,
        position TEXT,
        cardKey TEXT
      )`);
    }
  });

  if (process.env.NODE_ENV === 'development') {
  }
});

// Обработка данных из формы
ipcMain.on('save-user', (event, userData) => {
  const { name, surname, patronymic, position, cardKey } = userData;
  db.run(
    `INSERT INTO users (name, surname, patronymic, position, cardKey) VALUES (?, ?, ?, ?, ?)`,
    [name, surname, patronymic, position, cardKey],
    function (err) {
      if (err) {
        console.error('Ошибка при вставке:', err);
        event.reply('save-user-response', { success: false, message: err.message });
      } else {
        console.log('Пользователь добавлен, ID:', this.lastID);
        event.reply('save-user-response', { success: true });
      }
    },
  );
});

app.on('window-all-closed', () => {
  if (port && port.isOpen) port.close();
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});
