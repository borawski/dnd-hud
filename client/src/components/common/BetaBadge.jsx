import React, { useState } from 'react';

const BetaBadge = ({
    className = "absolute -top-3 -right-3",
    popoverClassName = "bottom-full right-0 mb-3",
    arrowClassName = "absolute -bottom-1.5 right-4 w-3 h-3 bg-dnd-card border-b border-r border-dnd-border transform rotate-45",
    alignmentClassName = "right-0"
}) => {
    const [showBetaMessage, setShowBetaMessage] = useState(false);

    return (
        <div
            className={`${className} z-50 flex flex-col items-end`}
        >
            <button
                className="bg-yellow-400 text-black font-sans font-black text-[10px] px-2 py-0.5 rounded-sm tracking-widest hover:scale-105 transition-transform cursor-help -rotate-2 border-2 border-black outline-none focus:outline-none focus:ring-0"
                onClick={() => setShowBetaMessage(!showBetaMessage)}
            >
                BETA
            </button>

            {showBetaMessage && (
                <div
                    className={`absolute top-full ${alignmentClassName} pt-3 z-50 w-64 sm:w-72 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-2`}
                >
                    <div className={`relative bg-[#09090b]/60 backdrop-blur-sm border border-zinc-800 p-3 rounded-lg shadow-xl text-xs ${popoverClassName}`}>
                        {/* Arrow */}
                        <div className={arrowClassName}></div>

                        {/* Logo Watermark */}
                        <img
                            src="/rollbound-logo.png"
                            alt="Rollbound"
                            className="absolute top-2 right-2 w-8 h-8 opacity-20 object-contain"
                        />

                        <div className="space-y-4 text-dnd-text text-left">
                            <p>
                                Thank you for trying Rollbound!
                            </p>

                            <p className="leading-relaxed text-dnd-muted">
                                Rollbound is a passion project I created to make encounter management smoother and more intuitive for new and experienced DMs.
                            </p>

                            <hr className="my-4 border-dnd-border/30" />

                            <p className="leading-relaxed text-dnd-muted mb-4">
                                I hope it helps others run their games with the same confidence and ease.
                            </p>

                            <a
                                href="mailto:support@rollbound.com?subject=Bug Report: Rollbound Beta"
                                className="block w-full text-center bg-dnd-dark hover:bg-dnd-dark/70 text-dnd-muted hover:text-dnd-text text-xs py-2 rounded transition-colors border border-dnd-border/50"
                            >
                                Found a bug? Let me know!
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BetaBadge;
