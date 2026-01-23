import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function DMSignup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await signup(email, password, displayName || email);
            navigate('/dm/dashboard');
        } catch (err) {
            setError(err.message || 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dnd-dark via-dnd-card to-dnd-dark px-4 py-12">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-dnd-muted hover:text-dnd-accent transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </Link>

                {/* Card */}
                <div className="bg-dnd-card border-2 border-dnd-border rounded-2xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src="/rollbound-logo.png"
                            alt="Rollbound"
                            className="w-20 h-20"
                        />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-serif font-bold text-center text-dnd-text mb-2">
                        Create Account
                    </h1>
                    <p className="text-center text-dnd-muted mb-8">
                        Start managing your encounters professionally
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-dnd-text mb-2">
                                Display Name (optional)
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-dnd-dark border border-dnd-border rounded-lg px-4 py-3 text-dnd-text placeholder-dnd-muted/50 focus:outline-none focus:border-dnd-accent transition-colors"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dnd-text mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-dnd-dark border border-dnd-border rounded-lg px-4 py-3 text-dnd-text placeholder-dnd-muted/50 focus:outline-none focus:border-dnd-accent transition-colors"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dnd-text mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-dnd-dark border border-dnd-border rounded-lg px-4 py-3 text-dnd-text placeholder-dnd-muted/50 focus:outline-none focus:border-dnd-accent transition-colors"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-dnd-muted mt-2">
                                Must be at least 8 characters
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-dnd-accent hover:bg-dnd-accent-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserPlus size={20} />
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center mt-6 text-sm text-dnd-muted">
                        Already have an account?{' '}
                        <Link
                            to="/dm/login"
                            className="text-dnd-accent hover:text-dnd-accent-hover font-medium transition-colors"
                        >
                            Log In
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center mt-8 text-sm text-dnd-muted">
                    Rollbound - Professional Encounter Management
                </p>
            </div>
        </div>
    );
}
