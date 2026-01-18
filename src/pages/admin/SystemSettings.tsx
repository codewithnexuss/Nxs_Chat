import React, { useState } from 'react';
import { Save, Shield, Database, Bell, Lock } from 'lucide-react';
import { Button, Input } from '../../components/common';
import './Admin.css';

interface SystemSettings {
    appName: string;
    maxMessageLength: number;
    maxStatusLength: number;
    statusExpiryHours: number;
    allowRandomChat: boolean;
    requireEmailVerification: boolean;
    maintenanceMode: boolean;
}

export const SystemSettings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        appName: 'NXS Chat',
        maxMessageLength: 2000,
        maxStatusLength: 500,
        statusExpiryHours: 24,
        allowRandomChat: true,
        requireEmailVerification: false,
        maintenanceMode: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleChange = (key: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            // In a real app, save to database
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSaveMessage('Settings saved successfully!');
        } catch (err) {
            setSaveMessage('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="system-settings-page">
            <div className="admin-page-header">
                <h1>System Settings</h1>
                <p>Configure application settings</p>
            </div>

            <div className="settings-sections">
                {/* General Settings */}
                <div className="settings-section">
                    <div className="section-header">
                        <Shield size={20} />
                        <h2>General</h2>
                    </div>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <Input
                                label="Application Name"
                                value={settings.appName}
                                onChange={(e) => handleChange('appName', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="settings-section">
                    <div className="section-header">
                        <Database size={20} />
                        <h2>Content Limits</h2>
                    </div>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <Input
                                type="number"
                                label="Max Message Length"
                                value={settings.maxMessageLength.toString()}
                                onChange={(e) => handleChange('maxMessageLength', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="setting-item">
                            <Input
                                type="number"
                                label="Max Status Length"
                                value={settings.maxStatusLength.toString()}
                                onChange={(e) => handleChange('maxStatusLength', parseInt(e.target.value))}
                            />
                        </div>
                        <div className="setting-item">
                            <Input
                                type="number"
                                label="Status Expiry (Hours)"
                                value={settings.statusExpiryHours.toString()}
                                onChange={(e) => handleChange('statusExpiryHours', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="settings-section">
                    <div className="section-header">
                        <Bell size={20} />
                        <h2>Features</h2>
                    </div>
                    <div className="toggle-settings">
                        <div className="toggle-item">
                            <div className="toggle-info">
                                <strong>Random Chat</strong>
                                <p>Allow users to connect with random strangers</p>
                            </div>
                            <button
                                className={`toggle-switch ${settings.allowRandomChat ? 'active' : ''}`}
                                onClick={() => handleChange('allowRandomChat', !settings.allowRandomChat)}
                            >
                                <span className="toggle-knob" />
                            </button>
                        </div>

                        <div className="toggle-item">
                            <div className="toggle-info">
                                <strong>Email Verification</strong>
                                <p>Require email verification for new accounts</p>
                            </div>
                            <button
                                className={`toggle-switch ${settings.requireEmailVerification ? 'active' : ''}`}
                                onClick={() => handleChange('requireEmailVerification', !settings.requireEmailVerification)}
                            >
                                <span className="toggle-knob" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Maintenance */}
                <div className="settings-section danger-section">
                    <div className="section-header">
                        <Lock size={20} />
                        <h2>Maintenance</h2>
                    </div>
                    <div className="toggle-settings">
                        <div className="toggle-item">
                            <div className="toggle-info">
                                <strong>Maintenance Mode</strong>
                                <p>Disable access to the app for non-admin users</p>
                            </div>
                            <button
                                className={`toggle-switch ${settings.maintenanceMode ? 'active' : ''}`}
                                onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                            >
                                <span className="toggle-knob" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="settings-actions">
                    {saveMessage && (
                        <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                            {saveMessage}
                        </span>
                    )}
                    <Button onClick={handleSave} isLoading={isSaving}>
                        <Save size={18} />
                        Save Settings
                    </Button>
                </div>
            </div>
        </div>
    );
};
