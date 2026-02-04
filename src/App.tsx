import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CRMApp } from './components/crm/CRMApp';
import { ScrollToTop } from './components/ScrollToTop';

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
      <ScrollToTop />
      <Routes>
        {/* CRM Admin Portal - All routes */}
        <Route path="/*" element={<CRMApp />} />
      </Routes>
    </Router>
  );
}
