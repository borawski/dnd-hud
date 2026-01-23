import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Tv, Sparkles } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-dnd-dark to-dnd-card px-4">
            <div className="max-w-6xl mx-auto text-center">
                {/* Logo and Title */}
                <div className="flex flex-col items-center mb-8">
                    <img
                        src="/rollbound-logo.png"
                        alt="Rollbound Logo"
                        className="w-24 h-24 md:w-32 md:h-32 mb-6 drop-shadow-2xl"
                    />
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-dnd-text mb-4 tracking-tight">
                        Rollbound
                    </h1>
                    <p className="text-xl md:text-2xl text-dnd-muted max-w-2xl">
                        Professional encounter management for tabletop RPGs
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <Link
                        to="/admin"
                        className="group relative overflow-hidden bg-dnd-card rounded-2xl border-2 border-dnd-border hover:border-dnd-accent transition-all duration-300 p-8 hover:scale-105 hover:shadow-2xl"
                    >
                        <div className="relative z-10">
                            <Shield size={48} className="text-dnd-accent mb-4 mx-auto group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-bold text-dnd-text mb-2">Dungeon Master</h3>
                            <p className="text-dnd-muted">Manage encounters, track initiative, and control the game</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-dnd-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <Link
                        to="/player"
                        className="group relative overflow-hidden bg-dnd-card rounded-2xl border-2 border-dnd-border hover:border-dnd-accent transition-all duration-300 p-8 hover:scale-105 hover:shadow-2xl"
                    >
                        <div className="relative z-10">
                            <Tv size={48} className="text-dnd-accent mb-4 mx-auto group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-bold text-dnd-text mb-2">Player View</h3>
                            <p className="text-dnd-muted">Display initiative, stats, and combat on your TV or screen</p>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-dnd-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </div>

                {/* Features */}
                <div className="mt-16 flex items-center justify-center gap-3 text-dnd-muted">
                    <Sparkles size={20} className="text-dnd-accent" />
                    <span className="text-sm">D&D Beyond Integration • Initiative Tracking • Combat Management</span>
                </div>
            </div>
        </div>
    );
};

export default Landing;
