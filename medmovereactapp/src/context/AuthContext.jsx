import React, { createContext, useReducer, useEffect } from 'react';

const initialState = {
    isAuthenticated: false,
    user: null,
    provider: null,
    role: null, // 'user' or 'provider'
    loading: true
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user || null,
                provider: action.payload.provider || null,
                role: action.payload.role,
                loading: false
            };
        case 'LOGOUT':
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                provider: null,
                role: null,
                loading: false
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const storedUser = localStorage.getItem('user');

        if (token && role) {
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    role,
                    user: role === 'user' ? JSON.parse(storedUser) : null,
                    provider: role === 'provider' ? JSON.parse(storedUser) : null
                }
            });
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const login = (data) => {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('role', data.user ? 'user' : 'provider');
        localStorage.setItem('user', JSON.stringify(data.user || data.provider));
        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
                role: data.user ? 'user' : 'provider',
                user: data.user || null,
                provider: data.provider || null
            }
        });
    };

    const logout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
