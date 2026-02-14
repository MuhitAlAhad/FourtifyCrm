import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, UserX, Shield, ChevronUp, RefreshCw, AlertCircle, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { adminApi, AdminUser } from '../../services/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SortableHeader, SortConfig, toggleSort, sortData } from '../ui/SortableHeader';

export function AdminManagementPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' });
    const [rejectReason, setRejectReason] = useState('');
    const [tab, setTab] = useState<'pending' | 'all'>('pending');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
    const handleSort = (key: string) => setSortConfig(prev => toggleSort(prev, key));

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [pendingData, allData] = await Promise.all([
                adminApi.getPendingUsers(),
                adminApi.getAllUsers(),
            ]);
            setPendingUsers(pendingData);
            setUsers(allData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string, userName: string) => {
        const loadingToast = toast.loading(`Approving ${userName}...`);
        try {
            const result = await adminApi.approveUser(userId);
            if (result.success) {
                toast.success(`${userName} has been approved`, { id: loadingToast });
                loadData();
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to approve user', { id: loadingToast });
        }
    };

    const handleReject = async () => {
        const loadingToast = toast.loading(`Rejecting ${rejectModal.userName}...`);
        try {
            const result = await adminApi.rejectUser(rejectModal.userId, rejectReason);
            if (result.success) {
                toast.success(`${rejectModal.userName} has been rejected`, { id: loadingToast });
                setRejectModal({ open: false, userId: '', userName: '' });
                setRejectReason('');
                loadData();
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to reject user', { id: loadingToast });
        }
    };

    const handlePromote = async (userId: string, userName: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Promote to Super Admin',
            message: `Promote ${userName} to Super Admin? They will have full control over the system.`,
            variant: 'warning',
            onConfirm: async () => {
                const loadingToast = toast.loading(`Promoting ${userName}...`);
                try {
                    const result = await adminApi.promoteUser(userId);
                    if (result.success) {
                        toast.success(`${userName} is now a Super Admin`, { id: loadingToast });
                        loadData();
                    }
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Failed to promote user', { id: loadingToast });
                }
            },
        });
    };

    const handleDemote = async (userId: string, userName: string) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Demote to Admin',
            message: `Demote ${userName} from Super Admin to Admin?`,
            variant: 'warning',
            onConfirm: async () => {
                const loadingToast = toast.loading(`Demoting ${userName}...`);
                try {
                    const result = await adminApi.demoteUser(userId);
                    if (result.success) {
                        toast.success(`${userName} is now an Admin`, { id: loadingToast });
                        loadData();
                    }
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Failed to demote user', { id: loadingToast });
                }
            },
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; color: string; text: string }> = {
            active: { bg: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', text: 'Active' },
            pending_verification: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', text: 'Pending Verification' },
            pending_approval: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Pending Approval' },
            rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Rejected' },
        };
        const s = styles[status] || { bg: '#1a2332', color: '#9ca3af', text: status };
        return (
            <span style={{ padding: '4px 12px', backgroundColor: s.bg, color: s.color, borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                {s.text}
            </span>
        );
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>User Management</h1>
                    <p style={{ color: '#9ca3af', marginTop: '4px' }}>Manage admin accounts and approvals</p>
                </div>
                <button
                    onClick={loadData}
                    style={{ padding: '10px 20px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} color="#ef4444" />
                    <span style={{ color: '#ef4444' }}>{error}</span>
                </div>
            )}
            {actionMessage && (
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={18} color="#00ff88" />
                    <span style={{ color: '#00ff88' }}>{actionMessage}</span>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={22} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{pendingUsers.length}</div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Pending Approval</div>
                        </div>
                    </div>
                </div>
                <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={22} color="#00ff88" />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{users.filter(u => u.status === 'active').length}</div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Active Users</div>
                        </div>
                    </div>
                </div>
                <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={22} color="#a855f7" />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{users.filter(u => u.role === 'SuperAdmin').length}</div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Super Admins</div>
                        </div>
                    </div>
                </div>
                <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <XCircle size={22} color="#ef4444" />
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{users.filter(u => u.status === 'rejected').length}</div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>Rejected</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                    onClick={() => setTab('pending')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: tab === 'pending' ? '#00ff88' : '#1a2332',
                        color: tab === 'pending' ? '#0a0f1a' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <Clock size={16} /> Pending ({pendingUsers.length})
                </button>
                <button
                    onClick={() => setTab('all')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: tab === 'all' ? '#00ff88' : '#1a2332',
                        color: tab === 'all' ? '#0a0f1a' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <Users size={16} /> All Users ({users.length})
                </button>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
                ) : (() => {
                    const displayData = tab === 'pending' ? pendingUsers : users;
                    if (displayData.length === 0) return (
                        <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                            {tab === 'pending' ? 'No pending approvals' : 'No users found'}
                        </div>
                    );
                    const sortedUsers = sortData(displayData, sortConfig, (user, key) => {
                        if (key === 'registered') return new Date(user.createdAt).getTime();
                        return undefined;
                    });
                    return (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1a2332' }}>
                                <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                                <SortableHeader label="Registered" sortKey="registered" sortConfig={sortConfig} onSort={handleSort} />
                                <th style={{ padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((user) => (
                                <tr key={user.id} style={{ borderTop: '1px solid #1a2332' }}>
                                    <td style={{ padding: '14px', color: 'white', fontSize: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '36px', height: '36px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff88', fontWeight: 'bold', fontSize: '14px' }}>
                                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <span>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', color: '#9ca3af', fontSize: '14px' }}>{user.email}</td>
                                    <td style={{ padding: '14px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            backgroundColor: user.role === 'SuperAdmin' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: user.role === 'SuperAdmin' ? '#a855f7' : '#3b82f6',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px' }}>{getStatusBadge(user.status)}</td>
                                    <td style={{ padding: '14px', color: '#9ca3af', fontSize: '14px' }}>{formatDate(user.createdAt)}</td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            {user.status === 'pending_approval' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(user.id, user.name)}
                                                        style={{ padding: '6px 12px', backgroundColor: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                                                    >
                                                        <UserCheck size={14} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ open: true, userId: user.id, userName: user.name })}
                                                        style={{ padding: '6px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                                                    >
                                                        <UserX size={14} /> Reject
                                                    </button>
                                                </>
                                            )}
                                            {user.status === 'active' && user.role === 'Admin' && (
                                                <button
                                                    onClick={() => handlePromote(user.id, user.name)}
                                                    style={{ padding: '6px 12px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                                                >
                                                    <ChevronUp size={14} /> Promote
                                                </button>
                                            )}
                                            {user.status === 'active' && user.role === 'SuperAdmin' && (
                                                <button
                                                    onClick={() => handleDemote(user.id, user.name)}
                                                    style={{ padding: '6px 10px', backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                                >
                                                    Demote
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    );
                })()}
            </div>

            {/* Reject Modal */}
            {rejectModal.open && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setRejectModal({ open: false, userId: '', userName: '' })}>
                    <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Reject {rejectModal.userName}?</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                            style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '2px solid #2a3442', borderRadius: '8px', color: 'white', fontSize: '15px', minHeight: '100px', resize: 'vertical', marginBottom: '16px' }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleReject}
                                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Reject User
                            </button>
                            <button
                                onClick={() => setRejectModal({ open: false, userId: '', userName: '' })}
                                style={{ flex: 1, padding: '12px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
            />
        </div>
    );
}
