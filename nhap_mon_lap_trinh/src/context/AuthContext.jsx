import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            if (window.location.pathname !== '/login') {
                navigate('/login');
            }
        }
        setLoading(false);
    }, [navigate]);

    const login = async (googleIdToken, isTestInstructor = false) => {
        try {
            const response = await axios.post('https://datn-java-backend.onrender.com/api/auth/google', {
                idToken: googleIdToken,
                isTestInstructor: isTestInstructor
            });
            const { token, user } = response.data;
            
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            navigate('/');
        } catch (error) {
            console.error("Login failed:", error);
            alert("Đăng nhập thất bại. Vui lòng thử lại.");
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
