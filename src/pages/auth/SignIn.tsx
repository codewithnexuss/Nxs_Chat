import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

export const SignIn: React.FC = () => {
    const { setSession } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (data.session) {
                setSession({
                    access_token: data.session.access_token,
                    user: { id: data.user.id, email: data.user.email! }
                });
                // No need to await fetchUser or navigate manually.
                // onAuthStateChange in App.tsx and PublicRoute handles this.
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <MessageCircle size={40} />
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to continue to NXS Chat</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <Input
                        type="email"
                        name="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <div className="password-field">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
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

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/signup">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
