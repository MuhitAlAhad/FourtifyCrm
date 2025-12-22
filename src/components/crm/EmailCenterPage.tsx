import React, { useState, useEffect } from 'react';
import { Send, Mail, Clock, CheckCircle, AlertCircle, Search, RefreshCw, User, Building2, X, FileText, Users, BarChart3, Plus, Trash2, Edit } from 'lucide-react';
import { emailApi, templateApi, SentEmail, EmailContact, EmailTemplate } from '../../services/api';

type Tab = 'compose' | 'bulkSend' | 'templates' | 'campaigns' | 'history';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  sentAt?: string;
}

export function EmailCenterPage() {
  const [activeTab, setActiveTab] = useState<Tab>('compose');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Compose form state
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<EmailContact | null>(null);
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Bulk send state
  const [allContacts, setAllContacts] = useState<EmailContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // History state
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'compose' && (showContactPicker || contactSearch)) {
      loadContacts();
    } else if (activeTab === 'bulkSend') {
      loadAllContacts();
    } else if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, contactSearch, showContactPicker, stateFilter]);

  const loadContacts = async () => {
    try {
      const data = await emailApi.getContacts(contactSearch, 20);
      setContacts(data.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const loadAllContacts = async () => {
    setLoading(true);
    try {
      const data = await emailApi.getContacts('', 500, stateFilter || undefined);
      setAllContacts(data.contacts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateApi.getAll();
      setTemplates(data.templates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await emailApi.getCampaigns();
      setCampaigns(data.campaigns);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await emailApi.getHistory(50);
      setSentEmails(data.emails);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectContact = (contact: EmailContact) => {
    setSelectedContact(contact);
    setToEmail(contact.email);
    setToName(`${contact.firstName} ${contact.lastName}`);
    setShowContactPicker(false);
    setContactSearch('');
  };

  const clearRecipient = () => {
    setSelectedContact(null);
    setToEmail('');
    setToName('');
  };

  const handleSend = async () => {
    if (!toEmail || !subject || !body) {
      setError('Please fill in recipient email, subject, and message');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await emailApi.send({
        toEmail,
        toName,
        subject,
        body,
        contactId: selectedContact?.id,
        organisationId: selectedContact?.organisationId,
      });

      if (result.success) {
        setSuccess(`Email sent successfully to ${toEmail}!`);
        clearRecipient();
        setSubject('');
        setBody('');
      } else {
        setError(result.message || 'Failed to send email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSend = async () => {
    if (selectedContactIds.size === 0) {
      setError('Please select at least one contact');
      return;
    }
    if (!bulkSubject || !bulkBody) {
      setError('Please fill in subject and message');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await emailApi.bulkSend({
        contactIds: Array.from(selectedContactIds),
        subject: bulkSubject,
        body: bulkBody,
        campaignName: campaignName || undefined,
      });

      if (result.success) {
        setSuccess(`${result.message}${result.campaignId ? ' - Campaign created!' : ''}`);
        setSelectedContactIds(new Set());
        setBulkSubject('');
        setBulkBody('');
        setCampaignName('');
      } else {
        setError(result.message || 'Failed to send emails');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const toggleContactSelection = (id: string) => {
    const newSet = new Set(selectedContactIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContactIds(newSet);
  };

  const selectAllContacts = () => {
    if (selectedContactIds.size === allContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(allContacts.map(c => c.id)));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateSubject || !templateBody) {
      setError('Please fill in all template fields');
      return;
    }

    try {
      if (editingTemplate) {
        await templateApi.update(editingTemplate.id, {
          name: templateName,
          subject: templateSubject,
          body: templateBody,
        });
        setSuccess('Template updated!');
      } else {
        await templateApi.create({
          name: templateName,
          subject: templateSubject,
          body: templateBody,
        });
        setSuccess('Template created!');
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateSubject('');
      setTemplateBody('');
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await templateApi.delete(id);
      setSuccess('Template deleted');
      loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    }
  };

  const useTemplate = (template: EmailTemplate) => {
    if (activeTab === 'compose') {
      setSubject(template.subject);
      setBody(template.body);
    } else if (activeTab === 'bulkSend') {
      setBulkSubject(template.subject);
      setBulkBody(template.body);
    }
    setSuccess(`Template "${template.name}" applied!`);
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setShowTemplateModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={18} color="#00ff88" />;
      case 'opened':
      case 'clicked':
        return <CheckCircle size={18} color="#3b82f6" />;
      case 'failed':
      case 'bounced':
        return <AlertCircle size={18} color="#ef4444" />;
      default:
        return <Clock size={18} color="#6b7280" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const tabStyle = (tab: Tab) => ({
    padding: '12px 20px',
    backgroundColor: activeTab === tab ? '#00ff88' : '#1a2332',
    color: activeTab === tab ? '#0f1623' : 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: '#1a2332',
    border: '2px solid #2a3442',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(0, 255, 136, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={28} color="#00ff88" />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', margin: 0 }}>Email Center</h1>
            <p style={{ color: '#9ca3af', fontSize: '16px', margin: '4px 0 0' }}>Send emails, manage templates, and track campaigns</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #1a2332', paddingBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('compose')} style={tabStyle('compose')}>
          <Send size={18} /> Compose
        </button>
        <button onClick={() => setActiveTab('bulkSend')} style={tabStyle('bulkSend')}>
          <Users size={18} /> Bulk Send
        </button>
        <button onClick={() => setActiveTab('templates')} style={tabStyle('templates')}>
          <FileText size={18} /> Templates
        </button>
        <button onClick={() => setActiveTab('campaigns')} style={tabStyle('campaigns')}>
          <BarChart3 size={18} /> Campaigns
        </button>
        <button onClick={() => setActiveTab('history')} style={tabStyle('history')}>
          <Clock size={18} /> History
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '16px' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#ef4444" />
          </button>
        </div>
      )}
      {success && (
        <div style={{ padding: '16px', backgroundColor: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={20} color="#00ff88" />
          <span style={{ color: '#00ff88', fontSize: '16px' }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="#00ff88" />
          </button>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '24px' }}>Compose Email</h2>

          {/* Recipient */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Recipient</label>
            {selectedContact ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#1a2332', borderRadius: '8px' }}>
                <User size={20} color="#00ff88" />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '500' }}>{toName}</div>
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>{toEmail}</div>
                </div>
                <button onClick={clearRecipient} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} color="#9ca3af" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowContactPicker(!showContactPicker)}
                  style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer' }}
                >
                  <Search size={18} style={{ marginRight: '8px', opacity: 0.5 }} />
                  Search contacts or enter email...
                </button>
                {showContactPicker && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Type to search..."
                      style={inputStyle}
                      autoFocus
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => selectContact(contact)}
                          style={{ padding: '12px', backgroundColor: '#1a2332', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer' }}
                        >
                          <div style={{ color: 'white' }}>{contact.firstName} {contact.lastName}</div>
                          <div style={{ color: '#9ca3af', fontSize: '14px' }}>{contact.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="Or enter email directly"
                  style={{ ...inputStyle, marginTop: '8px' }}
                />
              </div>
            )}
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              style={inputStyle}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: '14px 32px',
              backgroundColor: sending ? '#6b7280' : '#00ff88',
              color: '#0f1623',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Send size={20} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      )}

      {/* Bulk Send Tab */}
      {activeTab === 'bulkSend' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Contact Selection */}
          <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', color: 'white', margin: 0 }}>Select Recipients ({selectedContactIds.size} selected)</h2>
              <button onClick={selectAllContacts} style={{ padding: '8px 16px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                {selectedContactIds.size === allContacts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{ ...inputStyle, marginBottom: '16px' }}
            >
              <option value="">All States</option>
              <option value="NSW">NSW</option>
              <option value="VIC">VIC</option>
              <option value="QLD">QLD</option>
              <option value="WA">WA</option>
              <option value="SA">SA</option>
              <option value="TAS">TAS</option>
              <option value="NT">NT</option>
              <option value="ACT">ACT</option>
            </select>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading contacts...</div>
              ) : (
                allContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => toggleContactSelection(contact.id)}
                    style={{
                      padding: '12px',
                      backgroundColor: selectedContactIds.has(contact.id) ? 'rgba(0, 255, 136, 0.1)' : '#1a2332',
                      border: selectedContactIds.has(contact.id) ? '1px solid #00ff88' : '1px solid transparent',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.id)}
                        onChange={() => { }}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ color: 'white', fontWeight: '500' }}>{contact.firstName} {contact.lastName}</div>
                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>{contact.email}</div>
                        {contact.organisationName && (
                          <div style={{ color: '#6b7280', fontSize: '12px' }}>{contact.organisationName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Compose */}
          <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '16px' }}>Compose Bulk Email</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Campaign Name (optional)</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., December Newsletter"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Subject</label>
              <input
                type="text"
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
                placeholder="Email subject (use {{firstName}} for personalization)"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Message</label>
              <textarea
                value={bulkBody}
                onChange={(e) => setBulkBody(e.target.value)}
                placeholder="Hi {{firstName}},&#10;&#10;Write your message here..."
                rows={10}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
                Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{jobTitle}}'}
              </p>
            </div>

            <button
              onClick={handleBulkSend}
              disabled={sending || selectedContactIds.size === 0}
              style={{
                padding: '14px 32px',
                backgroundColor: sending || selectedContactIds.size === 0 ? '#6b7280' : '#00ff88',
                color: '#0f1623',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: sending || selectedContactIds.size === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={20} />
              {sending ? 'Sending...' : `Send to ${selectedContactIds.size} Contact${selectedContactIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'white', margin: 0 }}>Email Templates</h2>
            <button
              onClick={() => { setShowTemplateModal(true); setEditingTemplate(null); }}
              style={{ padding: '12px 24px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> New Template
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No templates yet. Create one to get started!</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {templates.map((template) => (
                <div key={template.id} style={{ backgroundColor: '#1a2332', borderRadius: '12px', padding: '20px' }}>
                  <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>{template.name}</h3>
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}><strong>Subject:</strong> {template.subject}</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px', maxHeight: '60px', overflow: 'hidden' }}>{template.body.substring(0, 100)}...</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => useTemplate(template)} style={{ flex: 1, padding: '8px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Use</button>
                    <button onClick={() => editTemplate(template)} style={{ padding: '8px 12px', backgroundColor: '#1a2332', color: 'white', border: '1px solid #2a3442', borderRadius: '6px', cursor: 'pointer' }}><Edit size={16} /></button>
                    <button onClick={() => handleDeleteTemplate(template.id)} style={{ padding: '8px 12px', backgroundColor: '#1a2332', color: '#ef4444', border: '1px solid #2a3442', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Modal */}
          {showTemplateModal && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
              <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '24px' }}>{editingTemplate ? 'Edit Template' : 'New Template'}</h2>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Template Name</label>
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Welcome Email" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Subject</label>
                  <input type="text" value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="Email subject" style={inputStyle} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Body</label>
                  <textarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} placeholder="Email body (use {{firstName}}, etc.)" rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); }} style={{ padding: '12px 24px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveTemplate} style={{ padding: '12px 24px', backgroundColor: '#00ff88', color: '#0f1623', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>{editingTemplate ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'white', margin: 0 }}>Campaign Analytics</h2>
            <button onClick={loadCampaigns} style={{ padding: '8px 16px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No campaigns yet. Send a bulk email with a campaign name to create one!</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a3442' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Campaign</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Sent</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Opened</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Clicked</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Bounced</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#9ca3af', fontSize: '14px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid #1a2332' }}>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ color: 'white', fontWeight: '500' }}>{campaign.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '13px' }}>{campaign.subject}</div>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', backgroundColor: campaign.status === 'sent' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(234, 179, 8, 0.1)', color: campaign.status === 'sent' ? '#00ff88' : '#eab308', borderRadius: '12px', fontSize: '13px' }}>
                          {campaign.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', color: 'white' }}>{campaign.sentCount}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span style={{ color: '#3b82f6' }}>{campaign.openedCount}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}> ({campaign.openRate}%)</span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span style={{ color: '#00ff88' }}>{campaign.clickedCount}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}> ({campaign.clickRate}%)</span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', color: '#ef4444' }}>{campaign.bouncedCount}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', color: '#9ca3af', fontSize: '14px' }}>{formatDate(campaign.sentAt || campaign.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ backgroundColor: '#0f1623', border: '2px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', color: 'white', margin: 0 }}>Sent Emails</h2>
            <button onClick={loadHistory} style={{ padding: '8px 16px', backgroundColor: '#1a2332', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {historyLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : sentEmails.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No emails sent yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a3442' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Recipient</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '14px' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#9ca3af', fontSize: '14px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sentEmails.map((email) => (
                    <tr key={email.id} style={{ borderBottom: '1px solid #1a2332' }}>
                      <td style={{ padding: '16px 12px' }}>{getStatusIcon(email.status)}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ color: 'white' }}>{email.toName || email.toEmail}</div>
                        {email.toName && <div style={{ color: '#6b7280', fontSize: '13px' }}>{email.toEmail}</div>}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#9ca3af' }}>{email.subject}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>{formatDate(email.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
