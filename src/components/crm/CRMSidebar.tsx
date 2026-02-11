import React from 'react';
import { LayoutDashboard, Users, Mail, UserCircle, Settings, Shield, Building2, UserCog, Award, LogOut } from 'lucide-react';
import logo from '../../assets/35f931b802bf39733103d00f96fb6f9c21293f6e.png';

interface CRMSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: string;
}

export function CRMSidebar({ currentPage, onNavigate, userRole }: CRMSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'organisations', label: 'Organisations', icon: Building2 },
    { id: 'leads', label: 'Leads', icon: UserCircle },
    { id: 'clients', label: 'Clients', icon: Shield },
    { id: 'champions', label: 'Champions', icon: Award },
    { id: 'email', label: 'Email Center', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Add User Management for SuperAdmins
  if (userRole === 'SuperAdmin') {
    menuItems.push({ id: 'users', label: 'User Management', icon: UserCog });
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0f1623] to-[#0a0f1a] border-r border-[#1a2332] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#1a2332]">
        <img src={logo} alt="Fourtify CRM" className="h-10 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${isActive
                ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                : 'text-gray-400 hover:bg-[#1a2332] hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer with Info */}
      <div className="p-4 border-t border-[#1a2332] space-y-3">
        <div className="bg-[#1a2332] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse"></div>
            <div className="text-xs text-[#00ff88]">System Online</div>
          </div>
          <div className="text-xs text-gray-400">DISP Compliant</div>
          <div className="text-xs text-gray-400">Defence Grade Security</div>
        </div>
        <div className="text-xs text-center text-gray-600">
          Internal Use Only
        </div>
      </div>
    </aside>
  );
}