import { useState, useEffect } from 'react';

function AddUserForm({ onClose, onSave, isOpen }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [position, setPosition] = useState('');
  const [cardKey, setCardKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      window.electron.ipcRenderer.on('rfid-code', (event, code) => {
        setCardKey(code);
      });
    }
    return () => {
      window.electron.ipcRenderer.removeAllListeners('rfid-code');
    };
  }, [isOpen]);

  const handleSave = () => {
    onSave({ name, surname, patronymic, position, cardKey });
    setName('');
    setSurname('');
    setPatronymic('');
    setPosition('');
    setCardKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Добавить пользователя</h2>
        <label>
          Имя:
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Фамилия:
          <input value={surname} onChange={(e) => setSurname(e.target.value)} />
        </label>
        <label>
          Отчество:
          <input value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
        </label>
        <label>
          Должность:
          <input value={position} onChange={(e) => setPosition(e.target.value)} />
        </label>
        <label>
          Ключ:
          <input value={cardKey} readOnly />
        </label>
        <button onClick={handleSave}>Сохранить</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
}

export default AddUserForm;
