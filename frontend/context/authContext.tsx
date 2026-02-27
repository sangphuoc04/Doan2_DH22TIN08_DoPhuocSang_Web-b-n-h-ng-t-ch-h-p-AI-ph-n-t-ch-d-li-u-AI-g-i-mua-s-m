// frontend/context/authContext.tsx
// Context toàn cục quản lý trạng thái đăng nhập - đặt file này vào frontend/context/
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
    id: number;
    email: string;
    fullName: string | null;
    role: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null, token: null,
    login: () => { }, logout: () => { },
    isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Khi app load, khôi phục session từ localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (user: User, token: string) => {
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);