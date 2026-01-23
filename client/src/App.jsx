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
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-dnd-dark text-dnd-text">
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
  );
}

export default App;
