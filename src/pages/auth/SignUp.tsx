import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../../components/common';
import './Auth.css';

interface SignUpData {
    fullName: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    password: string;
    confirmPassword: string;
}

export const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<SignUpData>({
        fullName: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleGenderSelect = (gender: string) => {
        setFormData({ ...formData, gender });
        setError('');
    };

    const validateForm = (): string | null => {
        if (!formData.fullName.trim()) return 'Full name is required';
        if (!formData.email.trim()) return 'Email is required';
        if (!formData.dateOfBirth) return 'Date of birth is required';
        if (!formData.gender) return 'Gender is required';
        if (formData.password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(formData.password)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(formData.password)) return 'Password must contain at least one number';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        sessionStorage.setItem('signupData', JSON.stringify(formData));
        navigate('/signup/username');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <MessageSquare size={32} />
                    </div>
                    <h1>Create your account</h1>
                    <p>Step 1: Basic Information</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="input-with-icon">
                        <Input
                            type="text"
                            name="fullName"
                            label="Full Name"
                            placeholder="e.g. Alex Smith"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Input
                        type="email"
                        name="email"
                        label="Email Address"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <div className="grid-2">
                        <Input
                            type="date"
                            name="dateOfBirth"
                            label="Date of Birth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            required
                        />

                        <div className="input-group">
                            <label className="input-label">Gender</label>
                            <div className="gender-toggle-group">
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        className={`gender-btn ${formData.gender === g.toLowerCase() ? 'active' : ''}`}
                                        onClick={() => handleGenderSelect(g.toLowerCase())}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="password-field">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            label="Password"
                            placeholder="At least 8 characters"
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

                    <Input
                        type="password"
                        name="confirmPassword"
                        label="Confirm Password"
                        placeholder="Repeat your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <Button type="submit" className="w-full" size="lg">
                        Next Step →
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/">LOGIN</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

