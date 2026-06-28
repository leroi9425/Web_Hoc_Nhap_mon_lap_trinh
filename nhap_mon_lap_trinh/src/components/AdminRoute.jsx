import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user } = useAuth(); // AuthContext uses loading state internally, but doesn't expose it. Wait, let's check if it exposes loading.

    // AuthContext doesn't expose loading in the context value. It just returns "Loading..." if loading is true.
    // So by the time we reach here, user is loaded.

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'STUDENT') {
        return <Navigate to="/learn" replace />;
    }

    return children;
};

export default AdminRoute;
