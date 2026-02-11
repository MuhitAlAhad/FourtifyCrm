import React, { useState, useEffect } from 'react';
import { CRMDashboard } from './CRMDashboard';
import { LeadsPage } from './LeadsPage';
import { OrganisationsPage } from './OrganisationsPage';
import { ContactsPage } from './ContactsPage';
import { EmailCenterPage } from './EmailCenterPage';
import { PipelinePage } from './PipelinePage';
import { ClientsPage } from './ClientsPage';
import { ChampionsPage } from './ChampionsPage';
import { SettingsPage } from './SettingsPage';
import { CRMSidebar } from './CRMSidebar';
import { CRMHeader } from './CRMHeader';
import { CRMLoginPage } from './CRMLoginPage';
import { RegisterPage } from './RegisterPage';
import { AdminManagementPage } from './AdminManagementPage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, AuthUser } from '../../services/api';

export function CRMApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [emailCenterRecipient, setEmailCenterRecipient] = useState<{ email: string; name: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for verification token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && window.location.pathname.includes('verify-email')) {
      verifyEmail(token);
    }
  }, [searchParams]);

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const verifyEmail = async (token: string) => {
    setVerifying(true);
    try {
      const response = await authApi.verifyEmail(token);
      setVerifyMessage(response.message);
    } catch (err: unknown) {
      setVerifyMessage(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
      navigate('/crm');
    }
  };

  const handleLogin = (loggedInUser: AuthUser, token: string) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  // Show register page
  if (showRegister) {
    return <RegisterPage onNavigateToLogin={() => setShowRegister(false)} />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {verifyMessage && (
          <div style={{
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            padding: '12px 24px', backgroundColor: verifyMessage.includes('success') ? 'rgba(0,255,136,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${verifyMessage.includes('success') ? '#00ff88' : '#ef4444'}`,
            borderRadius: '8px', color: verifyMessage.includes('success') ? '#00ff88' : '#ef4444',
            zIndex: 1000
          }}>
            {verifyMessage}
          </div>
        )}
        <CRMLoginPage
          onLogin={handleLogin}
          onNavigateToRegister={() => setShowRegister(true)}
        />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <CRMDashboard onNavigate={setCurrentPage} />;
      case 'contacts':
        return <ContactsPage onNavigate={setCurrentPage} onSendEmail={(email, name) => {
          setEmailCenterRecipient({ email, name });
          setCurrentPage('email');
        }} />;
      case 'organisations':
        return <OrganisationsPage />;
      case 'leads':
        return <LeadsPage />;
      case 'clients':
        return <ClientsPage />;
      case 'champions':
        return <ChampionsPage />;
      case 'email':
        return <EmailCenterPage prefilledRecipient={emailCenterRecipient} onClearRecipient={() => setEmailCenterRecipient(null)} />;
      case 'settings':
        return <SettingsPage />;
      case 'users':
        return <AdminManagementPage />;
      case 'pipeline':
        return <PipelinePage />;
      default:
        return <CRMDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0f1a]">
      <CRMSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        userRole={user?.role}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CRMHeader onLogout={handleLogout} userName={user?.name} userRole={user?.role} />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}   
