import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'; // добавили Link
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';

// Компонент навигации (будет отображаться только для авторизованных пользователей)
function Navbar() {
  const { user, logout } = useAuth(); // получаем logout
  if (!user) return null;
  return (
    <nav style={{ display: 'flex', gap: '15px', padding: '10px', background: '#f0f0f0', marginBottom: '20px' }}>
      <Link to="/dashboard">Дашборд</Link>
      <Link to="/transactions">Транзакции</Link>
      <Link to="/categories">Категории</Link>
      <Link to="/cash-flow">Отчёт ДДС</Link>
      <button onClick={logout}>Выйти</button>
    </nav>
  );
}

// Компонент для защищённых маршрутов
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Загрузка...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/cash-flow"
            element={
              <PrivateRoute>
                <CashFlow />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;