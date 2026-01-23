import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function DMLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/dm/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const useDemoCredentials = () => {
        setEmail('demo@dnd-hud.com');
        setPassword('changeme123');
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
                        Welcome Back
                    </h1>
                    <p className="text-center text-dnd-muted mb-8">
                        Sign in to manage your encounters
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
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-dnd-accent hover:bg-dnd-accent-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <LogIn size={20} />
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-6 border-t border-dnd-border text-center">
                        <button
                            onClick={useDemoCredentials}
                            className="text-dnd-accent hover:text-dnd-accent-hover text-sm font-medium transition-colors"
                        >
                            Use Demo Credentials
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center mt-6 text-sm text-dnd-muted">
                        Don't have an account?{' '}
                        <Link
                            to="/dm/signup"
                            className="text-dnd-accent hover:text-dnd-accent-hover font-medium transition-colors"
                        >
                            Sign Up
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
