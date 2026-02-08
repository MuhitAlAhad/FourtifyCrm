import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Building2, Eye, Trash2, X, AlertCircle, RefreshCw, Clock, User } from 'lucide-react';
import { contactApi, organisationApi, ContactActivity } from '../../services/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/ConfirmDialog';

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
  status?: string;
}

interface ContactsPageProps {
  onNavigate?: (page: string) => void;
  onSendEmail?: (email: string, name: string) => void;
}

export function ContactsPage({ onNavigate, onSendEmail }: ContactsPageProps = {}) {
  const [contacts, setContacts] = useState<ContactDisplay[]>([]);
  const [organisations, setOrganisations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactDisplay | null>(null);
  const [contactActivities, setContactActivities] = useState<ContactActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    role: '',
    organisationId: '',
    organisationAbn: '',
    isPrimary: false,
    notes: '',
    linkedin: '',
    status: 'new',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadContactActivities(selectedContact.id);
    }
  }, [selectedContact]);

  const loadContactActivities = async (contactId: string) => {
    try {
      setLoadingActivities(true);
      const response = await contactApi.getActivities(contactId);
      setContactActivities(response.activities || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activity log');
      setContactActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

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
          status: contact.status || 'new',
        };
      });
      setOrganisations(orgsResponse.organisations.map(o => ({ id: o.id, name: o.name })));
      // Sort by creation date descending (newest first)
      const sortedContacts = formattedContacts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setContacts(sortedContacts);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Contact',
      message: 'Are you sure you want to delete this contact? This action cannot be undone.',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting contact...');
        try {
          await contactApi.delete(id);
          setContacts(contacts.filter(c => c.id !== id));
          toast.success('Contact deleted successfully', { id: loadingToast });
        } catch (err) {
          console.error('Error deleting contact:', err);
          toast.error('Failed to delete contact', { id: loadingToast });
        }
      },
    });
  };

  const openEditModal = (contact: ContactDisplay) => {
    setEditContactId(contact.id);
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      role: contact.role,
      organisationId: contact.company,
      organisationAbn: '',
      isPrimary: contact.isPrimary,
      notes: contact.notes,
      linkedin: contact.linkedin,
      status: contact.status || 'new',
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Creating contact...');
    try {
      // Find or create organisation
      let orgId = editForm.organisationId;
      
      if (orgId && !orgId.startsWith('org:')) {
        // It's a name, not an ID - find or create the organisation
        const existingOrg = organisations.find(o => o.name.toLowerCase() === orgId.toLowerCase());
        
        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          // Create new organisation
          const newOrg = await organisationApi.create({ 
            name: orgId,
            abn: editForm.organisationAbn || ''
          });
          orgId = newOrg.id;
          // Refresh organisations list
          const orgsResponse = await organisationApi.getAll();
          setOrganisations(orgsResponse.organisations.map(o => ({ id: o.id, name: o.name })));
        }
      }
      
      const created = await contactApi.create({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        mobile: editForm.mobile,
        jobTitle: editForm.role,
        organisationId: orgId,
        isPrimary: editForm.isPrimary,
        notes: editForm.notes,
        linkedIn: editForm.linkedin,
        status: editForm.status,
      });

      await loadContacts();
      toast.success('Contact created successfully', { id: loadingToast });
      setShowAddModal(false);
      setEditForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        role: '',
        organisationId: '',
        organisationAbn: '',
        isPrimary: false,
        notes: '',
        linkedin: '',
        status: 'new',
      });
    } catch (err) {
      console.error('Error creating contact:', err);
      toast.error('Failed to create contact', { id: loadingToast });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContactId) return;
    const loadingToast = toast.loading('Updating contact...');
    try {
      // Find or create organisation
      let orgId = editForm.organisationId;
      
      if (orgId && !orgId.startsWith('org:')) {
        // It's a name, not an ID - find or create the organisation
        const existingOrg = organisations.find(o => o.name.toLowerCase() === orgId.toLowerCase());
        
        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          // Create new organisation
          const newOrg = await organisationApi.create({ 
            name: orgId,
            abn: editForm.organisationAbn || ''
          });
          orgId = newOrg.id;
          // Refresh organisations list
          const orgsResponse = await organisationApi.getAll();
          setOrganisations(orgsResponse.organisations.map(o => ({ id: o.id, name: o.name })));
        }
      }
      
      const updated = await contactApi.update(editContactId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        mobile: editForm.mobile,
        jobTitle: editForm.role,
        organisationId: orgId,
        isPrimary: editForm.isPrimary,
        notes: editForm.notes,
        linkedIn: editForm.linkedin,
        status: editForm.status,
      });

      const orgName = organisations.find(o => o.id === orgId)?.name || editForm.organisationId || 'Unknown';
      const updatedDisplay: ContactDisplay = {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        name: `${updated.firstName} ${updated.lastName}`,
        email: updated.email,
        phone: updated.phone || '',
        mobile: updated.mobile || '',
        company: orgName,
        companyId: updated.organisationId || orgId,
        role: updated.jobTitle || '',
        isPrimary: updated.isPrimary || false,
        notes: updated.notes || '',
        linkedin: updated.linkedIn || '',
        createdAt: updated.createdAt || '',
        status: updated.status || 'new',
      };

      setContacts(prev => prev.map(c => (c.id === editContactId ? updatedDisplay : c)));
      setSelectedContact(prev => (prev && prev.id === editContactId ? updatedDisplay : prev));
      toast.success('Contact updated successfully', { id: loadingToast });
      setShowEditModal(false);
      setEditContactId(null);
    } catch (err) {
      console.error('Error updating contact:', err);
      toast.error('Failed to update contact', { id: loadingToast });
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
          <button 
            onClick={() => {
              setEditForm({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                mobile: '',
                role: '',
                organisationId: '',
                isPrimary: false,
                notes: '',
                linkedin: '',
                status: 'new',
              });
              setShowAddModal(true);
            }}
            style={{ ...buttonStyle, backgroundColor: '#00ff88', color: '#0f1623' }}
          >
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
                  <th style={thStyle}>Status</th>
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
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: 
                          contact.status === 'converted' ? 'rgba(139, 92, 246, 0.1)' :
                          contact.status === 'qualified' ? 'rgba(59, 130, 246, 0.1)' :
                          contact.status === 'contacted' ? 'rgba(234, 179, 8, 0.1)' :
                          'rgba(107, 114, 128, 0.1)',
                        color: 
                          contact.status === 'converted' ? '#a78bfa' :
                          contact.status === 'qualified' ? '#3b82f6' :
                          contact.status === 'contacted' ? '#eab308' :
                          '#9ca3af',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}>
                        {contact.status || 'new'}
                      </span>
                    </td>
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
              <div style={{ backgroundColor: '#1a2332', padding: '16px', borderRadius: '8px' }}>
                <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Status</label>
                <div style={{ color: 'white', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: 
                      selectedContact.status === 'converted' ? 'rgba(139, 92, 246, 0.2)' :
                      selectedContact.status === 'qualified' ? 'rgba(59, 130, 246, 0.2)' :
                      selectedContact.status === 'contacted' ? 'rgba(234, 179, 8, 0.2)' :
                      'rgba(107, 114, 128, 0.2)',
                    color: 
                      selectedContact.status === 'converted' ? '#a78bfa' :
                      selectedContact.status === 'qualified' ? '#3b82f6' :
                      selectedContact.status === 'contacted' ? '#eab308' :
                      '#9ca3af',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                  }}>
                    {selectedContact.status || 'new'}
                  </span>
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

            {/* Activity Log */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>Activity Log</label>
              <div style={{ backgroundColor: '#1a2332', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {loadingActivities ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading activity log...</div>
                ) : contactActivities.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No activity recorded yet</div>
                ) : (
                  <div style={{ padding: '12px' }}>
                    {contactActivities.map((activity) => (
                      <div key={activity.id} style={{ 
                        padding: '12px', 
                        marginBottom: '8px', 
                        backgroundColor: '#0f1623', 
                        borderRadius: '6px',
                        borderLeft: '3px solid ' + (activity.activityType === 'StatusChanged' ? '#00ff88' : activity.activityType === 'Created' ? '#3b82f6' : '#9ca3af')
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: activity.activityType === 'StatusChanged' ? 'rgba(0, 255, 136, 0.1)' : activity.activityType === 'Created' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                              color: activity.activityType === 'StatusChanged' ? '#00ff88' : activity.activityType === 'Created' ? '#3b82f6' : '#9ca3af',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                            }}>
                              {activity.activityType}
                            </span>
                            {activity.fieldName && (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>• {activity.fieldName}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '11px' }}>
                            <Clock size={12} />
                            {new Date(activity.createdAt).toLocaleString('en-AU', { 
                              dateStyle: 'short', 
                              timeStyle: 'short' 
                            })}
                          </div>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: '13px', marginBottom: '6px' }}>
                          {activity.description}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '11px' }}>
                          <User size={12} />
                          {activity.userName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  if (onSendEmail && selectedContact) {
                    onSendEmail(selectedContact.email, selectedContact.name);
                  }
                }}
                style={{ flex: 1, padding: '14px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Mail size={18} /> Send Email
              </button>
              <button
                onClick={() => {
                  if (selectedContact) {
                    openEditModal(selectedContact);
                    setSelectedContact(null);
                  }
                }}
                style={{ flex: 1, padding: '14px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Edit Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0f1623',
              border: '2px solid #1a2332',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: 'white', marginTop: 0, marginBottom: '16px' }}>Add New Contact</h2>
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>First Name *</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Last Name *</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Role</label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Mobile</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Organisation</label>
                  <input
                    type="text"
                    value={editForm.organisationId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, organisationId: e.target.value }))}
                    placeholder="Enter organisation name"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Organisation ABN</label>
                  <input
                    type="text"
                    value={editForm.organisationAbn}
                    onChange={(e) => setEditForm(prev => ({ ...prev, organisationAbn: e.target.value }))}
                    placeholder="Enter ABN (optional)"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>LinkedIn</label>
                  <input
                    type="text"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="add-primary-contact"
                    type="checkbox"
                    checked={editForm.isPrimary}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  />
                  <label htmlFor="add-primary-contact" style={{ color: '#9ca3af', fontSize: '13px' }}>Primary contact</label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0f1623',
              border: '2px solid #1a2332',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: 'white', marginTop: 0, marginBottom: '16px' }}>Edit Contact</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Role</label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Mobile</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Organisation</label>
                  <input
                    type="text"
                    value={editForm.organisationId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, organisationId: e.target.value }))}
                    placeholder="Enter organisation name"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Organisation ABN</label>
                  <input
                    type="text"
                    value={editForm.organisationAbn}
                    onChange={(e) => setEditForm(prev => ({ ...prev, organisationAbn: e.target.value }))}
                    placeholder="Enter ABN (optional)"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>LinkedIn</label>
                  <input
                    type="text"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="primary-contact"
                    type="checkbox"
                    checked={editForm.isPrimary}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  />
                  <label htmlFor="primary-contact" style={{ color: '#9ca3af', fontSize: '13px' }}>Primary contact</label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a2332', border: '1px solid #2a3442', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
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
        variant="danger"
      />
    </div>
  );
}
