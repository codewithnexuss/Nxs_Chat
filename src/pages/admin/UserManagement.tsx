import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Ban, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types';
import './Admin.css';

export const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showActions, setShowActions] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setUsers(data as User[]);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchUsers();
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setUsers(data as User[]);
            }
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBan = async (user: User) => {
        const newStatus = !user.is_banned;
        try {
            await supabase
                .from('users')
                .update({ is_banned: newStatus })
                .eq('id', user.id);

            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, is_banned: newStatus } : u
            ));
            setShowActions(null);
        } catch (err) {
            console.error('Error toggling ban:', err);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await supabase.from('users').delete().eq('id', userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setShowActions(null);
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const filteredUsers = users;

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="loader" />
                <p>Loading users...</p>
            </div>
        );
    }

    return (
        <div className="admin-user-management">
            <div className="admin-page-header">
                <h1>User Management</h1>
                <p>Manage all registered users</p>
            </div>

            {/* Search */}
            <div className="admin-search-bar">
                <div className="search-input-container">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={user.is_banned ? 'banned' : ''}>
                                <td>
                                    <div className="user-cell">
                                        <Avatar
                                            src={user.profile_picture}
                                            name={user.full_name}
                                            size="sm"
                                            isOnline={user.is_online}
                                        />
                                        <div>
                                            <span className="user-name">{user.full_name}</span>
                                            <span className="user-username">@{user.username}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`status-badge ${user.is_banned ? 'banned' : user.is_online ? 'online' : 'offline'}`}>
                                        {user.is_banned ? 'Banned' : user.is_online ? 'Online' : 'Offline'}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="actions-container">
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {showActions === user.id && (
                                            <div className="actions-dropdown">
                                                <button onClick={() => navigate(`/admin/users/${user.id}`)}>
                                                    <Eye size={16} />
                                                    View Details
                                                </button>
                                                <button onClick={() => toggleBan(user)}>
                                                    {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                                    {user.is_banned ? 'Unban User' : 'Ban User'}
                                                </button>
                                                <button className="danger" onClick={() => deleteUser(user.id)}>
                                                    <Trash2 size={16} />
                                                    Delete User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="no-users">
                        <p>No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
