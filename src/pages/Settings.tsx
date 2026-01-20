import React, { useState } from 'react';
import {
    User, Moon, Sun, Lock, Eye, LogOut,
    Camera
} from 'lucide-react';
import { Avatar, Button, Input, Textarea } from '../components/common';
import { Header } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';
import './Settings.css';

export const Settings: React.FC = () => {
    const { user, updateUser, signOut } = useAuthStore();
    const { mode, toggleMode } = useThemeStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'appearance'>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [username] = useState(user?.username || '');

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateUser({ full_name: fullName, bio });
            alert('Profile updated successfully!'); // Replace with toast later
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        try {
            const fileName = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(fileName);

            await updateUser({ profile_picture: publicUrl });
        } catch (err: any) {
            console.error('Error uploading image:', err);
            alert(`Failed to upload image: ${err.message || 'Unknown error'}`);
        }
    };

    const renderProfileTab = () => (
        <div className="tab-content fade-in">
            <div className="profile-edit-section">
                <div className="profile-avatar-large">
                    <Avatar
                        src={user?.profile_picture}
                        name={user?.full_name}
                        size="2xl"
                    />
                    <label className="avatar-edit-overlay">
                        <Camera size={20} />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            hidden
                        />
                    </label>
                </div>

                <div className="settings-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <div className="input-with-icon">
                            <span className="input-prefix">@</span>
                            <Input
                                value={username}
                                disabled
                                className="pl-8"
                            />
                        </div>
                        <p className="input-hint">Username cannot be changed regularly.</p>
                    </div>

                    <div className="form-group">
                        <label>Bio</label>
                        <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a little about yourself"
                            rows={4}
                        />
                    </div>

                    <div className="form-actions">
                        <Button
                            onClick={handleSaveProfile}
                            isLoading={isSaving}
                            disabled={!fullName.trim()}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPrivacyTab = () => (
        <div className="tab-content fade-in">
            <div className="privacy-settings">
                <div
                    className={`privacy-option-card ${user?.is_profile_public ? 'active' : ''}`}
                    onClick={() => updateUser({ is_profile_public: true })}
                >
                    <div className="privacy-icon-wrapper public">
                        <Eye size={24} />
                    </div>
                    <div className="privacy-info">
                        <h4>Public Profile</h4>
                        <p>Everyone can see your profile, bio, and stories.</p>
                    </div>
                    <div className="radio-circle">
                        {user?.is_profile_public && <div className="radio-fill" />}
                    </div>
                </div>

                <div
                    className={`privacy-option-card ${!user?.is_profile_public ? 'active' : ''}`}
                    onClick={() => updateUser({ is_profile_public: false })}
                >
                    <div className="privacy-icon-wrapper private">
                        <Lock size={24} />
                    </div>
                    <div className="privacy-info">
                        <h4>Private Account</h4>
                        <p>Only your name and username are visible to non-contacts.</p>
                    </div>
                    <div className="radio-circle">
                        {!user?.is_profile_public && <div className="radio-fill" />}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAppearanceTab = () => (
        <div className="tab-content fade-in">
            <div className="appearance-options">
                <div className="theme-card" onClick={toggleMode}>
                    <div className={`theme-preview ${mode === 'dark' ? 'dark' : 'light'}`}>
                        <div className="preview-nav"></div>
                        <div className="preview-content">
                            <div className="preview-bubble received"></div>
                            <div className="preview-bubble sent"></div>
                        </div>
                    </div>
                    <div className="theme-card-info">
                        <span>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                        <div className={`toggle-switch small ${mode === 'dark' ? 'active' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="settings-page">
            <Header title="Settings" />

            <div className="page-content settings-layout">
                <div className="page-header-desktop">
                    <h2>Settings</h2>
                </div>

                <div className="settings-container">
                    {/* Settings Sidebar */}
                    <div className="settings-sidebar">
                        <button
                            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={20} />
                            <span>Edit Profile</span>
                        </button>
                        <button
                            className={`settings-nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
                            onClick={() => setActiveTab('privacy')}
                        >
                            <Lock size={20} />
                            <span>Privacy & Security</span>
                        </button>
                        <button
                            className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
                            onClick={() => setActiveTab('appearance')}
                        >
                            {mode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            <span>Appearance</span>
                        </button>

                        <div className="settings-sidebar-footer">
                            <button className="settings-nav-item logout" onClick={signOut}>
                                <LogOut size={20} />
                                <span>Log Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Settings Content */}
                    <div className="settings-main-content">
                        {activeTab === 'profile' && renderProfileTab()}
                        {activeTab === 'privacy' && renderPrivacyTab()}
                        {activeTab === 'appearance' && renderAppearanceTab()}
                    </div>
                </div>
            </div>
        </div>
    );
};
