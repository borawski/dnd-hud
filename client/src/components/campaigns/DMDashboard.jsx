import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sword, Copy, Trash2, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

export default function DMDashboard() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await fetch(`${API_URL}/api/dm/encounters`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch campaigns');

            const data = await response.json();
            setCampaigns(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        if (!newCampaignName.trim()) return;

        setIsCreating(true);
        try {
            const response = await fetch(`${API_URL}/api/dm/encounters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newCampaignName })
            });

            if (!response.ok) throw new Error('Failed to create campaign');

            const newCampaign = await response.json();
            setCampaigns([newCampaign, ...campaigns]);
            setNewCampaignName('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;

        try {
            const response = await fetch(`${API_URL}/api/dm/encounters/${campaignId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete campaign');

            setCampaigns(campaigns.filter(c => c.id !== campaignId));
        } catch (err) {
            setError(err.message);
        }
    };

    const copyPlayerLink = (campaignId) => {
        const link = `${window.location.origin}/play/${campaignId}`;
        navigator.clipboard.writeText(link);
        // Use a better notification instead of alert
        const btn = event.target.closest('button');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dnd-dark flex items-center justify-center">
                <div className="text-dnd-text text-xl font-serif">Loading your campaigns...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dnd-dark">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 lg:py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <img
                                src="/rollbound-logo.png"
                                alt="Rollbound"
                                className="w-10 h-10"
                            />
                            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-dnd-text">Rollbound</h1>
                        </div>
                        <p className="text-dnd-muted text-base sm:text-lg ml-14">
                            Welcome back, <span className="text-dnd-accent font-medium">{user?.displayName}</span>
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-dnd-card hover:bg-dnd-dark border border-dnd-muted/20 rounded-lg transition-colors text-dnd-muted hover:text-red-400 whitespace-nowrap"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Create Campaign Card - CONSISTENT PADDING */}
                <div className="bg-dnd-card border border-dnd-muted/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Plus className="text-dnd-accent flex-shrink-0" size={24} />
                        <h2 className="text-lg sm:text-xl font-serif font-semibold text-dnd-text">Create New Encounter</h2>
                    </div>
                    <form onSubmit={handleCreateCampaign} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            placeholder="Enter encounter name..."
                            className="flex-1 bg-dnd-dark border border-dnd-muted/30 rounded-lg px-4 py-3 text-dnd-text placeholder-dnd-muted/50 focus:outline-none focus:border-dnd-accent transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isCreating || !newCampaignName.trim()}
                            className="px-6 py-3 bg-dnd-accent hover:bg-dnd-accent/80 text-dnd-dark font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isCreating ? 'Creating...' : 'Create'}
                        </button>
                    </form>
                </div>

                {/* Campaigns Grid */}
                {campaigns.length === 0 ? (
                    <div className="bg-dnd-card border border-dnd-muted/20 rounded-xl p-12 sm:p-16 text-center">
                        <Sword className="mx-auto mb-4 text-dnd-muted/30" size={64} />
                        <p className="text-xl font-serif text-dnd-text mb-2">No encounters yet</p>
                        <p className="text-dnd-muted">Create your first encounter to begin your adventure!</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <Sword className="text-dnd-accent" size={20} />
                            <h2 className="text-xl font-serif font-semibold text-dnd-text">Your Encounters</h2>
                            <span className="text-sm text-dnd-muted">({campaigns.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {campaigns.map(campaign => (
                                <div
                                    key={campaign.id}
                                    className="bg-dnd-card border border-dnd-muted/20 rounded-xl p-4 sm:p-6 hover:border-dnd-accent/50 transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between mb-4 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg sm:text-xl font-serif font-semibold text-dnd-text mb-1 group-hover:text-dnd-accent transition-colors truncate">
                                                {campaign.name}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-dnd-muted">
                                                Created {new Date(campaign.last_active_at || campaign.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-dnd-muted hover:text-red-400 flex-shrink-0"
                                            title="Delete encounter"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* BUTTON CONTAINER - PROPER SPACING */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => navigate(`/dm/${campaign.id}`)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dnd-accent hover:bg-dnd-accent/80 text-dnd-dark font-semibold rounded-lg transition-colors"
                                        >
                                            <Sword size={18} className="flex-shrink-0" />
                                            <span className="truncate">Open Admin View</span>
                                        </button>
                                        <button
                                            onClick={(e) => copyPlayerLink(campaign.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dnd-dark hover:bg-dnd-dark/70 border border-dnd-muted/30 text-dnd-accent font-medium rounded-lg transition-colors"
                                        >
                                            <Copy size={18} className="flex-shrink-0" />
                                            <span className="truncate">Copy Player Link</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
