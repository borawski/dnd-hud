import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-dnd-card border border-dnd-border rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dnd-border/50">
                    <h3 className="text-lg font-serif font-bold text-dnd-text flex items-center gap-2">
                        {isDestructive && <AlertTriangle className="text-red-500" size={20} />}
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-dnd-muted hover:text-dnd-text transition-colors p-1 rounded hover:bg-dnd-dark/50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-dnd-muted/90 leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-dnd-dark/30 rounded-b-xl border-t border-dnd-border/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-dnd-muted hover:text-dnd-text hover:bg-dnd-dark rounded-lg transition-colors border border-transparent hover:border-dnd-border/50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-dnd-accent hover:bg-dnd-accent/80 shadow-dnd-accent/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
