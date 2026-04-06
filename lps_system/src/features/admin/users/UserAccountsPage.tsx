import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    Shield,
    Trash2,
    CheckCircle,
    X,
    Edit // Added Edit Icon
} from 'lucide-react';
// import { localDB } from '../../../lib/localDatabase'; // LocalDB fallback removed
import { UserRole } from '../../../config/roles';
import { getUser, getToken } from '../../../lib/storage';
import { API_BASE } from '../../../lib/apiConfig';

// Simple Alert Component
const Alert = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-24 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 ${type === 'success'
            ? 'bg-ind-bg border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
    >
        {type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
        <span className="font-bold text-sm">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
            <X size={14} />
        </button>
    </motion.div>
);

const UserAccountsPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);


    // Filter State
    const currentUser = getUser();
    const isManager = currentUser?.role === UserRole.MANAGER;

    // Filter State
    const tabs = isManager
        ? ['ALL ACCESS', 'Supervisor', 'DEO']
        : ['ALL ACCESS', 'Admin', 'Manager', 'Supervisor', 'DEO'];

    const [activeTab, setActiveTab] = useState('ALL ACCESS');

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        role: '',
        password: '',
        shop: '',
        name: '',
        isActive: true // Added active state
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/admin/identity/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                // Backend returns { success, data: [...], meta: {...} }
                const userList = result.data || result;
                if (userList && Array.isArray(userList)) {
                    setUsers(userList);
                    setIsLoading(false);
                    return;
                }
            }
            setIsLoading(false);
            console.error('Failed to load users from backend');
        } catch (e) {
            setIsLoading(false);
            console.error('Failed to load users from backend', e);
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditMode(false);

        setFormData({
            username: '',
            role: '',
            password: '',
            shop: '',
            name: '',
            isActive: true
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (user: any) => {
        setIsEditMode(true);

        setFormData({
            username: user.username,
            role: user.role,
            password: '', // Keep blank to indicate no change unless typed
            shop: user.shop || '',
            name: user.name || '',
            isActive: user.isActive !== undefined ? user.isActive : true
        });
        setShowModal(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = getToken();

            if (isEditMode && formData.username) {
                // UPDATE USER - Using username as identity
                const updates: any = {
                    role: formData.role,
                    shop: formData.shop,
                    name: formData.name || formData.username,
                    isActive: formData.isActive
                };

                if (formData.password) {
                    updates.password = formData.password;
                }

                const response = await fetch(`${API_BASE}/admin/identity/users/${formData.username}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updates),
                });

                if (!response.ok) throw new Error('Failed to update user in backend');

                setAlert({ message: 'User updated successfully in PostgreSQL', type: 'success' });

            } else {
                // CREATE USER
                if (!formData.username || !formData.password || !formData.role) {
                    setAlert({ message: 'Please fill in all required fields', type: 'error' });
                    return;
                }

                const newUser = {
                    username: formData.username,
                    role: formData.role,
                    password: formData.password,
                    shop: formData.shop,
                    name: formData.name || formData.username,
                    isActive: formData.isActive
                };

                const response = await fetch(`${API_BASE}/admin/identity/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newUser),
                });

                if (!response.ok) throw new Error('Username may already exist in backend');

                setAlert({ message: 'User created successfully in PostgreSQL', type: 'success' });
            }

            setShowModal(false);
            loadUsers();
        } catch (error: any) {
            setAlert({ message: error.message || 'Operation failed', type: 'error' });

            // Fallback to localDB if backend fails
            // No localDB fallback; rely on backend response
            // Errors already handled above
            setShowModal(false);
            loadUsers();
        } finally {
            setIsLoading(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, userId: number | null, username: string | null }>({
        isOpen: false,
        userId: null,
        username: null
    });

    const handleDeleteClick = (user: any) => {
        setDeleteConfirmation({ isOpen: true, userId: user.id, username: user.username });
    };

    const confirmDeleteUser = async () => {
        if (deleteConfirmation.username) {
            try {
                const token = getToken();

                const response = await fetch(`${API_BASE}/admin/identity/users/${deleteConfirmation.username}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setAlert({ message: 'User deleted from PostgreSQL', type: 'success' });
                } else {
                    setAlert({ message: 'Failed to delete user from backend', type: 'error' });
                }
            } catch (e) {
                console.error("Delete from backend failed", e);
                setAlert({ message: 'Backend delete error', type: 'error' });
            }
            // Sync local state by reloading users
            loadUsers();
            setDeleteConfirmation({ isOpen: false, userId: null, username: null });
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        // Manager Restriction: Hide Admin and Manager users
        if (isManager && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
            return false;
        }

        const matchesSearch = (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = activeTab === 'ALL ACCESS' || user.role.toUpperCase() === activeTab.toUpperCase() || (activeTab === 'Admin' && user.role === 'Admin');
        return matchesSearch && matchesRole;
    });

    // Calculate Stats
    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive !== false).length,
        admins: users.filter(u => u.role === UserRole.ADMIN).length
    };

    return (
        <div className="p-1 space-y-2 min-h-screen bg-ind-bg/50">
            <AnimatePresence>
                {alert && (
                    <Alert
                        message={alert.message}
                        type={alert.type}
                        onClose={() => setAlert(null)}
                    />
                )}
            </AnimatePresence>

            {/* Sticky Header - Medium Size (Refined) */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-sm border border-ind-border/60 mb-4 transition-all duration-300">
                <div className="flex flex-col gap-3">
                    {/* Top Row: Title & Stats */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-black text-ind-text tracking-tight pl-1">
                                User Management
                            </h1>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-4 px-4 py-2 bg-ind-bg rounded-xl border border-ind-border/50">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">Total</p>
                                    <p className="text-lg font-black text-ind-text leading-none">{stats.total}</p>
                                </div>
                                <div className="w-px h-6 bg-ind-border/50"></div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-ind-primary uppercase tracking-widest">Active</p>
                                    <p className="text-lg font-black text-ind-primary leading-none">{stats.active}</p>
                                </div>
                                {!isManager && (
                                    <>
                                        <div className="w-px h-6 bg-ind-border/50"></div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-ind-text3 uppercase tracking-widest">Admins</p>
                                            <p className="text-lg font-black text-ind-text2 leading-none">{stats.admins}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto scrollbar-hide select-none p-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap box-border border-2
                                        ${activeTab === tab
                                            ? 'bg-ind-primary border-ind-primary text-white shadow-[0_4px_12px_rgba(243,112,33,0.4)] transform hover:-translate-y-0.5'
                                            : 'bg-transparent border-transparent text-ind-text3 hover:bg-ind-bg hover:text-ind-text2'
                                        }
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search & Add */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ind-text3 group-focus-within:text-ind-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-ind-border rounded-xl font-bold text-ind-text placeholder:text-ind-text3 focus:ring-2 focus:ring-ind-primary/10 focus:border-ind-primary outline-none transition-all text-xs tracking-wide shadow-sm"
                                />
                            </div>
                             <button
                                onClick={handleOpenCreateModal}
                                className="bg-ind-primary hover:bg-ind-primary/90 text-white px-6 py-2.5 rounded-full font-bold text-[11px] uppercase tracking-widest shadow-[0_4px_12px_rgba(243,112,33,0.4)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 shrink-0"
                            >
                                <Plus size={16} strokeWidth={3} />
                                <span className="hidden md:inline">Add User</span>
                            </button>
                        </div>
                    </div>

                    {/* User List Header - Moved Inside Sticky Header */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-2 mt-2 text-[10px] font-bold text-ind-text3 uppercase tracking-widest border-t border-ind-border/50/50 hidden md:grid">
                        <div className="col-span-3 pl-2">Account Info</div>
                        <div className="col-span-2 text-center">Designation</div>
                        <div className="col-span-3 text-center text-ind-primary underline decoration-2 underline-offset-4">Authorized Name</div>

                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-2 text-right pr-2">Actions</div>
                    </div>
                </div>
            </div>

            {/* User List Container */}
            <div className="px-5 pb-8 min-h-[500px]">

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-20 text-ind-text3 font-bold">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 text-ind-text3 font-bold">No users found matching your filters.</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl border border-transparent hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-ind-border/50 hover:scale-[1.01] hover:z-10 transition-all duration-300 group cursor-pointer">
                                {/* Mobile: Account Info */}
                                <div className="col-span-3 flex items-center gap-3 w-full">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black uppercase shadow-sm transition-transform group-hover:scale-110
                                        ${user.role === UserRole.ADMIN ? 'bg-ind-primary/10 text-ind-primary' :
                                            user.role === UserRole.MANAGER ? 'bg-ind-bg text-ind-text' :
                                                user.role === UserRole.SUPERVISOR ? 'bg-ind-bg text-ind-text' :
                                                    'bg-ind-border/30 text-ind-text2'}
                                    `}>
                                        {(user.name || user.username || '?').substring(0, 1)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-ind-text3/80 lowercase">@{user.username.toLowerCase()}</span>
                                        <span className="text-[9px] font-black text-ind-text3 uppercase tracking-tighter">ID: #{user.id}</span>
                                    </div>
                                </div>

                                {/* Designation */}
                                <div className="col-span-2 flex items-center justify-center">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                                        ${user.role === UserRole.ADMIN ? 'bg-ind-primary/10 text-ind-primary' :
                                            user.role === UserRole.MANAGER ? 'bg-ind-bg text-ind-text2' :
                                                user.role === UserRole.SUPERVISOR ? 'bg-ind-bg text-ind-text2' :
                                                    'bg-ind-bg text-ind-text2'}
                                     `}>
                                        {user.role}
                                    </span>
                                </div>

                                {/* Authorized Name - THE CIRCLE LOCATION */}
                                <div className="col-span-3 flex items-center justify-center">
                                    <span className="font-black text-ind-text text-xs uppercase tracking-tight group-hover:text-ind-primary transition-colors">
                                        {user.name || 'Anonymous User'}
                                    </span>
                                </div>

                                {/* Work Unit */}
                                <div className="col-span-1 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-ind-text2 uppercase tracking-tighter">
                                        {user.shop || '--'}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="col-span-1 flex items-center justify-center">
                                    {user.isActive !== false ? (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-ind-border/50"></div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleOpenEditModal(user)}
                                        className="p-2 rounded-lg border border-ind-border/50 text-ind-text3 hover:text-ind-primary hover:bg-ind-bg transition-all bg-white"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(user)}
                                        className="p-2 rounded-lg border border-ind-border/50 text-ind-text3 hover:text-rose-500 hover:bg-rose-50 transition-all bg-white"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit User Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-ind-text/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-8 pb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="font-black text-ind-text text-2xl tracking-tighter uppercase">
                                        {isEditMode ? 'Edit User' : 'Add New User'}
                                    </h3>
                                    <p className="text-ind-text3 text-[10px] font-black uppercase tracking-widest mt-1">
                                        {isEditMode ? 'Modify user details and permissions.' : 'Update user information and system permissions.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-10 h-10 rounded-xl border border-ind-border/50 flex items-center justify-center text-ind-text3 hover:bg-ind-bg hover:text-ind-text2 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveUser} className="p-8 pt-4 space-y-6">
                                {/* Username & Password Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ind-text3 uppercase tracking-widest ml-1">Username</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ind-text3">
                                                <Users size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-ind-bg/50 border border-ind-border/30 rounded-2xl font-bold text-ind-text placeholder:text-ind-text3 focus:ring-2 focus:ring-ind-primary/10 focus:border-ind-primary outline-none transition-all"
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-ind-text3 uppercase tracking-widest ml-1">
                                            {isEditMode ? 'New Password' : 'Password'}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ind-text3">
                                                <Shield size={18} />
                                            </div>
                                            <input
                                                type="password"
                                                required={!isEditMode} // Required only in create mode
                                                className="w-full pl-12 pr-4 py-4 bg-ind-bg/50 border border-ind-border/30 rounded-2xl font-bold text-ind-text placeholder:text-ind-text3 focus:ring-2 focus:ring-ind-primary/10 focus:border-ind-primary outline-none transition-all"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={isEditMode ? "Leave blank to keep" : "••••••••"}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-ind-text3 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-ind-bg border border-ind-border/50 rounded-2xl font-bold text-ind-text placeholder:text-ind-text3 focus:ring-2 focus:ring-ind-primary/10 focus:border-ind-primary outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                {/* User Role */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-ind-text3 uppercase tracking-widest ml-1">User Role</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-ind-text3">
                                            <Shield size={18} />
                                        </div>
                                        <select
                                            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-ind-text rounded-2xl font-bold text-ind-text focus:outline-none appearance-none cursor-pointer hover:bg-ind-bg transition-colors"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="" disabled>Grant Access Level</option>
                                            {Object.values(UserRole).filter(role => {
                                                if (isManager) {
                                                    return role === UserRole.SUPERVISOR || role === UserRole.DEO;
                                                }
                                                return true;
                                            }).map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-ind-text3">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Auth Status */}
                                <div className="bg-ind-bg p-6 rounded-3xl flex items-center justify-between">
                                    <div>
                                        <h4 className="font-black text-ind-text text-xs uppercase tracking-wide">Global Auth Status</h4>
                                        <p className="text-ind-text3 text-[10px] font-bold mt-1">Control identity's ability to sync with core</p>
                                    </div>
                                    <div
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${formData.isActive ? 'bg-ind-primary' : 'bg-ind-border/50'}`}
                                    >
                                        <span className="sr-only">Use setting</span>
                                        <span
                                            aria-hidden="true"
                                            className={`${formData.isActive ? 'translate-x-6' : 'translate-x-0'} pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                        ></span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 flex items-center justify-between gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="text-[10px] font-black text-ind-text3 uppercase tracking-widest hover:text-ind-text2 transition-colors px-4"
                                    >
                                        Abandon
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-ind-primary text-white py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-ind-primary/90 shadow-xl shadow-ind-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border-[3px] border-ind-primary hover:border-ind-primary/90"
                                    >
                                        <CheckCircle size={18} strokeWidth={3} />
                                        <span>{isEditMode ? 'Update User' : 'Save New User'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirmation({ isOpen: false, userId: null, username: null })}
                            className="absolute inset-0 bg-ind-text/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-ind-bg text-ind-primary flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="font-black text-ind-text text-xl tracking-tight mb-2">Delete User?</h3>
                            <p className="text-ind-text2 text-sm font-medium mb-8">
                                Are you sure you want to remove this user from the system? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmation({ isOpen: false, userId: null, username: null })}
                                    className="flex-1 py-3 bg-ind-border/30 text-ind-text2 rounded-xl font-bold hover:bg-ind-border/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteUser}
                                    className="flex-1 py-3 bg-ind-primary text-white rounded-xl font-bold hover:bg-ind-primary/90 shadow-lg shadow-ind-primary/20 transition-colors"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default UserAccountsPage;
