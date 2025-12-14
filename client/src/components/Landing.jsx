import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Tv } from 'lucide-react';

const Landing = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-8">
            <h1 className="text-6xl font-serif text-dnd-accent">D&D HUD</h1>
            <div className="flex space-x-8">
                <Link to="/admin" className="group flex flex-col items-center p-8 bg-dnd-card rounded-xl border border-dnd-muted/20 hover:border-dnd-accent transition-all hover:scale-105">
                    <Shield size={64} className="text-dnd-muted group-hover:text-dnd-accent mb-4" />
                    <span className="text-2xl font-bold">Dungeon Master</span>
                    <span className="text-dnd-muted">Control the game</span>
                </Link>
                <Link to="/player" className="group flex flex-col items-center p-8 bg-dnd-card rounded-xl border border-dnd-muted/20 hover:border-dnd-accent transition-all hover:scale-105">
                    <Tv size={64} className="text-dnd-muted group-hover:text-dnd-accent mb-4" />
                    <span className="text-2xl font-bold">Player View</span>
                    <span className="text-dnd-muted">Display on TV</span>
                </Link>
            </div>
        </div>
    );
};

export default Landing;
