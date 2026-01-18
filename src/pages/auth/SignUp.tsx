import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff } from 'lucide-react';
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

        // Store data and navigate to username selection
        sessionStorage.setItem('signupData', JSON.stringify(formData));
        navigate('/signup/username');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <MessageCircle size={40} />
                    </div>
                    <h1>Create Account</h1>
                    <p>Step 1 of 2: Basic Information</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <Input
                        type="text"
                        name="fullName"
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        type="email"
                        name="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

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
                        <select
                            name="gender"
                            className="input"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="password-field">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            label="Password"
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
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
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <Button type="submit" className="w-full" size="lg">
                        Continue
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
