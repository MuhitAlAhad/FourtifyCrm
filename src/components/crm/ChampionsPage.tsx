import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, DollarSign, Target, Calendar, Search, Filter, BarChart3, User, Mail, Phone, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { championApi, Champion as ApiChampion } from '../../services/api';

interface Champion extends ApiChampion {}

export function ChampionsPage() {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChampion, setEditingChampion] = useState<Champion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    organizationName: '',
    address: '',
    allocatedSale: 0,
    activeClients: 0,
    conversionRate: 0,
    performanceScore: 0
  });
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
    loadChampions();
  }, []);

  const loadChampions = async () => {
    setLoading(true);
    try {
      const response = await championApi.getAll(filterRole === 'all' ? undefined : filterRole, searchTerm);
      setChampions(response.champions);
    } catch (error) {
      console.error('Failed to load champions:', error);
      toast.error('Failed to load champions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingChampion(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      organizationName: '',
      address: '',
      allocatedSale: 0,
      activeClients: 0,
      conversionRate: 0,
      performanceScore: 0
    });
    setShowModal(true);
  };

  const handleEdit = (champion: Champion) => {
    setEditingChampion(champion);
    setFormData({
      name: champion.name,
      email: champion.email,
      phone: champion.phone,
      role: champion.role,
      organizationName: champion.organizationName,
      address: champion.address,
      allocatedSale: champion.allocatedSale,
      activeClients: champion.activeClients,
      conversionRate: champion.conversionRate,
      performanceScore: champion.performanceScore
    });
    setShowModal(true);
  };

  const handleDelete = (champion: Champion) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Champion',
      message: `Are you sure you want to remove ${champion.name} from the champions list? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await championApi.delete(champion.id);
          setChampions(prev => prev.filter(c => c.id !== champion.id));
          toast.success(`${champion.name} removed successfully`);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error('Failed to delete champion:', error);
          toast.error('Failed to delete champion');
        }
      }
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in Name, Email, and Phone');
      return;
    }
    
    if (!formData.organizationName) {
      toast.error('Please enter Organization Name');
      return;
    }
    
    if (!formData.address) {
      toast.error('Please enter Address');
      return;
    }
    
    if (formData.allocatedSale <= 0) {
      toast.error('Targeted Clients must be greater than 0');
      return;
    }
    
    if (formData.activeClients < 0) {
      toast.error('Active Clients cannot be negative');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Auto-calculate conversion rate: (activeClients / allocatedSale) * 100
    const calculatedConversionRate = formData.allocatedSale > 0 
      ? Math.round((formData.activeClients / formData.allocatedSale) * 100 * 100) / 100
      : 0;

    try {
      if (editingChampion) {
        // Update existing champion
        const updatedChampion = await championApi.update(editingChampion.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          organizationName: formData.organizationName,
          address: formData.address,
          allocatedSale: formData.allocatedSale,
          activeClients: formData.activeClients,
          performanceScore: formData.performanceScore
        });
        
        setChampions(prev => prev.map(c => 
          c.id === editingChampion.id ? updatedChampion : c
        ));
        toast.success(`${formData.name} updated successfully`);
      } else {
        // Create new champion
        const newChampion = await championApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          organizationName: formData.organizationName,
          address: formData.address,
          allocatedSale: formData.allocatedSale,
          activeClients: formData.activeClients,
          performanceScore: formData.performanceScore
        });
        
        setChampions(prev => [...prev, newChampion]);
        toast.success(`${formData.name} added successfully`);
      }
      setShowModal(false);
      setEditingChampion(null);
    } catch (error: any) {
      console.error('Failed to save champion:', error);
      const errorMessage = error?.message || (editingChampion ? 'Failed to update champion' : 'Failed to add champion');
      toast.error(errorMessage);
    }
  };

  const filteredChampions = champions.filter(champion => {
    const matchesSearch = champion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         champion.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || champion.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalSalesValue = champions.reduce((sum, c) => sum + c.allocatedSale, 0);
  const avgConversionRate = champions.length > 0
    ? champions.reduce((sum, c) => sum + c.conversionRate, 0) / champions.length
    : 0;
  const totalActiveClients = champions.reduce((sum, c) => sum + c.activeClients, 0);

  return (
    <div style={{ padding: '32px', backgroundColor: '#0a0f1a', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award style={{ color: '#00ff88' }} size={36} />
            Champions
          </h1>
          <p style={{ color: '#9ca3af' }}>Track team performance and sales achievements</p>
        </div>
        <button
          onClick={handleAddNew}
          style={{
            backgroundColor: '#00ff88',
            color: '#0a0f1a',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#00dd77')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00ff88')}
        >
          <Plus size={20} />
          Add New Champion
        </button>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#0f1623', border: '1px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Total Targeted Clients</span>
            <Target size={20} style={{ color: '#00ff88' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00ff88' }}>
            {totalSalesValue}
          </div>
        </div>

        <div style={{ backgroundColor: '#0f1623', border: '1px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Active Champions</span>
            <Users size={20} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {champions.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#0f1623', border: '1px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Avg Conversion Rate</span>
            <TrendingUp size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {avgConversionRate.toFixed(1)}%
          </div>
        </div>

        <div style={{ backgroundColor: '#0f1623', border: '1px solid #1a2332', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Active Clients</span>
            <Target size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
            {totalActiveClients}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search champions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              backgroundColor: '#0f1623',
              border: '1px solid #1a2332',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '12px 16px',
            backgroundColor: '#0f1623',
            border: '1px solid #1a2332',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '200px'
          }}
        >
          <option value="all">All Roles</option>
          <option value="Sales Representative">Sales Representative</option>
          <option value="Account Manager">Account Manager</option>
          <option value="Sales Manager">Sales Manager</option>
        </select>
      </div>

      {/* Champions Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading champions...</div>
      ) : filteredChampions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No champions found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredChampions.map((champion) => (
            <div
              key={champion.id}
              style={{
                backgroundColor: '#0f1623',
                border: '1px solid #1a2332',
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a2332';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Action Buttons */}
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(champion);
                  }}
                  style={{
                    backgroundColor: '#1a2332',
                    border: '1px solid #2a3342',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00ff88';
                    e.currentTarget.style.borderColor = '#00ff88';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2332';
                    e.currentTarget.style.borderColor = '#2a3342';
                  }}
                >
                  <Edit size={16} style={{ color: 'white' }} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(champion);
                  }}
                  style={{
                    backgroundColor: '#1a2332',
                    border: '1px solid #2a3342',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2332';
                    e.currentTarget.style.borderColor = '#2a3342';
                  }}
                >
                  <Trash2 size={16} style={{ color: 'white' }} />
                </button>
              </div>

              {/* Champion Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#1a2332',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00ff88',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {champion.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                    {champion.name}
                  </h3>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>{champion.role}</span>
                </div>
                <div style={{
                  backgroundColor: champion.performanceScore >= 90 ? 'rgba(0,255,136,0.1)' : 'rgba(251,191,36,0.1)',
                  color: champion.performanceScore >= 90 ? '#00ff88' : '#fbbf24',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {champion.performanceScore}
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
                  <Mail size={14} />
                  <span>{champion.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
                  <Phone size={14} />
                  <span>{champion.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
                  <Target size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500', color: '#00ff88' }}>{champion.organizationName}</span>
                    <span>{champion.address}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#1a2332', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>Targeted Clients</div>
                  <div style={{ color: '#00ff88', fontSize: '16px', fontWeight: '600' }}>
                    {champion.allocatedSale}
                  </div>
                </div>
                <div style={{ backgroundColor: '#1a2332', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>Active Clients</div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    {champion.activeClients}
                  </div>
                </div>
              </div>

              {/* Conversion Rate Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Conversion Rate</span>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{champion.conversionRate}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#1a2332', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${champion.conversionRate}%`,
                      backgroundColor: '#00ff88',
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </div>

              {/* Last Activity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '12px' }}>
                <Calendar size={12} />
                <span>Last active: {new Date(champion.lastActivity).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#0f1623',
              border: '1px solid #1a2332',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              backgroundColor: '#0f1623',
              borderBottom: '1px solid #1a2332',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 }}>
                {editingChampion ? 'Edit Champion' : 'Add New Champion'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a2332',
                      border: '1px solid #2a3342',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a2332',
                      border: '1px solid #2a3342',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Phone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a2332',
                      border: '1px solid #2a3342',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Enter role (e.g., Sales Executive, Account Manager)"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a2332',
                      border: '1px solid #2a3342',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Organization Name */}
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Organization Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="Enter organization name"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a2332',
                      border: '1px solid #2a3342',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Address */}
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                    Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                    style={{
                      width: '100%',
                      backgroundColor: '#1a2332',
                      border: '1px solid #2a3342',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Two Column Layout for Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Targeted Clients */}
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Targeted Clients <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.allocatedSale === 0 ? '' : formData.allocatedSale}
                      onChange={(e) => setFormData({ ...formData, allocatedSale: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      placeholder="Enter number of targeted clients"
                      style={{
                        width: '100%',
                        backgroundColor: '#1a2332',
                        border: '1px solid #2a3342',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Active Clients */}
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Active Clients
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.activeClients === 0 ? '' : formData.activeClients}
                      onChange={(e) => setFormData({ ...formData, activeClients: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                      placeholder="Enter number of active clients"
                      style={{
                        width: '100%',
                        backgroundColor: '#1a2332',
                        border: '1px solid #2a3342',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Conversion Rate - Auto-calculated */}
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Conversion Rate (%) <span style={{ fontSize: '12px', color: '#6b7280' }}>(Auto-calculated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.allocatedSale > 0 ? ((formData.activeClients / formData.allocatedSale) * 100).toFixed(2) : '0.00'}
                      readOnly
                      style={{
                        width: '100%',
                        backgroundColor: '#0f1623',
                        border: '1px solid #2a3342',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#00ff88',
                        fontSize: '14px',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>

                  {/* Performance Score */}
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                      Performance Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.performanceScore}
                      onChange={(e) => setFormData({ ...formData, performanceScore: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      style={{
                        width: '100%',
                        backgroundColor: '#1a2332',
                        border: '1px solid #2a3342',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: '#0f1623',
              borderTop: '1px solid #1a2332',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              zIndex: 1
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: '#1a2332',
                  border: '1px solid #2a3342',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: '#00ff88',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: '#0a0f1a',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editingChampion ? 'Update Champion' : 'Add Champion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
