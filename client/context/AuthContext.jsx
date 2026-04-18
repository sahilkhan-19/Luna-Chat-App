import { useEffect, useCallback, createContext, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {io} from 'socket.io-client';
import { axiosErrorToastMessage, isUnauthorizedAxiosError } from '../src/lib/utils.js';

export const AuthContext = createContext(null);

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
if (!backendUrl && import.meta.env.PROD) {
    console.error("VITE_BACKEND_URL is not set. Set it to your deployed API origin (e.g. https://api.example.com) before building.");
}
axios.defaults.baseURL = backendUrl || undefined;

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);


    //connect socket function to handel socket connection and online users updates
    const connectSocket = useCallback((userData) => {
        if (!userData || !backendUrl || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: String(userData._id),
            },
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on('getOnlineUsers', (userIds) => {
            setOnlineUsers(userIds);
        });
    }, [socket]);


    //Login function to handel user authentication and socket connection
    const applyAuthToken = (jwt) => {
        if (jwt) {
            axios.defaults.headers.common.token = jwt;
            localStorage.setItem('token', jwt);
        } else {
            delete axios.defaults.headers.common.token;
            localStorage.removeItem('token');
        }
    };

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success) {
                // Set header + storage before React state so no request runs with a stale/missing token
                applyAuthToken(data.token);
                setAuthUser(data.userData);
                connectSocket(data.userData);
                setToken(data.token);
                toast.success(data.message);
            }
            else {
                toast.error(data.message);
            }
        } catch (error) {
            const msg = axiosErrorToastMessage(error);
            toast.error(msg);
        }
    };

    //logout function to handel user logout and socket disconnection
    const logout = async () => {
        applyAuthToken(null);
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        toast.success('Logged out successfully');
        socket?.disconnect();
    };

    //update profile function to handel use profile updates

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body);
            if(data.success) {
                setAuthUser(data.userData);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            if (!isUnauthorizedAxiosError(error)) {
                toast.error(axiosErrorToastMessage(error));
            }
        }
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common.token = token;
        } else {
            delete axios.defaults.headers.common.token;
        }
    }, [token]);

    useEffect(() => {
        if (!token || authUser) return;

        const controller = new AbortController();

        (async () => {
            try {
                const { data } = await axios.get('/api/auth/check-auth', { signal: controller.signal });
                if (data.success) {
                    setAuthUser(data.user);
                    connectSocket(data.user);
                }
            } catch (error) {
                if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return;
                if (isUnauthorizedAxiosError(error)) {
                    applyAuthToken(null);
                    setToken(null);
                    setAuthUser(null);
                    return;
                }
                toast.error(axiosErrorToastMessage(error));
            }
        })();

        return () => controller.abort();
    }, [token, authUser, connectSocket]);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
