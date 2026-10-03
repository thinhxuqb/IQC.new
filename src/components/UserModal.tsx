import React, { useState } from 'react';
import { UserPermissions, UserProfile, UserRole } from '../types/qc';
import { X, UserPlus, Check, AlertCircle, Shield, KeyRound, Lock } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserProfile | null;
  onSave: (user: UserProfile) => void;
}

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  director: {
    canInputQC: true,
    canEditMeanSD: true,
    canApproveCapa: true,
    canManageConfig: true,
    canManageUsers: true,
    canExportReports: true,
    canResetDatabase: true,
  },
  manager: {
    canInputQC: true,
    canEditMeanSD: true,
    canApproveCapa: true,
    canManageConfig: true,
    canManageUsers: true,
    canExportReports: true,
    canResetDatabase: false,
  },
  technician: {
    canInputQC: true,
    canEditMeanSD: false,
    canApproveCapa: false,
    canManageConfig: false,
    canManageUsers: false,
    canExportReports: true,
    canResetDatabase: false,
  },
  auditor: {
    canInputQC: false,
    canEditMeanSD: false,
    canApproveCapa: false,
    canManageConfig: false,
    canManageUsers: false,
    canExportReports: true,
    canResetDatabase: false,
  },
};

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSave,
}) => {
  const isEditing = Boolean(userToEdit);

  const [username, setUsername] = useState<string>(userToEdit?.username || '');
  const [password, setPassword] = useState<string>(userToEdit?.password || '123');
  const [name, setName] = useState<string>(userToEdit?.name || '');
  const [code, setCode] = useState<string>(userToEdit?.code || '');
  const [role, setRole] = useState<UserRole>(userToEdit?.role || 'technician');
  const [department, setDepartment] = useState<string>(userToEdit?.department || 'Khoa Xét Nghiệm');
  const [phone, setPhone] = useState<string>(userToEdit?.phone || '');
  const [email, setEmail] = useState<string>(userToEdit?.email || '');
  const [active, setActive] = useState<boolean>(userToEdit ? userToEdit.active : true);
  const [permissions, setPermissions] = useState<UserPermissions>(
    userToEdit?.permissions || DEFAULT_ROLE_PERMISSIONS['technician']
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Tự động gán quyền theo vai trò nếu tạo mới hoặc muốn đồng bộ
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole]);
  };

  const getRoleTitle = (r: UserRole): string => {
    switch (r) {
      case 'director':
        return 'Trưởng khoa Xét nghiệm / Bác sĩ duyệt chuyên môn';
      case 'manager':
        return 'Kỹ thuật viên trưởng / Quản lý chất lượng ISO 15189';
      case 'technician':
        return 'Kỹ thuật viên thực hiện xét nghiệm';
      case 'auditor':
        return 'Chuyên viên Đánh giá Độc lập (ISO Auditor)';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên nhân viên.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập (username).');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Vui lòng đặt mật khẩu đăng nhập.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const userId = isEditing && userToEdit ? userToEdit.id : `user_${Date.now()}`;

    const updatedUser: UserProfile = {
      id: userId,
      username: cleanUsername,
      password: password.trim(),
      name: name.trim(),
      role,
      roleTitle: getRoleTitle(role),
      department: department.trim() || 'Khoa Xét Nghiệm',
      code: code.trim() || `NV-${Math.floor(Math.random() * 1000)}`,
      phone: phone.trim() || '0900.000.000',
      email: email.trim() || `${cleanUsername}@medlab.vn`,
      active,
      permissions,
    };

    onSave(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isEditing ? 'Chỉnh Sửa & Cấp Quyền Người Dùng' : 'Khai Báo Người Dùng Mới'}
              </h3>
              <p className="text-xs text-slate-300">
                Phân quyền truy cập & bảo mật tài khoản chuẩn ISO 15189
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và Tên Nhân Viên (*):
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: CN. Lê Hoàng Nam"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Nhân Viên:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: KTV-099"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Tài khoản & Mật khẩu */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-700" />
              Thông Tin Đăng Nhập Hệ Thống
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tên Đăng Nhập (Username) (*):
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nam.le hoặc ktv099"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mật Khẩu Đăng Nhập (*):
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (vd: 123)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vai Trò Chính (Role) (*):
              </label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white font-semibold"
              >
                <option value="director">Trưởng khoa / Bác sĩ duyệt chuyên môn</option>
                <option value="manager">Kỹ thuật viên trưởng / Quản lý chất lượng</option>
                <option value="technician">Kỹ thuật viên xét nghiệm</option>
                <option value="auditor">Chuyên viên Đánh giá Độc lập (Auditor)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khoa / Bộ Phận:
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Khoa Hóa Sinh - Huyết Học..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Ma trận cấp quyền (Permission Matrix) */}
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-700" />
              Ma Trận Cấp Quyền Chi Tiết (Role & Permissions)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canInputQC}
                  onChange={(e) => setPermissions({ ...permissions, canInputQC: e.target.checked })}
                  className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-medium">Nhập QC thủ công & nhận LIS</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canEditMeanSD}
                  onChange={(e) => setPermissions({ ...permissions, canEditMeanSD: e.target.checked })}
                  className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-bold text-cyan-900">
                  Sửa Mean & SD có lưu vết
                </span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canApproveCapa}
                  onChange={(e) => setPermissions({ ...permissions, canApproveCapa: e.target.checked })}
                  className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-medium">Phê duyệt sự cố CAPA</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canManageConfig}
                  onChange={(e) => setPermissions({ ...permissions, canManageConfig: e.target.checked })}
                  className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-medium">Cấu hình máy, xét nghiệm, lô QC</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canManageUsers}
                  onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                  className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-medium">Khai báo người dùng & cấp quyền</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.canExportReports}
                  onChange={(e) => setPermissions({ ...permissions, canExportReports: e.target.checked })}
                  className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-800 font-medium">Xuất báo cáo PDF & In sổ</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="user_active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="user_active" className="text-xs text-slate-700 font-medium cursor-pointer">
              Tài khoản đang hoạt động (Được phép đăng nhập hệ thống)
            </label>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Lưu Phân Quyền' : 'Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
