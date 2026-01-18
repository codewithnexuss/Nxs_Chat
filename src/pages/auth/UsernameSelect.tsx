import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, AtSign, Check, X } from 'lucide-react';
import { Button } from '../../components/common';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

export const UsernameSelect: React.FC = () => {
    const navigate = useNavigate();
    const { fetchUser, setSession } = useAuthStore();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [error, setError] = useState('');

    const signupData = sessionStorage.getItem('signupData');

    useEffect(() => {
        if (!signupData) {
            navigate('/signup');
        }
    }, [signupData, navigate]);

    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 3) {
                setIsAvailable(null);
                return;
            }

            setIsChecking(true);
            try {
                const { data } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', username.toLowerCase())
                    .single();

                setIsAvailable(!data);
            } catch (err) {
                setIsAvailable(true); // No match found means available
            } finally {
                setIsChecking(false);
            }
        };

        const debounce = setTimeout(checkUsername, 500);
        return () => clearTimeout(debounce);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAvailable || !signupData) return;

        setIsLoading(true);
        setError('');

        try {
            const data = JSON.parse(signupData);

            // Create Supabase Auth account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create account');

            // Create user profile
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: data.email,
                    full_name: data.fullName,
                    username: username.toLowerCase(),
                    date_of_birth: data.dateOfBirth,
                    gender: data.gender,
                } as any);

            if (profileError) throw profileError;

            // Clear session storage
            sessionStorage.removeItem('signupData');

            // Auto-login
            if (authData.session) {
                setSession({
                    access_token: authData.session.access_token,
                    user: { id: authData.user.id, email: authData.user.email! }
                });
                await fetchUser(authData.user.id);
                navigate('/home');
            } else {
                // Email confirmation required
                navigate('/', { state: { message: 'Please check your email to confirm your account' } });
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
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
                    <h1>Choose Username</h1>
                    <p>Step 2 of 2: Pick a unique username</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="username-field">
                        <div className="username-input-wrapper">
                            <AtSign size={18} className="username-icon" />
                            <input
                                type="text"
                                className={`input username-input ${isAvailable === true ? 'input-success' :
                                    isAvailable === false ? 'input-error' : ''
                                    }`}
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                minLength={3}
                                maxLength={20}
                                required
                            />
                            <div className="username-status">
                                {isChecking && <div className="loader loader-sm" />}
                                {!isChecking && isAvailable === true && (
                                    <Check size={18} className="status-available" />
                                )}
                                {!isChecking && isAvailable === false && (
                                    <X size={18} className="status-taken" />
                                )}
                            </div>
                        </div>
                        <p className="username-hint">
                            {username.length < 3 && 'Username must be at least 3 characters'}
                            {username.length >= 3 && isAvailable === true && 'Username is available!'}
                            {username.length >= 3 && isAvailable === false && 'Username is already taken'}
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                        disabled={!isAvailable || username.length < 3}
                    >
                        Create Account
                    </Button>
                </form>
            </div>
        </div>
    );
};
