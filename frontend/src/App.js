import { useState, useEffect } from 'react';

function App() {
  const [code, setCode] = useState('Поднесите карточку');

  useEffect(() => {
    window.electron.ipcRenderer.on('rfid-code', (event, code) => {
      setCode(code);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('rfid-code');
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>RFID Card Code:</h1>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{code}</div>
    </div>
  );
}

export default App;
