import React from 'react';
import { UserPlus, Users, Building2, Mail, Calendar } from 'lucide-react';

interface QuickActionsPanelProps {
  onAction: (action: string) => void;
}

export function QuickActionsPanel({ onAction }: QuickActionsPanelProps) {
  const actions = [
    {
      id: 'add-lead',
      label: 'Add Lead',
      icon: UserPlus,
      color: 'from-[#00ff88] to-[#00cc6a]',
      description: 'Capture new prospect',
    },
    {
      id: 'add-contact',
      label: 'Add Contact',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      description: 'New contact person',
    },
    {
      id: 'add-organisation',
      label: 'Add Organisation',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      description: 'Register company',
    },
    {
      id: 'send-campaign',
      label: 'Send Campaign',
      icon: Mail,
      color: 'from-orange-500 to-orange-600',
      description: 'Email automation',
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
      description: 'Book appointment',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-4 hover:border-[#00ff88]/30 transition-all group"
          >
            <div className={`bg-gradient-to-br ${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-white text-sm mb-1">{action.label}</div>
            <div className="text-xs text-gray-500">{action.description}</div>
          </button>
        );
      })}
    </div>
  );
}
