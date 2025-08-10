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

          // Проверка в базе
          db.get(`SELECT * FROM users WHERE cardKey = ?`, [code], (err, row) => {
            if (err) {
              console.error('DB error:', err);
              return;
            }
            if (row) {
              // Карточка есть — отправляем команду "AUTHORIZED"
              port.write('AUTHORIZED\n', (err) => {
                if (err) {
                  console.error('Error sending AUTHORIZED:', err.message);
                } else {
                  console.log('Sent AUTHORIZED');
                }
              });
            } else {
              // Карточка НЕ найдена — отправляем "UNAUTHORIZED"
              port.write('UNAUTHORIZED\n', (err) => {
                if (err) {
                  console.error('Error sending UNAUTHORIZED:', err.message);
                } else {
                  console.log('Sent UNAUTHORIZED');
                }
              });
            }
            if (row) {
              // Карточка есть в базе, посылаем команду на Arduino
              if (port && port.isOpen) {
                port.write('OPEN_RELAY\n', (err) => {
                  if (err) {
                    return console.error('Error sending message:', err.message);
                  }
                  console.log('Сommand to open relay sent');
                });
              }
            } else {
              console.log('The card was not found in the database');
            }
          });
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
      console.error('Database error:', err);
    } else {
      console.log('The database is open');
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
        console.error('Error while inserting:', err);
        event.reply('save-user-response', { success: false, message: err.message });
      } else {
        console.log('User added, ID:', this.lastID);
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
