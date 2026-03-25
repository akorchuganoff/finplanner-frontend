import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div>
            <h1>Дашборд</h1>
            <p>Добро пожаловать, {user?.email}!</p>
            <button onClick={handleLogout}>Выйти</button>
        </div>
    );
};

export default Dashboard;