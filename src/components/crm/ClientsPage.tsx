import React, { useState, useEffect } from 'react';
import { Search, Shield, Building2, DollarSign, Calendar, FileText } from 'lucide-react';
import { mockClients, mockOrganisations } from '../../types/mock-data';

interface Client {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'onboarding' | 'churned';
  mrr: number;
  startDate: string;
  lastActivity: string;
  contacts: number;
  dispCompliant: boolean;
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Load mock data
    const timer = setTimeout(() => {
      const formattedClients: Client[] = mockClients.map((item, index) => ({
        id: item.id,
        name: item.organisation?.name || item.name,
        plan: 'Enterprise',
        status: 'active' as const,
        mrr: Math.round(item.expectedValue / 12),
        startDate: item.closedAt ? new Date(item.closedAt).toLocaleDateString() : 'N/A',
        lastActivity: new Date(item.updatedAt).toLocaleDateString(),
        contacts: 3,
        dispCompliant: true,
      }));
      setClients(formattedClients);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
      onboarding: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      churned: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalMRR = clients
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + c.mrr, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">Client Management</h1>
        <p className="text-gray-400">Manage your defence industry clients</p>
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
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
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
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a2332]">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Client</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Plan</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">MRR</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Start Date</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Compliance</th>
                <th className="px-6 py-4 text-left text-sm text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2332]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-12 bg-[#1a2332] rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#1a2332]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#0a0f1a]" />
                        </div>
                        <div>
                          <div className="text-white">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.contacts} contacts</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{client.plan}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm border ${getStatusColor(client.status)}`}>
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">${client.mrr.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 text-gray-400">{client.startDate}</td>
                    <td className="px-6 py-4">
                      {client.dispCompliant ? (
                        <div className="flex items-center gap-2 text-[#00ff88]">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">Compliant</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">In Progress</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] transition-colors text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
