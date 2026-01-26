import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import Landing from './components/Landing';
import DMLogin from './components/auth/DMLogin';
import DMSignup from './components/auth/DMSignup';
import DMDashboard from './components/campaigns/DMDashboard';
import AdminView from './components/AdminView';

import PlayerView from './components/PlayerView';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "220866471456-t2odbshu8c63pb767dtn8armo9dsesnu.apps.googleusercontent.com";

// Protected route wrapper for DM-only pages
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/dm/login" />;
  }

  return children;
}





function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-dnd-dark text-dnd-text">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a2e',
                  color: '#e0e0e0',
                  border: '1px solid #16213e',
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#1a1a2e',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#1a1a2e',
                  },
                },
              }}
            />
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<Landing />} />

              {/* DM Authentication */}
              <Route path="/dm/login" element={<DMLogin />} />
              <Route path="/dm/signup" element={<DMSignup />} />

              {/* DM Dashboard (protected, no GameProvider needed) */}
              <Route
                path="/dm/dashboard"
                element={
                  <ProtectedRoute>
                    <DMDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Routes with GameProvider wrapper (encounter-aware routes) */}
              {/* DM Admin View for specific encounter (protected) */}
              <Route
                path="/dm/:encounterId"
                element={
                  <ProtectedRoute>
                    <GameProvider>
                      <AdminView />
                    </GameProvider>
                  </ProtectedRoute>
                }
              />

              {/* Public Player View (no auth required) */}
              <Route
                path="/play/:encounterId"
                element={
                  <GameProvider>
                    <PlayerView />
                  </GameProvider>
                }
              />

              {/* Legacy routes - redirect to dashboard */}
              <Route path="/admin" element={<Navigate to="/dm/dashboard" replace />} />
              <Route path="/player" element={<Navigate to="/dm/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
