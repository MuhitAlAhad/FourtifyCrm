import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Mail, Activity, AlertCircle, Plus, Calendar, X, Clock, ChevronDown } from 'lucide-react';
import { QuickActionsPanel } from './QuickActionsPanel';
import { statsApi, meetingsApi, Meeting, contactApi, Contact } from '../../services/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface Stats {
  totalLeads: number;
  activeContacts: number;
  emailsSent: number;
  conversionRate: number;
}

interface CRMDashboardProps {
  onNavigate: (page: string) => void;
}

export function CRMDashboard({ onNavigate }: CRMDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    activeContacts: 0,
    emailsSent: 0,
    conversionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<{ title: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meetings state - now from database
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', contactId: '' });
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Contacts for dropdown
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

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
    loadDashboardData();
  }, []);

  // Load contacts when modal opens
  useEffect(() => {
    if (showMeetingModal && contacts.length === 0) {
      loadContacts();
    }
  }, [showMeetingModal]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardStats, upcomingMeetings] = await Promise.all([
        statsApi.getDashboardStats(),
        meetingsApi.getAll(true), // Get upcoming meetings only
      ]);

      setStats({
        totalLeads: dashboardStats.totalLeads,
        activeContacts: dashboardStats.totalContacts,
        emailsSent: dashboardStats.emailsSent || 0,
        conversionRate: dashboardStats.conversionRate,
      });

      setMeetings(upcomingMeetings.slice(0, 5)); // Show max 5 upcoming

      const { activities } = await statsApi.getRecentActivities(5);
      setRecentActivity(activities.map((a: { subject?: string; createdAt?: string }) => ({
        title: a.subject || 'Activity',
        time: a.createdAt ? new Date(a.createdAt).toLocaleString() : 'N/A',
      })));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await contactApi.getAll();
      setContacts(response.contacts || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) return;

    setSavingMeeting(true);
    const loadingToast = toast.loading('Scheduling meeting...');
    try {
      // Combine date and time into ISO datetime
      const meetingDate = new Date(`${newMeeting.date}T${newMeeting.time}`).toISOString();

      await meetingsApi.create({
        title: newMeeting.title,
        meetingDate,
        meetingType: 'call',
        contactId: newMeeting.contactId || undefined,
      });

      // Reload meetings
      const upcomingMeetings = await meetingsApi.getAll(true);
      setMeetings(upcomingMeetings.slice(0, 5));
      
      toast.success('Meeting scheduled successfully', { id: loadingToast });
      setNewMeeting({ title: '', date: '', time: '', contactId: '' });
      setShowMeetingModal(false);
    } catch (err) {
      console.error('Error creating meeting:', err);
      toast.error('Failed to schedule meeting', { id: loadingToast });
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleDeleteMeeting = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Meeting',
      message: 'Are you sure you want to delete this meeting? This action cannot be undone.',
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting meeting...');
        try {
          await meetingsApi.delete(id);
          setMeetings(meetings.filter(m => m.id !== id));
          toast.success('Meeting deleted successfully', { id: loadingToast });
        } catch (err) {
          console.error('Error deleting meeting:', err);
          toast.error('Failed to delete meeting', { id: loadingToast });
        }
      },
    });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-lead':
        onNavigate('leads');
        break;
      case 'add-contact':
        onNavigate('contacts');
        break;
      case 'add-organisation':
        onNavigate('organisations');
        break;
      case 'send-campaign':
        onNavigate('email');
        break;
      case 'schedule-meeting':
        setShowMeetingModal(true);
        break;
    }
  };

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-[#00ff88]',
      bg: 'bg-[#00ff88]/10',
    },
    {
      label: 'Active Contacts',
      value: stats.activeContacts,
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Emails Sent',
      value: stats.emailsSent,
      icon: Mail,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-2">CRM Dashboard</h1>
        <p className="text-gray-400">Monitor your leads, contacts, and campaigns</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadDashboardData}
            className="ml-auto px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl text-white mb-1">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <QuickActionsPanel onAction={handleQuickAction} />

      {/* Two Column Layout: Activity & Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <h2 className="text-xl text-white mb-4">Recent Activity</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-gray-400">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-[#1a2332] last:border-0">
                  <span className="text-white">{activity.title}</span>
                  <span className="text-gray-400 text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings - now from database */}
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-white">Upcoming Meetings</h2>
            <button
              onClick={() => setShowMeetingModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#00ff88] text-[#0a0f1a] rounded-lg text-sm font-medium hover:bg-[#00cc6a] transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : meetings.length === 0 ? (
            <p className="text-gray-400">No upcoming meetings</p>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-[#1a2332] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                      <Calendar size={18} className="text-pink-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{meeting.title}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-2">
                        <Clock size={12} />
                        {new Date(meeting.meetingDate).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} at {new Date(meeting.meetingDate).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        {meeting.contactName && <span className="text-blue-400">• {meeting.contactName}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Meeting Modal */}
      {showMeetingModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setShowMeetingModal(false)}
        >
          <div
            className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl text-white mb-4">Schedule Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Meeting Title *</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g., Sales Call"
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                />
              </div>

              {/* Contact Dropdown */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Contact (optional)</label>
                <div className="relative">
                  <select
                    value={newMeeting.contactId}
                    onChange={(e) => setNewMeeting({ ...newMeeting, contactId: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88] appearance-none cursor-pointer"
                  >
                    <option value="">-- No contact --</option>
                    {loadingContacts ? (
                      <option disabled>Loading contacts...</option>
                    ) : (
                      contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.firstName} {contact.lastName} {contact.jobTitle ? `(${contact.jobTitle})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {contacts.length === 0 && !loadingContacts && (
                  <p className="text-xs text-gray-500 mt-1">No contacts found. Add contacts in the Contacts page.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time *</label>
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddMeeting}
                disabled={savingMeeting}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${savingMeeting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-[#00ff88] text-[#0a0f1a] hover:bg-[#00cc6a]'
                  }`}
              >
                {savingMeeting ? 'Saving...' : 'Schedule Meeting'}
              </button>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="px-4 py-3 bg-[#1a2332] text-white rounded-lg hover:bg-[#2a3442] transition-colors"
              >
                Cancel
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
        variant="danger"
      />
    </div>
  );
}