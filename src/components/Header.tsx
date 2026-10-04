import React from 'react';
import { LabInfo, UserProfile } from '../types/qc';
import { APP_CURRENT_VERSION } from '../services/updateService';
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
  Monitor,
  RefreshCw,
  Download,
  Package,
  Sliders,
  LogOut,
  LogIn,
  KeyRound,
  Building2
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  onOpenUserModal: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  unresolvedCapaCount: number;
  onOpenUpdateModal?: () => void;
  labInfo?: LabInfo;
  onOpenLabInfoModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenUserModal,
  onLogout,
  onLogin,
  isLoggedIn,
  isOnline,
  pendingSyncCount,
  unresolvedCapaCount,
  onOpenUpdateModal,
  labInfo,
  onOpenLabInfoModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Activity },
    { id: 'chart', label: 'Biểu đồ L-J', icon: Activity },
    { id: 'config', label: 'Cấu hình QC', icon: Sliders },
    { id: 'receiver', label: 'Kết nối LIS', icon: Radio },
    { id: 'capa', label: 'Sự cố CAPA', icon: AlertTriangle, badge: unresolvedCapaCount },
    { id: 'reports', label: 'Báo cáo QC', icon: FileText },
    { id: 'backup', label: 'Sao lưu', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 no-print w-full overflow-x-clip">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Zone 1: Brand Title & Lab Info */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm shrink-0">
              IQC
            </div>
            <div className="flex flex-col min-w-0">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onSelectTab('dashboard'); }}
                className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5 hover:text-cyan-700 transition-colors whitespace-nowrap"
              >
                <span>IQC by ThinhXu</span>
              </a>
              {labInfo && (
                <button
                  type="button"
                  onClick={onOpenLabInfoModal}
                  title="Nhấp để chỉnh sửa thông tin phòng xét nghiệm"
                  className="text-[10px] sm:text-[11px] text-slate-500 hover:text-indigo-600 truncate max-w-[150px] sm:max-w-[200px] text-left flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">{labInfo.hospitalName || labInfo.name}</span>
                </button>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links - Fits cleanly without horizontal scroll */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 flex-1 justify-center max-w-3xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-2 py-1.5 xl:px-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 relative shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold ml-0.5 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Status */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cloud Sync Status Indicator */}
            <div 
              className="flex items-center gap-1 text-[11px] text-slate-600 cursor-default shrink-0"
              title={isOnline ? 'Đồng bộ thời gian thực với Cloud Database' : 'Đang ở chế độ ngoại tuyến (Offline-First)'}
            >
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden xl:inline text-[10px]">Đã đồng bộ</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 font-medium font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px]">Ngoại tuyến ({pendingSyncCount})</span>
                </span>
              )}
            </div>

            {/* Manual Check for Updates Button */}
            {onOpenUpdateModal && (
              <button
                onClick={onOpenUpdateModal}
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
                title="Kiểm tra & Cập nhật phiên bản mới nhất từ GitHub Releases (v1.1.3)"
              >
                <RefreshCw className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="font-bold text-[11px] hidden sm:inline">Cập Nhật</span>
                <span className="text-[10px] font-mono font-bold bg-indigo-200 text-indigo-800 px-1 py-0.5 rounded-xs">
                  v1.1.3
                </span>
              </button>
            )}

            {/* User Profile, Login & Logout Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={onOpenUserModal}
                  className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors group cursor-pointer shadow-2xs"
                  title="Xem thông tin & đổi vai trò người dùng"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name.split(' ').pop()?.[0] || 'U'}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </div>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="hidden md:inline text-[11px]">Đăng Xuất</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Đăng nhập tài khoản phòng xét nghiệm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Bar for Tablets & Mobile: Clean responsive grid, zero horizontal scroll */}
        <div className="flex lg:hidden items-center justify-between border-t border-slate-100 py-1.5 overflow-x-hidden">
          <div className="grid grid-cols-7 w-full gap-0.5 sm:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  className={`py-1 px-0.5 text-[10px] font-semibold rounded-md transition-colors flex flex-col items-center justify-center gap-0.5 relative cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-full text-[9px] sm:text-[10px] leading-tight">
                    {item.label}
                  </span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
