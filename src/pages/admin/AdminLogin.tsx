import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';
import './Admin.css';

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const { mode, toggleMode } = useThemeStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Check admin credentials
            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('username', formData.username)
                .eq('is_active', true)
                .single();

            if (adminError || !admin) {
                throw new Error('Invalid credentials');
            }

            // Simple password check (in production, use proper hashing)
            if (admin.password_hash !== formData.password) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            await supabase
                .from('admins')
                .update({ last_login: new Date().toISOString() })
                .eq('id', admin.id);

            // Store admin session
            sessionStorage.setItem('adminSession', JSON.stringify({
                id: admin.id,
                username: admin.username,
                role: admin.role,
            }));

            navigate('/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-logo">
                        <Shield size={40} />
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost btn-icon admin-login-theme-toggle"
                        onClick={toggleMode}
                        title="Toggle Theme"
                    >
                        {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <h1>Admin Panel</h1>
                    <p>NXS Chat Administration</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {error && <div className="auth-error">{error}</div>}

                    <Input
                        type="text"
                        name="username"
                        label="Username"
                        placeholder="Enter admin username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <div className="password-field">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            label="Password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
};
