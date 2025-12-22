import React, { useState } from 'react';
import { Shield, Mail, User, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import logo from '../../assets/35f931b802bf39733103d00f96fb6f9c21293f6e.png';

interface RegisterPageProps {
    onNavigateToLogin: () => void;
}

export function RegisterPage({ onNavigateToLogin }: RegisterPageProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError('All fields are required');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || 'Registration failed');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1a 0%, #1a2332 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <img src={logo} alt="Fourtify CRM" style={{ height: '60px', marginBottom: '24px' }} />
                    </div>
                    <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '16px', padding: '48px 32px' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={40} color="#00ff88" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Check Your Email</h2>
                        <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
                            We've sent a verification link to <strong style={{ color: 'white' }}>{formData.email}</strong>.<br />
                            Please click the link to verify your account.
                        </p>
                        <div style={{ backgroundColor: 'rgba(0, 255, 136, 0.05)', border: '1px solid rgba(0, 255, 136, 0.2)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                            <p style={{ color: '#00ff88', fontSize: '14px', margin: 0 }}>
                                After verification, your account will need admin approval before you can access the CRM.
                            </p>
                        </div>
                        <button
                            onClick={onNavigateToLogin}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#00ff88',
                                color: '#0a0f1a',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1a 0%, #1a2332 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ maxWidth: '450px', width: '100%' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src={logo} alt="Fourtify CRM" style={{ height: '60px', marginBottom: '16px' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>Create Admin Account</h1>
                    <p style={{ color: '#9ca3af', marginTop: '8px' }}>Request access to Fourtify CRM</p>
                </div>

                {/* Form */}
                <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '16px', padding: '32px' }}>
                    <form onSubmit={handleSubmit}>
                        {/* Error */}
                        {error && (
                            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={18} color="#ef4444" />
                                <span style={{ color: '#ef4444', fontSize: '14px' }}>{error}</span>
                            </div>
                        )}

                        {/* Name */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 44px',
                                        backgroundColor: '#1a2332',
                                        border: '2px solid #2a3442',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '16px',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter your email"
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 44px',
                                        backgroundColor: '#1a2332',
                                        border: '2px solid #2a3442',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '16px',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Min 8 characters"
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 44px',
                                        backgroundColor: '#1a2332',
                                        border: '2px solid #2a3442',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '16px',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Confirm your password"
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 44px',
                                        backgroundColor: '#1a2332',
                                        border: '2px solid #2a3442',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '16px',
                                        outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: loading ? '#6b7280' : '#00ff88',
                                color: '#0a0f1a',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginBottom: '16px',
                            }}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        {/* Back to Login */}
                        <button
                            type="button"
                            onClick={onNavigateToLogin}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: 'transparent',
                                color: '#9ca3af',
                                border: '2px solid #2a3442',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <ArrowLeft size={18} />
                            Back to Login
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>
                        Defence Grade Security • DISP Compliant
                    </p>
                </div>
            </div>
        </div>
    );
}
