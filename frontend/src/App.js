import { useState } from 'react';
import AddUserForm from './components/AddUserForm';

function App() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const handleAddUserClick = () => {
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
  };

  const handleSaveUser = (userData) => {
    setUsers([...users, userData]);
    setFormOpen(false);
    // Тут можно сохранить пользователя в базу или отправить на сервер
     window.api.saveUser(userData); // вызов метода из preload.js
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleAddUserClick}>Добавить пользователя</button>
      <AddUserForm isOpen={isFormOpen} onClose={handleCloseForm} onSave={handleSaveUser} />
    </div>
  );
}

export default App;
