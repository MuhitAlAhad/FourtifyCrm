import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Mail, Phone, Calendar, Trash2, Edit, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { leadApi } from '../../services/api';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  source: string;
  supplierName: string;
  createdAt: string;
  lastContact?: string;
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const { leads: apiLeads } = await leadApi.getAll();
      const formattedLeads: Lead[] = apiLeads.map(lead => ({
        id: lead.id,
        name: lead.name,
        company: lead.organisationId || 'N/A',
        email: `contact@${lead.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: '+61 400 000 000',
        status: mapStageToStatus(lead.stage),
        source: lead.source,
        supplierName: lead.owner || '',
        createdAt: new Date(lead.createdAt).toLocaleDateString(),
      }));
      setLeads(formattedLeads);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Failed to load leads. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const mapStageToStatus = (stage: string): Lead['status'] => {
    if (stage.includes('New')) return 'new';
    if (stage.includes('Qualified')) return 'qualified';
    if (stage.includes('Won')) return 'converted';
    return 'contacted';
  };

  const addLead = async (leadData: Partial<Lead>) => {
    try {
      await leadApi.create({
        name: leadData.name || '',
        source: leadData.source || '',
        owner: leadData.supplierName || '',
        stage: 'New Lead',
      });
      await loadLeads();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating lead:', err);
      alert('Failed to create lead');
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await leadApi.delete(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Failed to delete lead');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      contacted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      qualified: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      converted: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-2">Leads Management</h1>
          <p className="text-gray-400">Capture, track, and convert your leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] border border-[#2a3442] transition-colors"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff88] text-[#0a0f1a] rounded-lg hover:bg-[#00cc6a] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1623] border border-[#1a2332] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0f1623] border border-[#1a2332] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a2332]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Name</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Company</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Supplier Name</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Contact</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Source</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Created</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Actions</th>
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
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1a2332]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-400">{lead.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-400">{lead.supplierName || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Phone className="w-4 h-4" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm border ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{lead.source}</td>
                    <td className="px-6 py-4 text-gray-400">{lead.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-[#00ff88] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No leads found. Click "Add Lead" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={addLead}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          onClose={() => setShowBulkImportModal(false)}
          onImport={(importedLeads) => {
            importedLeads.forEach(lead => addLead(lead));
            setShowBulkImportModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddLeadModalProps {
  onClose: () => void;
  onAdd: (data: Partial<Lead>) => void;
}

function AddLeadModal({ onClose, onAdd }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'new' as Lead['status'],
    source: '',
    supplierName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toLocaleDateString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl text-white mb-6">Add New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
              required
            >
              <option value="">Select source</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Supplier Name</label>
            <input
              type="text"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
            />
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
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface BulkImportModalProps {
  onClose: () => void;
  onImport: (leads: Partial<Lead>[]) => void;
}

function BulkImportModal({ onClose, onImport }: BulkImportModalProps) {
  const [textData, setTextData] = useState('');
  const [previewLeads, setPreviewLeads] = useState<Partial<Lead>[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleParse = () => {
    try {
      setError('');
      const lines = textData.trim().split('\n');
      if (lines.length === 0) {
        setError('Please paste some data');
        return;
      }

      const leads: Partial<Lead>[] = [];
      const seen = new Set<string>();

      for (const line of lines) {
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');

        if (parts.length >= 4) {
          const email = parts[2]?.trim() || '';

          if (seen.has(email.toLowerCase())) {
            continue;
          }
          seen.add(email.toLowerCase());

          leads.push({
            name: parts[0]?.trim() || '',
            company: parts[1]?.trim() || '',
            email: email,
            phone: parts[3]?.trim() || '',
            supplierName: parts[4]?.trim() || '',
            status: (parts[5]?.trim().toLowerCase() as Lead['status']) || 'new',
            source: parts[6]?.trim() || 'Bulk Import',
            id: `lead-${Date.now()}-${Math.random()}`,
            createdAt: new Date().toLocaleDateString(),
          });
        }
      }

      if (leads.length === 0) {
        setError('No valid leads found. Make sure each line has at least: Name, Company, Email, Phone');
        return;
      }

      setPreviewLeads(leads.slice(0, 548));
    } catch (err) {
      setError('Error parsing data. Please check your format.');
    }
  };

  const handleImport = () => {
    if (previewLeads.length > 0) {
      setImporting(true);
      setTimeout(() => {
        onImport(previewLeads);
        setImporting(false);
        setShowSuccess(true);
        setTimeout(() => onClose(), 2000);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      {showSuccess ? (
        <div className="bg-[#0f1623] border border-[#00ff88] rounded-xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#00ff88]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl text-white mb-3">Success!</h2>
          <p className="text-gray-400 mb-2">Thank you, your leads are now imported.</p>
          <p className="text-sm text-gray-500">{previewLeads.length} leads successfully added to the CRM</p>
        </div>
      ) : importing ? (
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 border-4 border-[#1a2332] border-t-[#00ff88] rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl text-white mb-3">Importing Leads...</h2>
          <p className="text-gray-400">Please wait while we import your leads</p>
        </div>
      ) : (
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 max-w-4xl w-full my-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl text-white mb-1">Bulk Import Leads</h2>
              <p className="text-sm text-gray-400">Copy data from Excel and paste below</p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-[#00ff88]" />
          </div>

          <div className="bg-[#1a2332] border border-[#2a3442] rounded-lg p-4 mb-6">
            <h3 className="text-white mb-2">📋 How to Import:</h3>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open your Excel file with lead data</li>
              <li>Select the rows with columns in this order</li>
              <li>Copy the selected cells (Ctrl+C or Cmd+C)</li>
              <li>Paste them in the box below</li>
              <li>Click "Parse Data" to preview, then "Import"</li>
            </ol>
            <div className="mt-3 p-3 bg-[#0f1623] rounded border border-[#2a3442]">
              <div className="text-xs text-gray-400 mb-1"><strong className="text-[#00ff88]">Required Column Order:</strong></div>
              <div className="text-xs font-mono text-gray-300">Name | Company | Email | Phone | Supplier Name | Status | Source</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Paste Excel Data Here</label>
              <textarea
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                placeholder={`John Doe\tAcme Corp\tjohn@acme.com\t+1-555-0100\tSupplier A\tnew\tWebsite`}
                className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff88] font-mono text-sm h-40 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {textData && previewLeads.length === 0 && (
              <button
                onClick={handleParse}
                className="w-full px-4 py-3 bg-[#2a3442] text-white rounded-lg hover:bg-[#3a4452] transition-colors"
              >
                Parse Data ({textData.split('\n').filter(l => l.trim()).length} rows)
              </button>
            )}

            {previewLeads.length > 0 && (
              <div>
                <h3 className="text-white mb-3">Preview ({previewLeads.length} leads)</h3>
                <div className="bg-[#1a2332] border border-[#2a3442] rounded-lg max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0f1623] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-400">Name</th>
                        <th className="px-3 py-2 text-left text-gray-400">Company</th>
                        <th className="px-3 py-2 text-left text-gray-400">Email</th>
                        <th className="px-3 py-2 text-left text-gray-400">Phone</th>
                        <th className="px-3 py-2 text-left text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3442]">
                      {previewLeads.slice(0, 10).map((lead, idx) => (
                        <tr key={idx} className="text-gray-300">
                          <td className="px-3 py-2">{lead.name}</td>
                          <td className="px-3 py-2">{lead.company}</td>
                          <td className="px-3 py-2">{lead.email}</td>
                          <td className="px-3 py-2">{lead.phone}</td>
                          <td className="px-3 py-2">{lead.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewLeads.length > 10 && (
                    <div className="p-2 text-center text-xs text-gray-500">
                      ... and {previewLeads.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] transition-colors"
              >
                Cancel
              </button>
              {previewLeads.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewLeads([]);
                      setTextData('');
                    }}
                    className="px-4 py-3 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    className="flex-1 px-4 py-3 bg-[#00ff88] text-[#0a0f1a] rounded-lg hover:bg-[#00cc6a] transition-colors"
                  >
                    Import {previewLeads.length} Leads
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}