import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CRMApp } from './components/crm/CRMApp';
import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
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
