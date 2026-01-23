import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen bg-dnd-dark flex items-center justify-center text-dnd-text">Loading...</div>;
    }

    if (user) {
        return <Navigate to="/dm/dashboard" replace />;
    }

    return <Navigate to="/dm/login" replace />;
};

export default Landing;
