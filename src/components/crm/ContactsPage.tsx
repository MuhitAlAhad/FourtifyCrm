import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Building2, Eye, Trash2, X, AlertCircle, RefreshCw } from 'lucide-react';
import { contactApi, organisationApi } from '../../services/api';

interface ContactDisplay {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  company: string;
  companyId: string;
  role: string;
  isPrimary: boolean;
  notes: string;
  linkedin: string;
  createdAt: string;
}

export function ContactsPage() {
  const [contacts, setContacts] = useState<ContactDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactDisplay | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [contactsResponse, orgsResponse] = await Promise.all([
        contactApi.getAll(),
        organisationApi.getAll(),
      ]);
      const formattedContacts: ContactDisplay[] = contactsResponse.contacts.map(contact => {
        const org = orgsResponse.organisations.find(o => o.id === contact.organisationId);
        return {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone || '',
          mobile: contact.mobile || '',
          company: org?.name || 'Unknown',
          companyId: contact.organisationId || '',
          role: contact.jobTitle || '',
          isPrimary: contact.isPrimary || false,
          notes: contact.notes || '',
          linkedin: contact.linkedin || '',
          createdAt: contact.createdAt || '',
        };
      });
      setContacts(formattedContacts);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await contactApi.delete(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage);

  // Table styles
  const thStyle: React.CSSProperties = {
    padding: '16px 12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#9ca3af',
    borderBottom: '2px solid #1a2332',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '16px 12px',
    fontSize: '15px',
    color: 'white',
    borderBottom: '1px solid #1a2332',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>Contacts</h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', marginTop: '4px' }}>
            {filteredContacts.length} total contacts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadContacts}
            style={{ ...buttonStyle, backgroundColor: '#1a2332', color: 'white' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button style={{ ...buttonStyle, backgroundColor: '#00ff88', color: '#0f1623' }}>
            <Plus size={18} /> Add Contact
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '16px' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#ef4444" />
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={20} />
        <input
          type="text"
          placeholder="Search by name, email, company, or role..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            backgroundColor: '#0f1623',
            border: '2px solid #1a2332',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading contacts...</div>
        ) : paginatedContacts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>No contacts found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a2332' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Primary</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a2332')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: 'rgba(0, 255, 136, 0.1)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#00ff88',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}>
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <span style={{ fontWeight: '500' }}>{contact.name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                        <Mail size={14} />
                        {contact.email || '-'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                        <Phone size={14} />
                        {contact.phone || contact.mobile || '-'}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
                        <Building2 size={14} />
                        {contact.company}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#9ca3af' }}>{contact.role || '-'}</td>
                    <td style={tdStyle}>
                      {contact.isPrimary && (
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: 'rgba(0, 255, 136, 0.1)',
                          color: '#00ff88',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          Primary
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedContact(contact)}
                          style={{
                            ...buttonStyle,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            padding: '6px 12px',
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={(e) => handleDelete(contact.id, e)}
                          style={{
                            ...buttonStyle,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            padding: '6px 10px',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              ...buttonStyle,
              backgroundColor: currentPage === 1 ? '#1a2332' : '#00ff88',
              color: currentPage === 1 ? '#6b7280' : '#0f1623',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ color: 'white', fontSize: '16px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...buttonStyle,
              backgroundColor: currentPage === totalPages ? '#1a2332' : '#00ff88',
              color: currentPage === totalPages ? '#6b7280' : '#0f1623',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          onClick={() => setSelectedContact(null)}
        >
          <div
            style={{
              backgroundColor: '#0f1623',
              border: '2px solid #1a2332',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(0, 255, 136, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00ff88',
                  fontWeight: 'bold',
                  fontSize: '24px',
                }}>
                  {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>{selectedContact.name}</h2>
                  <p style={{ color: '#9ca3af', fontSize: '16px', margin: '4px 0 0' }}>{selectedContact.role || 'No role specified'}</p>
                  {selectedContact.isPrimary && (
                    <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 10px', backgroundColor: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', borderRadius: '12px', fontSize: '12px' }}>
                      Primary Contact
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '24px' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#1a2332', padding: '16px', borderRadius: '8px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Email</label>
                <div style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#00ff88" />
                  {selectedContact.email || '-'}
                </div>
              </div>
              <div style={{ backgroundColor: '#1a2332', padding: '16px', borderRadius: '8px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Phone</label>
                <div style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#00ff88" />
                  {selectedContact.phone || selectedContact.mobile || '-'}
                </div>
              </div>
              <div style={{ backgroundColor: '#1a2332', padding: '16px', borderRadius: '8px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Company</label>
                <div style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="#00ff88" />
                  {selectedContact.company}
                </div>
              </div>
              <div style={{ backgroundColor: '#1a2332', padding: '16px', borderRadius: '8px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Mobile</label>
                <div style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#00ff88" />
                  {selectedContact.mobile || '-'}
                </div>
              </div>
            </div>

            {selectedContact.notes && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>Notes</label>
                <div style={{ backgroundColor: '#1a2332', padding: '16px', borderRadius: '8px', color: 'white', fontSize: '15px' }}>
                  {selectedContact.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '14px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Mail size={18} /> Send Email
              </button>
              <button style={{ flex: 1, padding: '14px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                Edit Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
