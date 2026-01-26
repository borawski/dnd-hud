import React from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import BetaBadge from './common/BetaBadge';

/**
 * Reusable Navbar component for Rollbound
 * @param {Object} props
 * @param {string} props.userName - Optional user display name
 * @param {Function} props.onLogout - Optional logout handler
 * @param {string} props.backLink - Optional back link URL
 * @param {string} props.backText - Optional back link text
 */
export default function Navbar({ userName, onLogout, backLink, backText }) {
    return (
        <nav className="bg-dnd-card border-b border-dnd-border">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex items-center justify-between">
                    {/* Left: Logo and Title */}
                    <div className="flex items-center gap-0">
                        <img
                            src="/rollbound-logo.png"
                            alt="Rollbound"
                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain flex-shrink-0 -my-4 sm:-my-6 -mr-2"
                        />
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-dnd-text leading-tight flex items-center gap-3">
                                Rollbound
                                <div className="relative">
                                    <BetaBadge
                                        className="relative block transform-none"
                                        alignmentClassName="right-0 sm:left-0"
                                        popoverClassName="top-full mt-3"
                                        arrowClassName="absolute -top-1.5 right-4 sm:left-4 w-3 h-3 bg-[#09090b]/60 border-t border-l border-zinc-800 transform rotate-45"
                                    />
                                </div>
                            </h1>
                            {userName && (
                                <p className="text-sm text-dnd-muted hidden sm:block">
                                    Welcome back, <span className="text-dnd-accent font-medium">{userName}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 relative">

                        {backLink && (
                            <Link
                                to={backLink}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-dnd-muted hover:text-dnd-accent transition-colors"
                            >
                                <ArrowLeft size={18} />
                                <span className="hidden sm:inline">{backText || 'Back'}</span>
                            </Link>
                        )}

                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-dnd-dark hover:bg-dnd-dark/70 border border-dnd-border rounded-sm transition-colors text-dnd-muted hover:text-red-400 text-sm"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline font-medium">Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
