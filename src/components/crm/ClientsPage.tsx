import React, { useState, useEffect } from 'react';
import { Search, Shield, Building2, DollarSign, Calendar, Plus, X, Edit2, Trash2, FileText, CreditCard, Receipt, Filter } from 'lucide-react';
import { clientApi, Client, CreateClientRequest, contactApi, invoiceApi, paymentApi, Invoice, Payment, CreateInvoiceRequest, CreatePaymentRequest, InvoiceLineItem } from '../../services/api';
import api from '../../services/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [organisations, setOrganisations] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Financial management state
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showGlobalFinancialModal, setShowGlobalFinancialModal] = useState(false);
  const [selectedClientForFinance, setSelectedClientForFinance] = useState<Client | null>(null);
  const [financialTab, setFinancialTab] = useState<'invoices' | 'payments' | 'stats'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [globalFinancialSearchQuery, setGlobalFinancialSearchQuery] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceRequest>({
    clientId: '',
    invoiceNumber: '',
    description: '',
    amount: 0,
    tax: 0,
  });
  const [paymentForm, setPaymentForm] = useState<CreatePaymentRequest>({
    clientId: '',
    amount: 0,
    paymentMethod: 'bank_transfer',
  });
  
  // Invoice search and filters
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [invoiceSortBy, setInvoiceSortBy] = useState<'date' | 'amount'>('date');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  
  const [formData, setFormData] = useState<CreateClientRequest>({
    organisationId: '',
    plan: 'Professional',
    status: 'onboarded',
    mrr: 0,
    dispCompliant: false,
    notes: '',
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadClients();
    loadOrganisations();
  }, []);

  const loadClients = async () => {
    try {
      const [clientsResponse, contactsResponse, orgsResponse] = await Promise.all([
        clientApi.getAll(),
        contactApi.getAll(),
        api.organisations.getAll()
      ]);
      
      const actualClients = clientsResponse.clients || [];
      const allContacts = contactsResponse.contacts || [];
      const allOrgs = orgsResponse.organisations || [];
      
      // Store contacts for lookup
      setContacts(allContacts);
      
      // Filter contacts with status "converted" and map them to Client format
      const convertedContacts = allContacts
        .filter((contact: any) => contact.status === 'converted')
        .map((contact: any) => {
          const org = allOrgs.find((o: any) => o.id === contact.organisationId);
          return {
            id: contact.id,
            organisationId: contact.organisationId || '',
            organisationName: org?.name || 'Unknown',
            plan: 'N/A',
            status: 'onboarded' as const,
            mrr: 0,
            dispCompliant: false,
            notes: `Converted contact: ${contact.firstName} ${contact.lastName}${contact.notes ? ' - ' + contact.notes : ''}`,
            createdAt: contact.createdAt || new Date().toISOString(),
            updatedAt: contact.updatedAt || new Date().toISOString(),
          };
        });
      
      // Combine actual clients with converted contacts, then sort by creation date descending (newest first)
      const allClients = [...actualClients, ...convertedContacts];
      const sortedClients = allClients.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setClients(sortedClients);
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
    const loadingToast = toast.loading(editingClient ? 'Updating client...' : 'Creating client...');
    try {
      // Clean up form data - convert empty strings to undefined
      const cleanData: any = { ...formData };
      if (!cleanData.contractStart || cleanData.contractStart === '') {
        cleanData.contractStart = undefined;
      }
      if (!cleanData.contractEnd || cleanData.contractEnd === '') {
        cleanData.contractEnd = undefined;
      }
      if (!cleanData.notes || cleanData.notes.trim() === '') {
        cleanData.notes = '';
      }
      
      if (editingClient) {
        await clientApi.update(editingClient.id, cleanData);
        toast.success('Client updated successfully', { id: loadingToast });
      } else {
        await clientApi.create(cleanData);
        toast.success('Client created successfully', { id: loadingToast });
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      await loadClients();
    } catch (error) {
      console.error('Failed to save client:', error);
      toast.error('Failed to save client. Please check all fields and try again.', { id: loadingToast });
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
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting client...');
        try {
          await clientApi.delete(id);
          toast.success('Client deleted successfully', { id: loadingToast });
          loadClients();
        } catch (error) {
          console.error('Failed to delete client:', error);
          toast.error('Failed to delete client', { id: loadingToast });
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      organisationId: '',
      plan: 'Professional',
      status: 'onboarded',
      mrr: 0,
      dispCompliant: false,
      notes: '',
    });
  };

  // Financial management functions
  const openFinancialModal = async (client: Client) => {
    // Clear previous data first
    setInvoices([]);
    setPayments([]);
    setInvoiceSearchQuery('');
    setInvoiceStatusFilter('all');
    
    setSelectedClientForFinance(client);
    setShowFinancialModal(true);
    await loadClientFinancials(client.id);
  };
  
  const closeFinancialModal = () => {
    setShowFinancialModal(false);
    setSelectedClientForFinance(null);
    setInvoices([]);
    setPayments([]);
    setInvoiceSearchQuery('');
    setInvoiceStatusFilter('all');
    setFinancialTab('invoices');
  };
  
  const openGlobalFinancialModal = async () => {
    setShowGlobalFinancialModal(true);
    await loadAllFinancials();
  };
  
  const closeGlobalFinancialModal = () => {
    setShowGlobalFinancialModal(false);
    setAllInvoices([]);
    setAllPayments([]);
    setGlobalFinancialSearchQuery('');
  };

  const loadClientFinancials = async (clientId: string) => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        invoiceApi.getAll(clientId),
        paymentApi.getAll(clientId),
      ]);
      setInvoices(invoicesRes.invoices || []);
      setPayments(paymentsRes.payments || []);
    } catch (error) {
      console.error('Failed to load financials:', error);
    }
  };
  
  const loadAllFinancials = async () => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        invoiceApi.getAll(),
        paymentApi.getAll(),
      ]);
      setAllInvoices(invoicesRes.invoices || []);
      setAllPayments(paymentsRes.payments || []);
    } catch (error) {
      console.error('Failed to load all financials:', error);
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingInvoice ? 'Updating invoice...' : 'Creating invoice...');
    try {
      // Calculate totals from line items
      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const invoiceData = {
        ...invoiceForm,
        amount: subtotal,
        lineItems: lineItems.filter(item => item.description.trim() !== ''),
      };
      
      if (editingInvoice) {
        await invoiceApi.update(editingInvoice.id, invoiceData);
        toast.success('Invoice updated successfully', { id: loadingToast });
      } else {
        await invoiceApi.create(invoiceData);
        toast.success('Invoice created successfully', { id: loadingToast });
      }
      setShowInvoiceModal(false);
      setEditingInvoice(null);
      resetInvoiceForm();
      if (selectedClientForFinance) {
        await loadClientFinancials(selectedClientForFinance.id);
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
      toast.error('Failed to save invoice', { id: loadingToast });
    }
  };
  
  const resetInvoiceForm = () => {
    setLineItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setInvoiceForm({
      clientId: '',
      invoiceNumber: '',
      description: '',
      amount: 0,
      tax: 0,
    });
  };
  
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };
  
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };
  
  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    // Recalculate total for this line item
    if (field === 'quantity' || field === 'unitPrice') {
      newLineItems[index].total = newLineItems[index].quantity * newLineItems[index].unitPrice;
    }
    
    setLineItems(newLineItems);
  };
  
  const calculateInvoiceTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = invoiceForm.tax || 0;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };
  
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      invoice.description.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      invoice.clientName?.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
    
    const matchesStatus = invoiceStatusFilter === 'all' || invoice.status === invoiceStatusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (invoiceSortBy === 'date') {
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    } else {
      return b.totalAmount - a.totalAmount;
    }
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingPayment ? 'Updating payment...' : 'Recording payment...');
    try {
      if (editingPayment) {
        await paymentApi.update(editingPayment.id, paymentForm);
        toast.success('Payment updated successfully', { id: loadingToast });
      } else {
        await paymentApi.create(paymentForm);
        toast.success('Payment recorded successfully', { id: loadingToast });
      }
      setShowPaymentModal(false);
      setEditingPayment(null);
      if (selectedClientForFinance) {
        await loadClientFinancials(selectedClientForFinance.id);
      }
    } catch (error) {
      console.error('Failed to save payment:', error);
      toast.error('Failed to save payment', { id: loadingToast });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting invoice...');
        try {
          await invoiceApi.delete(id);
          toast.success('Invoice deleted successfully', { id: loadingToast });
          if (selectedClientForFinance) {
            await loadClientFinancials(selectedClientForFinance.id);
          }
        } catch (error) {
          console.error('Failed to delete invoice:', error);
          toast.error('Failed to delete invoice', { id: loadingToast });
        }
      },
    });
  };

  const handleDeletePayment = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Payment',
      message: 'Are you sure you want to delete this payment? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting payment...');
        try {
          await paymentApi.delete(id);
          toast.success('Payment deleted successfully', { id: loadingToast });
          if (selectedClientForFinance) {
            await loadClientFinancials(selectedClientForFinance.id);
          }
        } catch (error) {
          console.error('Failed to delete payment:', error);
          toast.error('Failed to delete payment', { id: loadingToast });
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
      onboarded: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
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

  const activeClients = clients.filter(c => c.status === 'active');
  const totalMRR = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const dispCompliantCount = clients.filter(c => c.dispCompliant).length;
  const onboardedCount = clients.filter(c => c.status === 'onboarded').length;

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
          <div className="text-3xl text-white">{activeClients.length}</div>
        </div>
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total MRR</span>
            <DollarSign className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-3xl text-white">${totalMRR.toFixed(0)}</div>
        </div>
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">DISP Compliant</span>
            <Shield className="w-5 h-5 text-[#00ff88]" />
          </div>
          <div className="text-3xl text-white">{dispCompliantCount}</div>
        </div>
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Onboarded</span>
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl text-white">{onboardedCount}</div>
        </div>
      </div>
      
      {/* Global Financial Overview Button */}
      <div className="flex justify-center">
        <button
          onClick={openGlobalFinancialModal}
          className="flex items-center gap-3 bg-[#1a2332] border-2 border-[#00ff88] text-white px-6 py-3 rounded-lg hover:bg-[#2a3442] transition-all shadow-lg shadow-[#00ff88]/10"
        >
          <FileText className="w-5 h-5 text-[#00ff88]" />
          <div className="text-left">
            <div className="text-sm font-semibold">Global Financial Overview</div>
            <div className="text-xs text-gray-400">View all invoices and payments across clients</div>
          </div>
        </button>
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
          <option value="onboarded">Onboarded</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a2332]">
            <tr>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Organisation</th>
              <th className="text-left px-6 py-4 text-sm text-gray-400">Contact</th>
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
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  {clients.length === 0 ? 'No clients yet. Add your first client!' : 'No clients match your search.'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => {
                // Find primary contact or any contact for this organisation
                const orgContacts = contacts.filter((c: any) => c.organisationId === client.organisationId);
                const primaryContact = orgContacts.find((c: any) => c.isPrimary) || orgContacts[0];
                
                return (
                <tr key={client.id} className="border-t border-[#1a2332] hover:bg-[#1a2332]/50">
                  <td className="px-6 py-4 text-white font-medium">{client.organisationName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {primaryContact ? (
                      <div>
                        <div className="text-white">{primaryContact.firstName} {primaryContact.lastName}</div>
                        <div className="text-xs text-gray-500">{primaryContact.email || primaryContact.phone}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{client.plan}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs border capitalize ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#00ff88] font-medium">${(client.mrr || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {client.dispCompliant ? (
                      <Shield className="w-5 h-5 text-[#00ff88]" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {client.contractStart ? new Date(client.contractStart).toLocaleDateString('en-AU') : '-'}
                    {client.contractEnd && ` - ${new Date(client.contractEnd).toLocaleDateString('en-AU')}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openFinancialModal(client)} 
                        className="p-2 text-gray-400 hover:text-[#00ff88]"
                        title="Manage Finances"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(client)} className="p-2 text-gray-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
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
                    <option value="onboarded">Onboarded</option>
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

      {/* Financial Management Modal */}
      {showFinancialModal && selectedClientForFinance && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-[#1a2332]">
              <div>
                <h2 className="text-2xl text-white">{selectedClientForFinance.organisationName} - Financial Management</h2>
                <p className="text-gray-400 text-sm mt-1">Manage invoices, payments, and financial records for this client only</p>
              </div>
              <button onClick={closeFinancialModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#1a2332] px-6">
              <button
                onClick={() => setFinancialTab('invoices')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  financialTab === 'invoices'
                    ? 'border-[#00ff88] text-[#00ff88]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoices ({invoices.length})
                </div>
              </button>
              <button
                onClick={() => setFinancialTab('payments')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  financialTab === 'payments'
                    ? 'border-[#00ff88] text-[#00ff88]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payments ({payments.length})
                </div>
              </button>
              <button
                onClick={() => setFinancialTab('stats')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  financialTab === 'stats'
                    ? 'border-[#00ff88] text-[#00ff88]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Overview
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {financialTab === 'invoices' && (
                <div className="space-y-6">
                  {/* Header with Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl text-white font-semibold">Invoices</h3>
                      <p className="text-gray-400 text-sm mt-1">Manage and track all client invoices</p>
                    </div>
                    <button
                      onClick={() => {
                        setInvoiceForm({
                          clientId: selectedClientForFinance.id,
                          invoiceNumber: `INV-${Date.now()}`,
                          description: '',
                          amount: 0,
                          tax: 10,
                        });
                        setLineItems([{ description: '', quantity: 1, unitPrice: 0, total: 0 }]);
                        setEditingInvoice(null);
                        setShowInvoiceModal(true);
                      }}
                      className="flex items-center gap-2 bg-[#00ff88] text-[#0a0f1a] px-4 py-2 rounded-lg hover:bg-[#00cc6a] transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      New Invoice
                    </button>
                  </div>

                  {/* Search and Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-[#1a2332]/50 p-4 rounded-lg border border-[#2a3442]">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search by invoice number, description, or client..."
                        value={invoiceSearchQuery}
                        onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                        className="w-full bg-[#0f1623] border border-[#2a3442] rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="flex gap-3">
                      <select
                        value={invoiceStatusFilter}
                        onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                        className="bg-[#0f1623] border border-[#2a3442] rounded-lg px-4 py-2 text-white text-sm focus:border-[#00ff88] focus:outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select
                        value={invoiceSortBy}
                        onChange={(e) => setInvoiceSortBy(e.target.value as 'date' | 'amount')}
                        className="bg-[#0f1623] border border-[#2a3442] rounded-lg px-4 py-2 text-white text-sm focus:border-[#00ff88] focus:outline-none"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="amount">Sort by Amount</option>
                      </select>
                    </div>
                  </div>

                  {/* Invoice Stats Summary */}
                  {filteredInvoices.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Invoices</div>
                        <div className="text-white text-2xl font-bold">{filteredInvoices.length}</div>
                      </div>
                      <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Value</div>
                        <div className="text-[#00ff88] text-2xl font-bold">${filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Paid</div>
                        <div className="text-[#00ff88] text-2xl font-bold">${filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Outstanding</div>
                        <div className="text-yellow-400 text-2xl font-bold">${filteredInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</div>
                      </div>
                    </div>
                  )}

                  {/* Invoices List */}
                  {filteredInvoices.length === 0 ? (
                    <div className="text-center py-16 bg-[#1a2332]/30 rounded-lg border-2 border-dashed border-[#2a3442]">
                      <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">
                        {invoiceSearchQuery || invoiceStatusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {invoiceSearchQuery || invoiceStatusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first invoice to get started'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="bg-[#1a2332] rounded-lg p-5 hover:bg-[#1f2937] transition-all border border-[#2a3442] hover:border-[#00ff88]/30 group">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-white font-semibold text-lg">{invoice.invoiceNumber}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                                  invoice.status === 'paid' ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30' :
                                  invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                  invoice.status === 'draft' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                  'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}>
                                  {invoice.status}
                                </span>
                                {invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && (
                                  <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                                    {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                                  </span>
                                )}
                              </div>
                              
                              {invoice.description && (
                                <p className="text-gray-400 text-sm mb-3 line-clamp-1">{invoice.description}</p>
                              )}
                              
                              {/* Line Items Preview */}
                              {invoice.lineItems && invoice.lineItems.length > 0 && (
                                <div className="mb-3 space-y-1">
                                  {invoice.lineItems.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="text-xs text-gray-500 flex justify-between">
                                      <span className="truncate">{item.quantity}x {item.description}</span>
                                      <span className="text-gray-400 ml-2">${item.total.toFixed(2)}</span>
                                    </div>
                                  ))}
                                  {invoice.lineItems.length > 2 && (
                                    <div className="text-xs text-gray-600">+{invoice.lineItems.length - 2} more items</div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500">Subtotal:</span>
                                  <span className="text-white font-medium">${invoice.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500">Tax:</span>
                                  <span className="text-white font-medium">${invoice.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-500">Total:</span>
                                  <span className="text-[#00ff88] font-bold text-base">${invoice.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="h-4 w-px bg-[#2a3442]"></div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                  <span className="text-gray-400">Issued:</span>
                                  <span className="text-white">{new Date(invoice.issueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                {invoice.dueDate && (
                                  <>
                                    <div className="h-4 w-px bg-[#2a3442]"></div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">Due:</span>
                                      <span className={`font-medium ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-400' : 'text-white'}`}>
                                        {new Date(invoice.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setInvoiceForm({
                                    clientId: invoice.clientId,
                                    invoiceNumber: invoice.invoiceNumber,
                                    description: invoice.description,
                                    amount: invoice.amount,
                                    tax: invoice.tax,
                                    status: invoice.status,
                                    issueDate: invoice.issueDate,
                                    dueDate: invoice.dueDate,
                                  });
                                  setLineItems(invoice.lineItems && invoice.lineItems.length > 0 
                                    ? invoice.lineItems 
                                    : [{ description: '', quantity: 1, unitPrice: 0, total: 0 }]
                                  );
                                  setShowInvoiceModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10 rounded-lg transition-all"
                                title="Edit invoice"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {invoice.status !== 'paid' && (
                                <button
                                  onClick={async () => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Mark as Paid',
                                      message: `Mark invoice ${invoice.invoiceNumber} as paid?`,
                                      variant: 'success',
                                      onConfirm: async () => {
                                        try {
                                          await invoiceApi.update(invoice.id, { status: 'paid' });
                                          await loadClientFinancials(selectedClientForFinance.id);
                                          toast.success('Invoice marked as paid');
                                        } catch (error) {
                                          console.error('Failed to update invoice:', error);
                                          toast.error('Failed to mark as paid');
                                        }
                                      },
                                    });
                                  }}
                                  className="p-2 text-gray-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10 rounded-lg transition-all"
                                  title="Mark as paid"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Delete invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {financialTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg text-white font-medium">Payments</h3>
                    <button
                      onClick={() => {
                        setPaymentForm({
                          clientId: selectedClientForFinance.id,
                          amount: 0,
                          paymentMethod: 'bank_transfer',
                        });
                        setEditingPayment(null);
                        setShowPaymentModal(true);
                      }}
                      className="flex items-center gap-2 bg-[#00ff88] text-[#0a0f1a] px-4 py-2 rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Record Payment
                    </button>
                  </div>

                  {payments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No payments recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="bg-[#1a2332] rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[#00ff88] font-medium text-lg">${payment.amount.toFixed(2)}</span>
                                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                              </div>
                              {payment.invoiceNumber && (
                                <p className="text-gray-400 text-sm mb-1">Invoice: {payment.invoiceNumber}</p>
                              )}
                              {payment.reference && (
                                <p className="text-gray-400 text-sm mb-1">Reference: {payment.reference}</p>
                              )}
                              {payment.notes && (
                                <p className="text-gray-500 text-sm">{payment.notes}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm mt-2">
                                <span className="text-gray-500">Date: {new Date(payment.paymentDate).toLocaleDateString('en-AU')}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingPayment(payment);
                                  setPaymentForm({
                                    clientId: payment.clientId,
                                    invoiceId: payment.invoiceId,
                                    amount: payment.amount,
                                    paymentMethod: payment.paymentMethod,
                                    reference: payment.reference,
                                    notes: payment.notes,
                                  });
                                  setShowPaymentModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-white"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(payment.id)}
                                className="p-2 text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {financialTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className="text-lg text-white font-medium">Financial Overview</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#1a2332] rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-2">Total Invoiced</div>
                      <div className="text-2xl text-white font-semibold">
                        ${invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{invoices.length} invoices</div>
                    </div>
                    
                    <div className="bg-[#1a2332] rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-2">Total Paid</div>
                      <div className="text-2xl text-[#00ff88] font-semibold">
                        ${payments.reduce((sum, pay) => sum + pay.amount, 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{payments.length} payments</div>
                    </div>
                    
                    <div className="bg-[#1a2332] rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-2">Outstanding</div>
                      <div className="text-2xl text-yellow-400 font-semibold">
                        ${(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) - payments.reduce((sum, pay) => sum + pay.amount, 0)).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Balance due</div>
                    </div>
                  </div>

                  <div className="bg-[#1a2332] rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Invoice Status Breakdown</h4>
                    <div className="space-y-2">
                      {['paid', 'sent', 'draft', 'overdue', 'cancelled'].map(status => {
                        const count = invoices.filter(inv => inv.status === status).length;
                        const amount = invoices.filter(inv => inv.status === status).reduce((sum, inv) => sum + inv.totalAmount, 0);
                        if (count === 0) return null;
                        return (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-gray-400 capitalize">{status}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-white">{count} invoice{count !== 1 ? 's' : ''}</span>
                              <span className="text-[#00ff88]">${amount.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowInvoiceModal(false); resetInvoiceForm(); } }}>
          <div className="bg-white w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
            {/* Close Button */}
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); setShowInvoiceModal(false); resetInvoiceForm(); }} 
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
                  <div className="bg-[#2d3436] text-white px-6 py-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-1">
                      <FileText className="w-6 h-6 text-[#00ff88]" />
                      <div>
                        <h2 className="text-xl font-bold">4D DEFENCE CRM</h2>
                        <p className="text-xs text-gray-300">Professional Invoice System</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-4xl font-bold text-gray-800">INVOICE</h1>
                  </div>
                </div>

                {/* Invoice Info and Bill To Section */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column - Invoice Details */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">INVOICE #</label>
                      <input
                        type="text"
                        value={invoiceForm.invoiceNumber}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:border-[#00ff88] focus:outline-none"
                        placeholder="001"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">INVOICE DATE</label>
                        <input
                          type="date"
                          value={invoiceForm.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:border-[#00ff88] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">DUE DATE</label>
                        <input
                          type="date"
                          value={invoiceForm.dueDate?.split('T')[0] || ''}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:border-[#00ff88] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Bill To */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">BILL TO</label>
                    <textarea
                      value={invoiceForm.description}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:border-[#00ff88] focus:outline-none resize-none"
                      placeholder="Client Name&#10;Address Line 1&#10;City, State ZIP&#10;Phone Number"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
                    {lineItems.length < 2 && (
                      <button
                        type="button"
                        onClick={addLineItem}
                        className="text-xs bg-[#00ff88] hover:bg-[#00cc6a] text-gray-900 px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        + Add Item
                      </button>
                    )}
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[#a4c639] text-white text-xs font-bold uppercase">
                      <div className="col-span-1">NO</div>
                      <div className="col-span-5">DESCRIPTION</div>
                      <div className="col-span-2 text-center">PRICE</div>
                      <div className="col-span-2 text-center">QTY</div>
                      <div className="col-span-2 text-right">TOTAL</div>
                    </div>

                    {/* Table Rows */}
                    <div className="bg-white divide-y divide-gray-200">
                      {lineItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                          <div className="col-span-1 text-gray-800 font-medium text-sm">{index + 1}</div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:border-[#00ff88] focus:outline-none"
                              placeholder="ITEM/SERVICE"
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full bg-gray-50 border border-gray-300 rounded pl-5 pr-2 py-1.5 text-gray-800 text-sm text-center focus:border-[#00ff88] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm text-center focus:border-[#00ff88] focus:outline-none"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-gray-800 font-semibold text-sm">${item.total.toFixed(2)}</span>
                            {lineItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="ml-2 text-red-400 hover:text-red-600"
                                title="Remove"
                              >
                                <X className="w-3 h-3 inline" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between items-center py-2 px-4 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700">SUB-TOTAL</span>
                      <span className="text-sm font-semibold text-gray-800">${calculateInvoiceTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">TAX</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={invoiceForm.tax || 0}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: parseFloat(e.target.value) || 0 })}
                          className="w-12 bg-gray-50 border border-gray-300 rounded px-1 py-0.5 text-gray-800 text-xs text-center focus:border-[#00ff88] focus:outline-none"
                        />
                        <span className="text-xs text-gray-600">%</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">${calculateInvoiceTotals().tax.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#a4c639] text-white py-3 px-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold">Total Due</span>
                        <span className="text-xl font-bold">${calculateInvoiceTotals().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method & Terms */}
                <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-gray-200">
                  <div>
                    <h5 className="text-xs font-bold text-gray-700 mb-2">PAYMENT METHOD</h5>
                    <textarea
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 text-gray-800 text-xs focus:border-[#00ff88] focus:outline-none resize-none"
                      placeholder="Bank: Your Bank Name&#10;Account Name: Account Holder&#10;Account Number: 123456789"
                      rows={3}
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-700 mb-2">TERM AND CONDITIONS</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Please make the payment by the due date to the account below. We accept bank transfer, credit card, or check.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">THANK YOU FOR YOUR BUSINESS</p>
                  <div className="bg-[#2d3436] text-white py-3 px-4 rounded-lg inline-block">
                    <p className="text-xs">Defence CRM - Invoice System - contact@defencecrm.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 p-5 border-t-2 border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowInvoiceModal(false); resetInvoiceForm(); }}
                className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleInvoiceSubmit(e as any); }}
                className="flex-1 px-5 py-2.5 bg-[#00ff88] text-gray-900 rounded-lg hover:bg-[#00cc6a] transition-colors font-bold"
              >
                {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110]">
          <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-white">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Link to Invoice (Optional)</label>
                <select
                  value={paymentForm.invoiceId || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value || undefined })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                >
                  <option value="">No invoice</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - ${inv.totalAmount.toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate?.split('T')[0] || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Reference</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  placeholder="Transaction ID, Check number, etc."
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-2 text-white"
                  rows={2}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-[#2a3442] text-gray-400 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00ff88] text-[#0a0f1a] rounded-lg"
                >
                  {editingPayment ? 'Update' : 'Record'} Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Financial Overview Modal */}
      {showGlobalFinancialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#1a2332]">
              <div>
                <h2 className="text-2xl text-white font-semibold">Global Financial Overview</h2>
                <p className="text-gray-400 text-sm mt-1">View and search all invoices and payments across all clients</p>
              </div>
              <button onClick={closeGlobalFinancialModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-[#1a2332] bg-[#1a2332]/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by client name, invoice number, or description..."
                  value={globalFinancialSearchQuery}
                  onChange={(e) => setGlobalFinancialSearchQuery(e.target.value)}
                  className="w-full bg-[#0f1623] border border-[#2a3442] rounded-lg pl-10 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Financial Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Invoices</div>
                  <div className="text-white text-2xl font-bold">{allInvoices.length}</div>
                </div>
                <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Value</div>
                  <div className="text-[#00ff88] text-2xl font-bold">${allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</div>
                </div>
                <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Paid Amount</div>
                  <div className="text-[#00ff88] text-2xl font-bold">${allInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</div>
                </div>
                <div className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Outstanding</div>
                  <div className="text-yellow-400 text-2xl font-bold">${allInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#00ff88]" />
                    All Invoices
                  </h3>
                  {allInvoices
                    .filter(invoice => 
                      !globalFinancialSearchQuery || 
                      invoice.clientName?.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                      invoice.invoiceNumber.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                      invoice.description.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase())
                    )
                    .length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-[#1a2332]/30 rounded-lg border border-dashed border-[#2a3442]">
                      {globalFinancialSearchQuery ? 'No invoices match your search' : 'No invoices found'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allInvoices
                        .filter(invoice => 
                          !globalFinancialSearchQuery || 
                          invoice.clientName?.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                          invoice.invoiceNumber.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                          invoice.description.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase())
                        )
                        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                        .map((invoice) => (
                          <div key={invoice.id} className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442] hover:border-[#00ff88]/30 transition-all">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-[#00ff88] font-medium text-sm">{invoice.clientName}</span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-white font-semibold">{invoice.invoiceNumber}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    invoice.status === 'paid' ? 'bg-[#00ff88]/20 text-[#00ff88]' :
                                    invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                                    invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {invoice.status}
                                  </span>
                                </div>
                                {invoice.description && (
                                  <p className="text-gray-400 text-sm mb-2">{invoice.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500">Total: <span className="text-[#00ff88] font-medium">${invoice.totalAmount.toFixed(2)}</span></span>
                                  <span className="text-gray-500">Issued: {new Date(invoice.issueDate).toLocaleDateString('en-AU')}</span>
                                  {invoice.dueDate && (
                                    <span className="text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString('en-AU')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Payments List */}
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#00ff88]" />
                    All Payments
                  </h3>
                  {allPayments
                    .filter(payment => 
                      !globalFinancialSearchQuery || 
                      payment.clientName?.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                      payment.invoiceNumber?.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                      payment.reference.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase())
                    )
                    .length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-[#1a2332]/30 rounded-lg border border-dashed border-[#2a3442]">
                      {globalFinancialSearchQuery ? 'No payments match your search' : 'No payments found'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allPayments
                        .filter(payment => 
                          !globalFinancialSearchQuery || 
                          payment.clientName?.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                          payment.invoiceNumber?.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase()) ||
                          payment.reference.toLowerCase().includes(globalFinancialSearchQuery.toLowerCase())
                        )
                        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                        .map((payment) => (
                          <div key={payment.id} className="bg-[#1a2332] rounded-lg p-4 border border-[#2a3442]">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-[#00ff88] font-medium text-sm">{payment.clientName}</span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-white font-bold text-lg">${payment.amount.toFixed(2)}</span>
                                  <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500">Date: {new Date(payment.paymentDate).toLocaleDateString('en-AU')}</span>
                                  {payment.invoiceNumber && (
                                    <span className="text-gray-500">Invoice: {payment.invoiceNumber}</span>
                                  )}
                                  {payment.reference && (
                                    <span className="text-gray-500">Ref: {payment.reference}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1a2332] bg-[#0a0f1a]">
              <button
                onClick={closeGlobalFinancialModal}
                className="w-full px-5 py-3 bg-[#1a2332] border border-[#2a3442] text-white rounded-lg hover:bg-[#2a3442] transition-all font-medium"
              >
                Close
              </button>
            </div>
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
        variant={confirmDialog.variant}
      />
    </div>
  );
}
