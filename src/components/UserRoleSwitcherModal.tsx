import React from 'react';
import { UserProfile } from '../types/qc';
import { ShieldCheck, CheckCircle, X, LogOut, KeyRound, Lock } from 'lucide-react';

interface UserRoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onRequestSwitchAccount?: () => void;
}

export const UserRoleSwitcherModal: React.FC<UserRoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRequestSwitchAccount,
}) => {
  if (!isOpen) return null;

  const permissionItems = [
    { key: 'canInputQC', label: 'Nhập kết quả QC thủ công & nhận tín hiệu máy LIS', enabled: currentUser.permissions?.canInputQC },
    { key: 'canEditMeanSD', label: 'Hiệu chỉnh giá trị Mean & SD (Lịch sửa cập nhật Mean/SD)', enabled: currentUser.permissions?.canEditMeanSD },
    { key: 'canApproveCapa', label: 'Thẩm định và phê duyệt hồ sơ khắc phục sự cố CAPA', enabled: currentUser.permissions?.canApproveCapa },
    { key: 'canManageConfig', label: 'Quản trị Thiết bị, Xét nghiệm, Vật liệu & Map kiểm chuẩn', enabled: currentUser.permissions?.canManageConfig },
    { key: 'canManageUsers', label: 'Quản lý tài khoản người dùng & phân quyền truy cập', enabled: currentUser.permissions?.canManageUsers },
    { key: 'canExportReports', label: 'Xuất và in Báo cáo nội kiểm định kỳ A4 (PDF)', enabled: currentUser.permissions?.canExportReports },
    { key: 'canEditLabInfo', label: 'Cấu hình thông tin Phòng xét nghiệm & tải Logo bệnh viện', enabled: currentUser.permissions?.canEditLabInfo ?? currentUser.permissions?.canManageConfig },
    { key: 'canResetDatabase', label: 'Sao lưu, phục hồi và đặt lại cơ sở dữ liệu hệ thống', enabled: currentUser.permissions?.canResetDatabase },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold">
                Thông Tin Tài Khoản & Quyền Hạn Hiện Tại
              </h3>
              <p className="text-[11px] text-slate-300">
                Kiểm soát truy cập nghiêm ngặt theo tài khoản đăng nhập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/50 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{currentUser.name}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                  @{currentUser.username}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">{currentUser.roleTitle}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Mã NV: {currentUser.code} · Đơn vị: {currentUser.department}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              Đang đăng nhập
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh sách quyền hạn được cấp cho tài khoản này:
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {permissionItems.map((item) => (
                <div key={item.key} className="px-3.5 py-2.5 flex items-center justify-between text-xs bg-white">
                  <span className={item.enabled ? 'text-slate-800 font-medium' : 'text-slate-400 line-through'}>
                    {item.label}
                  </span>
                  {item.enabled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Được phép
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3" />
                      Giới hạn
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
            <strong>Quy tắc bảo mật:</strong> Việc chuyển đổi tài khoản yêu cầu xác thực đúng tên đăng nhập và mật khẩu. Tài khoản <strong>admin</strong> mặc định giữ toàn quyền quản trị hệ thống.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          {onRequestSwitchAccount ? (
            <button
              onClick={() => {
                onClose();
                onRequestSwitchAccount();
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đổi Tài Khoản Khác (Nhập Mật Khẩu)</span>
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
