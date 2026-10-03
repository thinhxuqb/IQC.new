import React, { useState } from 'react';
import { UserProfile } from '../types/qc';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  users,
  onLoginSuccess,
  onClose,
}) => {
  const [selectedUsername, setSelectedUsername] = useState<string>(users[0]?.username || 'hung.nguyen');
  const [password, setPassword] = useState<string>('123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === selectedUsername.trim().toLowerCase()
    );

    if (!foundUser) {
      setErrorMsg('Tên đăng nhập không tồn tại trong hệ thống.');
      return;
    }

    if (!foundUser.active) {
      setErrorMsg('Tài khoản này đã bị khóa. Vui lòng liên hệ Trưởng khoa để kích hoạt lại.');
      return;
    }

    // Kiểm tra mật khẩu (mặc định là 123 nếu chưa đặt)
    const validPassword = foundUser.password || '123';
    if (password.trim() !== validPassword) {
      setErrorMsg('Mật khẩu không chính xác. Mật khẩu mẫu là "123".');
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleSelectQuickUser = (user: UserProfile) => {
    setSelectedUsername(user.username);
    setPassword(user.password || '123');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-sm border border-cyan-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold tracking-tight">
            Đăng Nhập Hệ Thống Nội Kiểm IQC
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Quản lý chất lượng xét nghiệm y khoa chuẩn ISO 15189
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-700" />
              <span>Tên Đăng Nhập (Username):</span>
            </label>
            <input
              type="text"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              placeholder="VD: hung.nguyen, mai.le, tuan.tran..."
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-700" />
              <span>Mật Khẩu Đăng Nhập:</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (Mặc định: 123)"
                className="w-full pl-3 pr-10 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-600 block mt-1">
              Mật khẩu mặc định của tất cả tài khoản mẫu là: <strong className="font-mono text-cyan-800">123</strong>
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Đăng Nhập Hệ Thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Danh sách chọn nhanh tài khoản mẫu */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Chọn nhanh tài khoản mẫu để đăng nhập:
            </span>
            <div className="space-y-1.5">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleSelectQuickUser(u)}
                  className={`w-full text-left p-2 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    selectedUsername.toLowerCase() === u.username.toLowerCase()
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{u.name}</span>
                    <span className="text-[10px] text-slate-600 block">{u.roleTitle}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold text-cyan-800 block">
                      @{u.username}
                    </span>
                    <span className="text-[10px] text-slate-600 block">Pass: 123</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
