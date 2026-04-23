import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import Import from './pages/Import';
import { Button, Flex, Box, Container, Heading, Spacer } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';

// Компонент навигации (только для авторизованных пользователей)
function Navbar() {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  if (!user) return null;

  return (
    <Box bg="gray.100" _dark={{ bg: 'gray.800' }} px={4} py={2} mb={6}>
      <Container maxW="container.xl">
        <Flex align="center" gap={6} wrap="wrap">
          {/* Логотип или название */}
          <Heading size="md" color="blue.600" _dark={{ color: 'blue.300' }}>
            FinPlanner
          </Heading>

          {/* Ссылки навигации */}
          <Flex gap={4} align="center">
            <Button as={Link} to="/dashboard" variant="ghost" size="sm">
              Дашборд
            </Button>
            <Button as={Link} to="/transactions" variant="ghost" size="sm">
              Транзакции
            </Button>
            <Button as={Link} to="/categories" variant="ghost" size="sm">
              Категории
            </Button>
            <Button as={Link} to="/cash-flow" variant="ghost" size="sm">
              Отчёт ДДС
            </Button>
            <Button as={Link} to="/import" variant="ghost" size="sm">
              Внести данные из выписки
            </Button>
          </Flex>

          <Spacer />

          {/* Кнопка переключения темы и выход */}
          <Flex gap={2} align="center">
            <Button
              onClick={toggleColorMode}
              variant="outline"
              size="sm"
            >
              {colorMode === 'light' ? '🌙 Тёмная' : '☀️ Светлая'}
            </Button>
            <Button onClick={logout} colorScheme="red" variant="solid" size="sm">
              Выйти
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

// Компонент для защищённых маршрутов
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Box textAlign="center" mt={10}>Загрузка...</Box>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Container maxW="container.xl" py={4}>
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
            <Route
              path="/import"
              element={
                <PrivateRoute>
                  <Import />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;