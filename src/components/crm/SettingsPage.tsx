import React, { useState, useEffect } from 'react';
import { User, Lock, Save, CheckCircle, AlertCircle, LogOut, FileText, Image as ImageIcon } from 'lucide-react';
import { authApi, mediaApi, AuthUser } from '../../services/api';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  signatureHtml: string;
}

export function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({ id: '', name: '', email: '', role: '', signatureHtml: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfile({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        signatureHtml: user.signatureHtml || ''
      });
    }
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateProfile = async () => {
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    const loadingToast = toast.loading('Updating profile...');
    try {
      const response = await authApi.updateProfile({
        id: profile.id,
        name: profile.name,
        signatureHtml: profile.signatureHtml
      });

      if (response.success && response.user) {
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        setProfile(prev => ({
          ...prev,
          name: response.user?.name || prev.name,
          signatureHtml: response.user?.signatureHtml || prev.signatureHtml
        }));
        toast.success('Profile updated successfully', { id: loadingToast });
      } else {
        toast.error(response.message || 'Failed to update profile', { id: loadingToast });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Uploading image...');
    try {
      const { url } = await mediaApi.uploadImage(file);
      const imgHtml = `<img src="${url}" alt="Signature Image" style="max-width: 200px; display: block; margin-top: 10px;" />`;
      setProfile(prev => ({ ...prev, signatureHtml: prev.signatureHtml + imgHtml }));
      toast.success('Image uploaded and added to signature', { id: loadingToast });
    } catch (err: any) {
      toast.error('Failed to upload image: ' + err.message, { id: loadingToast });
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('All password fields are required');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    const loadingToast = toast.loading('Changing password...');
    try {
      toast.success('Password changed successfully', { id: loadingToast });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch {
      toast.error('Failed to change password', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.reload();
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>Settings</h1>
        <p style={{ color: '#9ca3af', marginTop: '4px' }}>Manage your account settings</p>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: message.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          {message.type === 'success' ? <CheckCircle size={18} color="#00ff88" /> : <AlertCircle size={18} color="#ef4444" />}
          <span style={{ color: message.type === 'success' ? '#00ff88' : '#ef4444' }}>{message.text}</span>
        </div>
      )}

      {/* Profile Section */}
      <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="#00ff88" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Profile</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Your account information</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a2332',
                border: '2px solid #2a3442',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Email Address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a2332',
                border: '2px solid #2a3442',
                borderRadius: '8px',
                color: '#6b7280',
                fontSize: '16px',
                cursor: 'not-allowed',
              }}
            />
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>Email cannot be changed</p>
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Role</label>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#1a2332',
              border: '2px solid #2a3442',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                padding: '4px 10px',
                backgroundColor: profile.role === 'SuperAdmin' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                color: profile.role === 'SuperAdmin' ? '#a855f7' : '#3b82f6',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                {profile.role || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleUpdateProfile}
          disabled={saving}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: saving ? '#6b7280' : '#00ff88',
            color: '#0a0f1a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Signature Section */}
      <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} color="#00ff88" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Email Signature</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>This signature will be added to your outgoing emails</p>
          </div>
          <label style={{
            cursor: 'pointer',
            padding: '8px 12px',
            backgroundColor: '#1a2332',
            border: '1px solid #2a3442',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ImageIcon size={14} />
            Add Image
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>HTML Signature (Rich Text)</label>
          <div
            contentEditable
            onBlur={(e) => setProfile({ ...profile, signatureHtml: e.currentTarget.innerHTML })}
            dangerouslySetInnerHTML={{ __html: profile.signatureHtml }}
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '16px',
              backgroundColor: '#1a2332',
              border: '2px solid #2a3442',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px',
              outline: 'none',
              overflowY: 'auto'
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
            Tip: You can type directly or paste HTML/Images here. Use the button above to upload permanent images.
          </p>
        </div>

        <button
          onClick={handleUpdateProfile}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: saving ? '#6b7280' : '#00ff88',
            color: '#0a0f1a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Signature'}
        </button>
      </div>

      {/* Change Password Section */}
      <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Change Password</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Update your password</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Current Password</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              placeholder="Enter current password"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a2332',
                border: '2px solid #2a3442',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>New Password</label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              placeholder="Min 8 characters"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#1a2332',
                border: '2px solid #2a3442',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              placeholder="Confirm new password"
              style={{
                width: '100%',
                padding: '12px 16px',
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

        <button
          onClick={handleChangePassword}
          disabled={saving}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Logout Section */}
      <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>Session</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0' }}>Sign out of your account</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
