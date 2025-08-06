import { useState, useEffect } from 'react';
import '../styles/AddUserForm.css';

function AddUserForm({ onClose, onSave, isOpen }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [patronymic, setPatronymic] = useState('');
  const [position, setPosition] = useState('');
  const [cardKey, setCardKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Валидация ключа
  const validateKey = (value) => {
    const isValidLength = value.length === 8;
    const isValidChars = /^[A-Z0-9]*$/.test(value);
    if (!isValidLength) {
      setKeyError('Ключ должен содержать ровно 8 символов.');
      return false;
    }
    if (!isValidChars) {
      setKeyError('Ключ должен состоять только из цифр или заглавных букв латинского алфавита.');
      return false;
    }
    setKeyError('');
    return true;
  };

  const handleKeyChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCardKey(value);
  };

  const handleSave = () => {
    if (validateKey(cardKey)) {
      onSave({ name, surname, patronymic, position, cardKey });
      setName('');
      setSurname('');
      setPatronymic('');
      setPosition('');
      setCardKey('');
    }
  };

  // Обновляем валидацию ключа при изменении поля
  useEffect(() => {
    validateKey(cardKey);
  }, [cardKey]);

  // Обновляем состояние валидности формы при изменении всех полей
  useEffect(() => {
    const isValid = name.trim() !== '' && surname.trim() !== '' && validateKey(cardKey);
    setIsFormValid(isValid);
  }, [name, surname, patronymic, position, cardKey]);

  useEffect(() => {
    if (isOpen) {
      window.electron.ipcRenderer.on('rfid-code', (event, code) => {
        setCardKey(code);
        validateKey(code);
      });
    }
    return () => {
      window.electron.ipcRenderer.removeAllListeners('rfid-code');
    };
  }, [isOpen]);

  useEffect(() => {
    window.api.onSaveResponse((response) => {
      if (response.success) {
        alert('Данные успешно сохранены!');
      } else {
        alert('Ошибка: ' + response.message);
      }
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Добавить сотрудника</h2>
        <label>
          Имя:
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        </label>
        <label>
          Фамилия:
          <input value={surname} onChange={(e) => setSurname(e.target.value)} maxLength={30} />
        </label>
        <label>
          Отчество:
          <input
            value={patronymic}
            onChange={(e) => setPatronymic(e.target.value)}
            maxLength={30}
          />
        </label>
        <label>
          Должность:
          <input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={50} />
        </label>
        <label>
          Ключ:
          <input
            value={cardKey}
            onChange={handleKeyChange}
            maxLength={8}
            style={{ borderColor: keyError ? 'red' : undefined }}
          />
        </label>
        {keyError && <p className="error-message">{keyError}</p>}
        <button onClick={handleSave} disabled={!isFormValid} className="save-button">
          Сохранить
        </button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
}

export default AddUserForm;
