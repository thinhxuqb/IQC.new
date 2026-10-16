import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/qc';
import { User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  strictMode?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  users,
  onLoginSuccess,
  onClose,
  strictMode = false,
}) => {
  const [selectedUsername, setSelectedUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const inputUsername = selectedUsername.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUsername) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (!inputPass) {
      setErrorMsg('Vui lòng nhập mật khẩu xác thực.');
      return;
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === inputUsername
    );

    if (!foundUser) {
      setErrorMsg('Tài khoản không tồn tại trong hệ thống. Tài khoản quản trị mặc định là "admin".');
      return;
    }

    if (!foundUser.active) {
      setErrorMsg('Tài khoản này đã bị khóa. Vui lòng liên hệ Quản trị viên (admin) để kích hoạt lại.');
      return;
    }

    const validPassword = foundUser.password || '123';
    const isAdminDefault =
      foundUser.username.toLowerCase() === 'admin' &&
      (validPassword === '123' || validPassword === 'admin') &&
      (inputPass === '123' || inputPass === 'admin');

    if (inputPass !== validPassword && !isAdminDefault) {
      setErrorMsg('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      return;
    }

    onLoginSuccess(foundUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header with Simple TX Logo */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl tracking-tight shadow-md border-2 border-cyan-400/50 select-none">
            TX
          </div>
          <h2 className="text-base font-bold tracking-tight">
            Đăng Nhập Hệ Thống IQC by ThinhXu
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Yêu cầu xác thực tài khoản trước khi truy cập dữ liệu xét nghiệm
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
              placeholder="Nhập tên đăng nhập (mặc định: admin)"
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900"
              required
              autoFocus
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
                placeholder="Nhập mật khẩu..."
                className="w-full pl-3 pr-10 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Xác Thực & Đăng Nhập</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!strictMode && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
          )}

          {/* Thông tin tài khoản Admin mặc định */}
          <div className="pt-3 border-t border-slate-200">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tài khoản Quản Trị Mặc Định (Full Quyền):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUsername('admin');
                    setPassword('123');
                    setErrorMsg('');
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Điền nhanh Admin
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono bg-white px-2.5 py-1.5 rounded border border-slate-200">
                <span>Username: <strong className="text-slate-900">admin</strong></span>
                <span>Mật khẩu mặc định: <strong className="text-slate-900">123</strong> (hoặc <strong className="text-slate-900">admin</strong>)</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Chỉ tài khoản <strong>admin</strong> mặc định mới có toàn quyền hệ thống. Các tài khoản nhân viên khác do Admin tạo và phân quyền trong mục Cấu hình QC.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
