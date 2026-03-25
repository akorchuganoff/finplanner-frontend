import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Проверяем, есть ли уже активная сессия
        const checkAuth = async () => {
            try {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        await authService.login(email, password);
        const userData = await authService.getCurrentUser();
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const register = async (email, password) => {
        await authService.register(email, password);
        // После регистрации автоматически логинимся
        await login(email, password);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);