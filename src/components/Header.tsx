import React from 'react';
import { UserProfile } from '../types/qc';
import { 
  Activity, 
  FileText, 
  Radio, 
  ShieldCheck, 
  Database, 
  CloudCheck, 
  CloudOff, 
  User, 
  AlertTriangle,
  Monitor
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenUserModal: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  unresolvedCapaCount: number;
  onOpenWindowsInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenUserModal,
  isOnline,
  pendingSyncCount,
  unresolvedCapaCount,
  onOpenWindowsInstall,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: Activity },
    { id: 'chart', label: 'Biểu đồ Levey-Jennings', icon: Activity },
    { id: 'receiver', label: 'Kết nối máy LIS', icon: Radio },
    { id: 'capa', label: 'Xử lý sự cố CAPA', icon: AlertTriangle, badge: unresolvedCapaCount },
    { id: 'reports', label: 'Báo cáo ISO 15189', icon: FileText },
    { id: 'backup', label: 'Sao lưu & Cấu hình', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
              IQC
            </div>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onSelectTab('dashboard'); }}
              className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:text-cyan-700 transition-colors"
            >
              <span>IQC by ThinhXu</span>
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 relative ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold ml-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Status */}
          <div className="flex items-center gap-3">
            {/* Cloud Sync Status Indicator */}
            <div 
              className="flex items-center gap-1.5 text-xs text-slate-600 cursor-default"
              title={isOnline ? 'Đồng bộ thời gian thực với Cloud Database' : 'Đang ở chế độ ngoại tuyến (Offline-First)'}
            >
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden xl:inline">Đám mây: Đã đồng bộ</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 text-[11px] font-medium font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Ngoại tuyến ({pendingSyncCount})</span>
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Windows Desktop App Install Button */}
            {onOpenWindowsInstall && (
              <button
                onClick={onOpenWindowsInstall}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50/90 hover:bg-cyan-100 text-cyan-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Cài đặt trên máy tính Windows (Desktop App)"
              >
                <Monitor className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden sm:inline">Cài Windows App</span>
                <span className="sm:hidden">Cài App</span>
              </button>
            )}

            {/* User Profile & Role Switcher */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center text-xs font-semibold">
                {currentUser.name.split(' ').pop()?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-slate-900 group-hover:text-cyan-700 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-none">
                  {currentUser.roleTitle.split('/')[0]}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
