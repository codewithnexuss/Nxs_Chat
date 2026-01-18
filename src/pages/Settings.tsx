import React, { useState } from 'react';
import {
    User, Moon, Sun, Lock, Eye, LogOut,
    ChevronRight, Camera, Check
} from 'lucide-react';
import { Avatar, Button, Input, Textarea, Modal } from '../components/common';
import { Header } from '../components/layout';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';
import './Settings.css';

export const Settings: React.FC = () => {
    const { user, updateUser, signOut } = useAuthStore();
    const { mode, toggleMode } = useThemeStore();
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [isPublic, setIsPublic] = useState(user?.is_profile_public ?? true);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateUser({ full_name: fullName, bio });
            setActiveSection(null);
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePrivacy = async () => {
        setIsSaving(true);
        try {
            await updateUser({ is_profile_public: isPublic });
            setActiveSection(null);
        } catch (err) {
            console.error('Error saving privacy:', err);
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
            alert('Profile picture updated successfully!');
        } catch (err: any) {
            console.error('Error uploading image:', err);
            alert(`Failed to upload image: ${err.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="settings-page">
            <Header title="Settings" />

            <div className="page-content">
                <div className="page-header-desktop">
                    <h2>Settings</h2>
                </div>

                {/* Profile Card */}
                <div className="settings-profile-card">
                    <div className="profile-avatar-container">
                        <Avatar
                            src={user?.profile_picture}
                            name={user?.full_name}
                            size="2xl"
                        />
                        <label className="avatar-upload-btn">
                            <Camera size={16} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                hidden
                            />
                        </label>
                    </div>
                    <div className="profile-info">
                        <h3>{user?.full_name}</h3>
                        <p>@{user?.username}</p>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="settings-section">
                    <h4 className="section-title">Account</h4>

                    <button
                        className="settings-item"
                        onClick={() => setActiveSection('profile')}
                    >
                        <User size={20} />
                        <span>Edit Profile</span>
                        <ChevronRight size={18} />
                    </button>

                    <button
                        className="settings-item"
                        onClick={() => setActiveSection('privacy')}
                    >
                        <Lock size={20} />
                        <span>Privacy</span>
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="settings-section">
                    <h4 className="section-title">Appearance</h4>

                    <div className="settings-item theme-item">
                        <div className="theme-label">
                            {mode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            <span>Dark Mode</span>
                        </div>
                        <button
                            className={`toggle-switch ${mode === 'dark' ? 'active' : ''}`}
                            onClick={toggleMode}
                        >
                            <span className="toggle-knob" />
                        </button>
                    </div>
                </div>

                <div className="settings-section">
                    <button className="settings-item logout-item" onClick={signOut}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <Modal
                isOpen={activeSection === 'profile'}
                onClose={() => setActiveSection(null)}
                title="Edit Profile"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setActiveSection(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} isLoading={isSaving}>
                            Save
                        </Button>
                    </>
                }
            >
                <div className="edit-form">
                    <Input
                        label="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <Textarea
                        label="Bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                    />
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input className="input" value={user?.email} disabled />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <input className="input" value={`@${user?.username}`} disabled />
                        <span className="text-xs text-muted">Username can be changed once every 5 days</span>
                    </div>
                </div>
            </Modal>

            {/* Privacy Modal */}
            <Modal
                isOpen={activeSection === 'privacy'}
                onClose={() => setActiveSection(null)}
                title="Privacy Settings"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setActiveSection(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePrivacy} isLoading={isSaving}>
                            Save
                        </Button>
                    </>
                }
            >
                <div className="privacy-options">
                    <p className="privacy-description">
                        Choose who can see your profile details
                    </p>

                    <button
                        className={`privacy-option ${isPublic ? 'active' : ''}`}
                        onClick={() => setIsPublic(true)}
                    >
                        <div className="privacy-option-content">
                            <Eye size={20} />
                            <div>
                                <strong>Public</strong>
                                <p>Anyone can see your bio and full profile</p>
                            </div>
                        </div>
                        {isPublic && <Check size={20} className="check-icon" />}
                    </button>

                    <button
                        className={`privacy-option ${!isPublic ? 'active' : ''}`}
                        onClick={() => setIsPublic(false)}
                    >
                        <div className="privacy-option-content">
                            <Lock size={20} />
                            <div>
                                <strong>Private</strong>
                                <p>Only your name and username are visible</p>
                            </div>
                        </div>
                        {!isPublic && <Check size={20} className="check-icon" />}
                    </button>
                </div>
            </Modal>
        </div>
    );
};
