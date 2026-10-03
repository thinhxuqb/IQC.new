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
  isLoggedIn = true,
  isOnline,
  pendingSyncCount,
  unresolvedCapaCount,
  onOpenUpdateModal,
  labInfo,
  onOpenLabInfoModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: Activity },
    { id: 'chart', label: 'Biểu đồ Levey-Jennings', icon: Activity },
    { id: 'config', label: 'Khai báo & Cấu hình QC', icon: Sliders },
    { id: 'receiver', label: 'Kết nối máy LIS', icon: Radio },
    { id: 'capa', label: 'Xử lý sự cố CAPA', icon: AlertTriangle, badge: unresolvedCapaCount },
    { id: 'reports', label: 'Báo cáo ISO 15189', icon: FileText },
    { id: 'backup', label: 'Sao lưu & Dữ liệu', icon: Database },
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
            <div className="flex flex-col">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onSelectTab('dashboard'); }}
                className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:text-cyan-700 transition-colors"
              >
                <span>IQC by ThinhXu</span>
              </a>
              {labInfo && (
                <button
                  type="button"
                  onClick={onOpenLabInfoModal}
                  title="Nhấp để chỉnh sửa thông tin phòng xét nghiệm"
                  className="text-[11px] text-slate-500 hover:text-indigo-600 truncate max-w-[240px] text-left flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">{labInfo.hospitalName || labInfo.name}</span>
                </button>
              )}
            </div>
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

            {/* Manual Check for Updates Button */}
            {onOpenUpdateModal && (
              <button
                onClick={onOpenUpdateModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/95 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title={`Kiểm tra & Cập nhật phiên bản mới nhất từ GitHub Releases (${APP_CURRENT_VERSION})`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-bold">Cập Nhật</span>
                <span className="text-[10px] font-mono font-bold bg-indigo-200 text-indigo-800 px-1 py-0.5 rounded-xs">
                  {APP_CURRENT_VERSION}
                </span>
              </button>
            )}

            {/* User Profile, Login & Logout Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenUserModal}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors group cursor-pointer shadow-2xs"
                  title="Xem thông tin & đổi vai trò người dùng"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name.split(' ').pop()?.[0] || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 leading-tight flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      <span className="text-[10px] text-cyan-800 font-mono font-normal">
                        @{currentUser.username}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-none">
                      {currentUser.roleTitle.split('/')[0]}
                    </div>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Đăng Xuất</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chưa Đăng Nhập</span>
                </div>

                <button
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Đăng nhập tài khoản phòng xét nghiệm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
