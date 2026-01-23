import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn } from 'lucide-react';
import BetaBadge from '../common/BetaBadge';
import { useGoogleLogin } from '@react-oauth/google';

export default function DMLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsLoading(true);
                await loginWithGoogle(tokenResponse);
                navigate('/dm/dashboard');
            } catch (err) {
                setError('Google Login Failed: ' + (err.message || 'Unknown error'));
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setError('Google Login Failed'),
    });

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
                {/* Card */}
                <div className="bg-dnd-card rounded-2xl p-8 shadow-2xl relative">
                    {/* Beta Badge - Hanging off the corner */}
                    <BetaBadge
                        className="absolute -top-3 -right-3"
                        popoverClassName=""
                        arrowClassName="absolute -top-1.5 right-4 w-3 h-3 bg-[#09090b] border-t border-l border-zinc-800 transform rotate-45"
                    />

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src="/rollbound-logo.png"
                            alt="Rollbound"
                            className="w-32 h-32 object-contain"
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

                        <div className="w-full mb-4">
                            <button
                                type="button"
                                onClick={() => googleLogin()}
                                className="w-full flex items-center justify-center gap-3 bg-[#131415] hover:bg-[#1f2022] text-white border border-dnd-border py-2.5 rounded-lg transition-all group relative overflow-hidden"
                            >
                                {/* Google G Logo */}
                                <div className="bg-white p-1.5 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                </div>
                                <span className="font-medium text-[15px]">Sign in with Google</span>
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-dnd-border"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-dnd-card px-2 text-dnd-muted">Or continue with email</span>
                            </div>
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

                {/* Beta Badge removed */}
            </div>
        </div>
    );
}
