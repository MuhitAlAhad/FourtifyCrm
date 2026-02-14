import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, DollarSign, TrendingUp, Users, Calendar, Building2, User, Phone, Mail, ChevronRight, AlertCircle } from 'lucide-react';
import { leadApi, organisationApi, contactApi } from '../../services/api';
import { SortableHeader, SortConfig, toggleSort, sortData } from '../ui/SortableHeader';

// Pipeline stages as per requirements
const PIPELINE_STAGES = [
  'New Lead',
  'Qualified Lead',
  'Engaged – Under Discussion',
  'Proposal / Pricing Sent',
  'Security Assessment',
  'Awaiting Decision',
  'Contracting / Legal',
  'Closed Won',
  'Closed Lost',
  'On Hold',
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number];

interface Organisation {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  industry: string;
  size: string;
}

interface Contact {
  id: string;
  organisationId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface Lead {
  id: string;
  organisationId: string;
  contactId: string;
  name: string;
  stage: PipelineStage;
  expectedValue: number;
  probability: number;
  expectedCloseDate: string;
  owner: string;
  source: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

  const handleSort = (key: string) => {
    setSortConfig(prev => toggleSort(prev, key));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [leadsResponse, orgsResponse, contactsResponse] = await Promise.all([
        leadApi.getAll(),
        organisationApi.getAll(),
        contactApi.getAll(),
      ]);

      const formattedLeads: Lead[] = leadsResponse.leads.map(lead => ({
        id: lead.id,
        organisationId: lead.organisationId || '',
        contactId: lead.contactId || '',
        name: lead.name,
        stage: (lead.stage || 'New Lead') as PipelineStage,
        expectedValue: lead.expectedValue || 0,
        probability: lead.probability || 10,
        expectedCloseDate: lead.expectedCloseDate || '',
        owner: lead.owner || '',
        source: lead.source || '',
        description: lead.description || '',
        priority: (lead.priority || 'Medium') as Lead['priority'],
        tags: lead.tags || [],
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      }));

      setLeads(formattedLeads);
      setOrganisations(orgsResponse.organisations as unknown[] as Organisation[]);
      setContacts(contactsResponse.contacts as unknown[] as Contact[]);
    } catch (err) {
      console.error('Error loading pipeline data:', err);
      setError('Failed to load pipeline data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const addLead = (leadData: Partial<Lead>) => {
    const newLead: Lead = {
      id: `crm:lead:${Date.now()}`,
      organisationId: leadData.organisationId || '',
      contactId: leadData.contactId || '',
      name: leadData.name || '',
      stage: leadData.stage || 'New Lead',
      expectedValue: leadData.expectedValue || 0,
      probability: leadData.probability || 10,
      expectedCloseDate: leadData.expectedCloseDate || '',
      owner: leadData.owner || 'Sales Team',
      source: leadData.source || '',
      description: leadData.description || '',
      priority: leadData.priority || 'Medium',
      tags: leadData.tags || [],
      createdAt: new Date().toISOString(),
    };
    setLeads(prev => [...prev, newLead]);
    setShowCreateModal(false);
  };

  const updateLeadStage = (leadId: string, newStage: PipelineStage) => {
    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, stage: newStage, updatedAt: new Date().toISOString() } : lead
    ));
  };

  const getOrganisation = (orgId: string) => {
    return organisations.find(o => o.id === orgId);
  };

  const getContact = (contactId: string) => {
    return contacts.find(c => c.id === contactId);
  };

  const getStageColor = (stage: PipelineStage): string => {
    const colorMap: Record<PipelineStage, string> = {
      'New Lead': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Qualified Lead': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'Engaged – Under Discussion': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Proposal / Pricing Sent': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'Security Assessment': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Awaiting Decision': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'Contracting / Legal': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Closed Won': 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
      'Closed Lost': 'bg-red-500/10 text-red-400 border-red-500/20',
      'On Hold': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colorMap[stage];
  };

  const getPriorityColor = (priority: string): string => {
    const colorMap: Record<string, string> = {
      'Low': 'bg-gray-500/10 text-gray-400',
      'Medium': 'bg-blue-500/10 text-blue-400',
      'High': 'bg-orange-500/10 text-orange-400',
      'Critical': 'bg-red-500/10 text-red-400',
    };
    return colorMap[priority] || colorMap['Low'];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };


  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(lead => {
      const org = getOrganisation(lead.organisationId);
      const contact = getContact(lead.contactId);
      const searchLower = searchQuery.toLowerCase();

      return (
        lead.name?.toLowerCase().includes(searchLower) ||
        org?.name?.toLowerCase().includes(searchLower) ||
        contact?.firstName?.toLowerCase().includes(searchLower) ||
        contact?.lastName?.toLowerCase().includes(searchLower)
      );
    });
    return sortData(filtered, sortConfig, (lead, key) => {
      switch (key) {
        case 'name': return lead.name || '';
        case 'organisation': return getOrganisation(lead.organisationId)?.name || '';
        case 'contact': {
          const c = getContact(lead.contactId);
          return c ? `${c.firstName} ${c.lastName}` : '';
        }
        case 'stage': return PIPELINE_STAGES.indexOf(lead.stage);
        case 'value': return lead.expectedValue || 0;
        case 'probability': return lead.probability || 0;
        case 'owner': return lead.owner || '';
        case 'priority': {
          const order: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return order[lead.priority || 'Low'] || 0;
        }
        default: return '';
      }
    });
  }, [leads, searchQuery, sortConfig, organisations, contacts]);

  // Calculate pipeline stats
  const totalValue = leads.reduce((sum, lead) => sum + (lead.expectedValue || 0), 0);
  const totalWeightedValue = leads.reduce((sum, lead) => {
    return sum + (lead.expectedValue || 0) * ((lead.probability || 0) / 100);
  }, 0);
  const activeLeads = leads.filter(l => l.stage !== 'Closed Won' && l.stage !== 'Closed Lost').length;
  const closedWon = leads.filter(l => l.stage === 'Closed Won').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-2">Sales Pipeline</h1>
          <p className="text-gray-400">Manage opportunities and track deal progression</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-[#0a0f1a] rounded-lg hover:bg-[#00cc6a] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Pipeline Value</span>
            <DollarSign className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-2xl text-white">{formatCurrency(totalValue)}</div>
        </div>

        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Weighted Value</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl text-white">{formatCurrency(totalWeightedValue)}</div>
        </div>

        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Active Opportunities</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl text-white">{activeLeads}</div>
        </div>

        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Closed Won</span>
            <TrendingUp className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-2xl text-white">{closedWon}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search leads by name, organisation, or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0f1623] border border-[#1a2332] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
        />
      </div>

      {/* Leads Table */}
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a2332]">
              <tr>
                <SortableHeader label="Lead Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Organisation" sortKey="organisation" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Contact" sortKey="contact" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Stage" sortKey="stage" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Value" sortKey="value" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Probability" sortKey="probability" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Owner" sortKey="owner" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
                <SortableHeader label="Priority" sortKey="priority" currentSort={sortConfig} onSort={handleSort} variant="tailwind" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2332]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-12 bg-[#1a2332] rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const org = getOrganisation(lead.organisationId);
                  const contact = getContact(lead.contactId);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#1a2332]/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-white">{lead.name || '-'}</div>
                        <div className="text-xs text-gray-500">{lead.source}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Building2 className="w-4 h-4" />
                          {org?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400">
                          {contact ? `${contact.firstName} ${contact.lastName}` : '-'}
                        </div>
                        <div className="text-xs text-gray-500">{contact?.jobTitle || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.stage}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateLeadStage(lead.id, e.target.value as PipelineStage);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-1 rounded-lg text-sm border ${getStageColor(lead.stage)} bg-transparent cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          {PIPELINE_STAGES.map(stage => (
                            <option key={stage} value={stage} className="bg-[#0f1623] text-white">
                              {stage}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {formatCurrency(lead.expectedValue || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#1a2332] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-[#00ff88] transition-all"
                              style={{ width: `${lead.probability || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400 w-10">{lead.probability || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <User className="w-4 h-4" />
                          {lead.owner || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs ${getPriorityColor(lead.priority || 'Low')}`}>
                          {lead.priority || 'Low'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No leads found. Create your first opportunity to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <CreateLeadModal
          organisations={organisations}
          contacts={contacts}
          onClose={() => setShowCreateModal(false)}
          onAdd={addLead}
        />
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          organisation={getOrganisation(selectedLead.organisationId)}
          contact={getContact(selectedLead.contactId)}
          onClose={() => setSelectedLead(null)}
          onUpdate={(leadId, newStage) => updateLeadStage(leadId, newStage)}
        />
      )}
    </div>
  );
}

interface CreateLeadModalProps {
  organisations: Organisation[];
  contacts: Contact[];
  onClose: () => void;
  onAdd: (leadData: Partial<Lead>) => void;
}

function CreateLeadModal({ organisations, contacts, onClose, onAdd }: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    organisationId: '',
    contactId: '',
    stage: 'New Lead' as PipelineStage,
    expectedValue: '',
    probability: '10',
    expectedCloseDate: '',
    owner: 'Sales Team',
    source: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    tags: '',
  });

  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (formData.organisationId) {
      const filtered = contacts.filter(c => c.organisationId === formData.organisationId);
      setAvailableContacts(filtered);
      if (filtered.length > 0 && !formData.contactId) {
        setFormData(prev => ({ ...prev, contactId: filtered[0].id }));
      }
    } else {
      setAvailableContacts([]);
    }
  }, [formData.organisationId, contacts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      expectedValue: parseFloat(formData.expectedValue) || 0,
      probability: parseInt(formData.probability) || 10,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 max-w-2xl w-full my-8">
        <h2 className="text-2xl text-white mb-6">Create New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Lead Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="e.g., Defence Enterprise Deal"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Organisation *</label>
              <select
                value={formData.organisationId}
                onChange={(e) => setFormData({ ...formData, organisationId: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                required
              >
                <option value="">Select organisation</option>
                {organisations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Contact *</label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                required
                disabled={!formData.organisationId}
              >
                <option value="">Select contact</option>
                {availableContacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} - {contact.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Expected Value (AUD) *</label>
              <input
                type="number"
                value={formData.expectedValue}
                onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Expected Close Date *</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as PipelineStage })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              >
                {PIPELINE_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              >
                <option value="">Select source</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Event">Event</option>
                <option value="Partner">Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="Sales Team"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                placeholder="DISP, Enterprise"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88] h-24 resize-none"
                placeholder="Describe the opportunity..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#00ff88] text-[#0a0f1a] rounded-lg hover:bg-[#00cc6a] transition-colors"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LeadDetailModalProps {
  lead: Lead;
  organisation?: Organisation;
  contact?: Contact;
  onClose: () => void;
  onUpdate: (leadId: string, newStage: PipelineStage) => void;
}

function LeadDetailModal({ lead, organisation, contact, onClose, onUpdate }: LeadDetailModalProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 max-w-3xl w-full my-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl text-white mb-2">{lead.name}</h2>
            <p className="text-gray-400">Lead Details</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Organisation</label>
              <div className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00ff88]" />
                {organisation?.name || '-'}
              </div>
              {organisation?.website && (
                <a href={organisation.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#00ff88] hover:underline">
                  {organisation.website}
                </a>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact</label>
              <div className="text-white">
                {contact ? `${contact.firstName} ${contact.lastName}` : '-'}
              </div>
              {contact && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </div>
                  <div className="text-sm text-gray-500">{contact.jobTitle}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Value</label>
              <div className="text-2xl text-[#00ff88]">{formatCurrency(lead.expectedValue || 0)}</div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Probability</label>
              <div className="text-white">{lead.probability || 0}%</div>
              <div className="mt-2 bg-[#1a2332] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[#00ff88] transition-all"
                  style={{ width: `${lead.probability || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Close Date</label>
              <div className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {lead.expectedCloseDate || '-'}
              </div>
            </div>
          </div>

          <div className="col-span-2 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <div className="text-gray-300">{lead.description || 'No description provided'}</div>
            </div>

            {lead.tags && lead.tags.length > 0 && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-lg text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1a2332]">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Source</label>
                <div className="text-white">{lead.source || '-'}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Owner</label>
                <div className="text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {lead.owner || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Priority</label>
                <div className="text-white">{lead.priority || 'Low'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6 mt-6 border-t border-[#1a2332]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
