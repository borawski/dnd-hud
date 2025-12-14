import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Landing from './components/Landing';
import AdminView from './components/AdminView';
import PlayerView from './components/PlayerView';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="min-h-screen bg-dnd-dark text-dnd-text">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="/player" element={<PlayerView />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
