import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authAPI.login({ username, password });
            if (data?.token) {
                localStorage.setItem('token', data.token);
                navigate('/admin/dashboard');
            } else {
                setError('Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white tracking-tight">INVENZA</h1>
                        <p className="text-xs text-zinc-600 mt-1">Vinayak Lakshmi Gas Stoves</p>
                    </div>

                    <div className="border-t border-[#2A2A2A] pt-6 mb-6">
                        <h2 className="text-lg font-semibold text-white text-center">Welcome back</h2>
                        <p className="text-xs text-zinc-500 text-center mt-1">Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1.5 text-xs font-medium text-zinc-500">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full px-3 py-2.5 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1.5 text-xs font-medium text-zinc-500">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-3 py-2.5 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                <p className="text-red-400 text-xs">{error}</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-zinc-700 mt-4">© 2026 INVENZA — Vinayak Lakshmi Gas Stoves</p>
            </div>
        </div>
    );
};

export default Login;
