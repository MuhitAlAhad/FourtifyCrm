import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CRMApp } from './components/crm/CRMApp';
import { ScrollToTop } from './components/ScrollToTop';
import { Toaster } from 'sonner';

export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.body.setAttribute('dir', 'ltr');

    const enforceLtr = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName?.toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || target.isContentEditable;
      if (!isEditable) return;
      target.setAttribute('dir', 'ltr');
      target.style.direction = 'ltr';
      target.style.unicodeBidi = 'plaintext';
      target.style.textAlign = 'left';
    };

    document.addEventListener('focusin', enforceLtr);
    return () => {
      document.removeEventListener('focusin', enforceLtr);
    };
  }, []);

  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1a2332',
            color: '#fff',
            border: '1px solid #2a3442',
          },
          duration: 4000,
          success: {
            style: {
              background: '#1a2332',
              color: '#00ff88',
              border: '1px solid #00ff88',
            },
            iconTheme: {
              primary: '#00ff88',
              secondary: '#1a2332',
            },
          },
          error: {
            style: {
              background: '#1a2332',
              color: '#ef4444',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a2332',
            },
          },
          loading: {
            style: {
              background: '#1a2332',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
            },
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#1a2332',
            },
          },
        }}
      />
      <ScrollToTop />
      <Routes>
        {/* CRM Admin Portal - All routes */}
        <Route path="/*" element={<CRMApp />} />
      </Routes>
    </Router>
  );
}
