import React from 'react';
import { UserProfile, UserRole } from '../types/qc';
import { INITIAL_USERS } from '../utils/initialData';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UserRoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const UserRoleSwitcherModal: React.FC<UserRoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const rolePermissions: Record<UserRole, { title: string; permissions: string[]; badgeColor: string }> = {
    director: {
      title: 'Trưởng Khoa Xét Nghiệm / Bác Sĩ Trưởng',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
      permissions: [
        'Ký duyệt và thẩm định hồ sơ sự cố CAPA mức Reject',
        'Ký duyệt Báo cáo nội kiểm QC định kỳ (PDF) gửi Sở Y Tế / Tổ chức ISO',
        'Phê duyệt và khóa dữ liệu QC tháng',
        'Thiết lập chỉ số TEa mục tiêu và chuẩn kiểm định CLIA',
        'Toàn quyền quản trị phân quyền hệ thống',
      ],
    },
    manager: {
      title: 'Quản Lý Chất Lượng QC / KTV Trưởng',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
      permissions: [
        'Cấu hình danh mục xét nghiệm và các Lô QC (Lots)',
        'Thẩm định ban đầu nguyên nhân gốc rễ và xử lý vi phạm Westgard',
        'Khởi tạo và xuất báo cáo nội kiểm định kỳ',
        'Cấu hình bộ quy tắc Westgard cho từng dòng máy',
        'Sao lưu và phục hồi dữ liệu hệ thống',
      ],
    },
    technician: {
      title: 'Kỹ Thuật Viên Xét Nghiệm',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      permissions: [
        'Chạy mẫu QC và nhận kết quả tự động từ AU400, Sysmex 800, Cobas e411',
        'Nhập bổ sung kết quả QC thủ công khi cần thiết',
        'Ghi nhận ban đầu sự cố vi phạm cảnh báo 1-2s hoặc từ chối 1-3s',
        'Chạy lại mẫu QC kiểm chứng sau khi khắc phục',
        'Xem biểu đồ Levey-Jennings thời gian thực',
      ],
    },
    auditor: {
      title: 'Chuyên Viên Kiểm Toán Chất Lượng',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      permissions: [
        'Tra cứu toàn bộ lịch sử chạy QC và biểu đồ Levey-Jennings (Chỉ đọc)',
        'Kiểm tra nhật ký kiểm toán (Audit Trail) tính toàn vẹn dữ liệu',
        'Xem và trích xuất báo cáo chất lượng định kỳ phục vụ tái cấp chứng chỉ',
        'Không được can thiệp sửa đổi kết quả xét nghiệm',
      ],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Phân Quyền Người Dùng & Chuyển Đổi Vai Trò
              </h3>
              <p className="text-xs text-slate-500">
                Chuẩn an ninh thông tin & truy vết trách nhiệm phòng xét nghiệm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Hệ thống hỗ trợ cơ chế phân quyền 4 cấp độ nghiêm ngặt. Để kiểm tra quy trình ký duyệt CAPA hoặc xuất báo cáo chính thức, bạn có thể chọn nhanh nhân sự tương ứng bên dưới.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INITIAL_USERS.map((user) => {
              const isSelected = currentUser.id === user.id;
              const roleInfo = rolePermissions[user.role];
              return (
                <div
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-50/40 ring-2 ring-cyan-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-cyan-600 inline" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Mã NV: {user.code}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${roleInfo.badgeColor}`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-700 font-medium border-t border-slate-200/60 pt-2">
                    {user.roleTitle}
                  </div>

                  <div className="mt-2 space-y-1">
                    {roleInfo.permissions.slice(0, 3).map((perm, idx) => (
                      <div key={idx} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                        <span className="line-clamp-1">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Người dùng hiện tại: <strong className="text-slate-900">{currentUser.name}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
