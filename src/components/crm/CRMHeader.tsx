import React from 'react';
import { Bell, Search, LogOut, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CRMHeaderProps {
  onLogout: () => void;
  userName?: string;
  userRole?: string;
}

export function CRMHeader({ onLogout, userName = 'Admin User', userRole = 'Admin' }: CRMHeaderProps) {
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-[#0f1623] border-b border-[#1a2332] flex items-center justify-between px-6">
      <div className="flex-1 max-w-md flex items-center gap-4">
        <a
          href="https://fourd.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-[#00ff88] transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View Website
        </a>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search leads, contacts, clients..."
            className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#00ff88] rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#1a2332]">
          <div className="text-right">
            <div className="text-sm text-white">{userName}</div>
            <div className="text-xs text-gray-400">{userRole}</div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6a] rounded-lg flex items-center justify-center">
            <span className="text-sm text-[#0a0f1a] font-semibold">{initials}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-[#00ff88] transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}