import React, { useState, useEffect } from 'react';
import { Search, Shield, Building2, DollarSign, Calendar, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { clientApi, Client, CreateClientRequest } from '../../services/api';
import api from '../../services/api';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [organisations, setOrganisations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<CreateClientRequest>({
    organisationId: '',
    plan: 'Professional',
    status: 'onboarding',
    mrr: 0,
    dispCompliant: false,
    notes: '',
  });

  useEffect(() => {
    loadClients();
    loadOrganisations();
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientApi.getAll();
      setClients(response.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganisations = async () => {
    try {
      const response = await api.organisations.getAll();
      setOrganisations(response.organisations || []);
    } catch (error) {
      console.error('Failed to load organisations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientApi.update(editingClient.id, formData);
      } else {
        await clientApi.create(formData);
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      organisationId: client.organisationId,
      plan: client.plan,
      status: client.status,
      mrr: client.mrr,
      contractStart: client.contractStart,
      contractEnd: client.contractEnd,
      dispCompliant: client.dispCompliant,
      notes: client.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await clientApi.delete(id);
      loadClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      organisationId: '',
      plan: 'Professional',
      status: 'onboarding',
      mrr: 0,
      dispCompliant: false,
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
      onboarding: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      churned: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || colors.active;
  };

  const filteredClients = clients.filter(client => {
    const name = client.organisationName || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalMRR = clients
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + c.mrr, 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-gray-400">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-white mb-2">Client Management</h1>
          <p className="text-gray-400">Manage your defence industry clients</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingClient(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#00ff88] text-[#0a0f1a] px-4 py-2 rounded-lg hover:bg-[#00cc6a] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Active Clients</span>
            <Building2 className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-3xl text-white">{clients.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total MRR</span>
            <DollarSign className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-3xl text-white">${totalMRR.toLocaleString()}</div>
        </div>
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">DISP Compliant</span>
            <Shield className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-3xl text-white">{clients.filter(c => c.dispCompliant).length}</div>
        </div>
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Onboarding</span>
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl text-white">{clients.filter(c => c.status === 'onboarding').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1623] border border-[#1a2332] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0f1623] border border-[#1a2332] rounded-lg px-4 py-2 text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a2332]">
            <tr>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Organisation</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Plan</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Status</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">MRR</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">DISP</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Contract</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {clients.length === 0 ? 'No clients yet. Add your first client!' : 'No clients match your search.'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-t border-[#1a2332] hover:bg-[#1a2332]/50">
                  <td className="px-6 py-4 text-white font-medium">{client.organisationName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-300">{client.plan}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs border capitalize ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#00ff88] font-medium">${client.mrr.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {client.dispCompliant ? (
                      <Shield className="w-5 h-5 text-[#00ff88]" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {client.contractStart ? new Date(client.contractStart).toLocaleDateString() : '-'}
                    {client.contractEnd && ` - ${new Date(client.contractEnd).toLocaleDateString()}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(client)} className="p-2 text-gray-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Organisation *</label>
                <select
                  value={formData.organisationId}
                  onChange={(e) => setFormData({ ...formData, organisationId: e.target.value })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  required
                  disabled={!!editingClient}
                >
                  <option value="">Select Organisation</option>
                  {organisations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="onboarding">Onboarding</option>
                    <option value="active">Active</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Monthly Recurring Revenue ($)</label>
                <input
                  type="number"
                  value={formData.mrr || ''}
                  onChange={(e) => setFormData({ ...formData, mrr: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Contract Start</label>
                  <input
                    type="date"
                    value={formData.contractStart?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Contract End</label>
                  <input
                    type="date"
                    value={formData.contractEnd?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dispCompliant"
                  checked={formData.dispCompliant}
                  onChange={(e) => setFormData({ ...formData, dispCompliant: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="dispCompliant" className="text-gray-400">DISP Compliant</label>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[#2a3442] text-gray-400 rounded-lg hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00ff88] text-[#0a0f1a] rounded-lg hover:bg-[#00cc6a] transition-colors"
                >
                  {editingClient ? 'Update' : 'Create'} Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
