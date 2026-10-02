import React, { useState } from 'react';
import { Download, Monitor, CheckCircle2, Copy, Check, ExternalLink, X, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface WindowsInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsInstallModal: React.FC<WindowsInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  // The permanent live URL for this application
  const appUrl = window.location.origin;
  const edgeAppCommand = `start msedge --app=${appUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(edgeAppCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      setTimeout(() => onClose(), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cài Đặt Trên Máy Tính Windows</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Chạy độc lập như phần mềm Desktop, tạo icon ngoài màn hình và chạy mượt cả khi mất mạng
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Status Alert */}
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">Ứng dụng đã được cài đặt trên máy tính!</p>
                <p className="text-xs text-emerald-600 mt-0.5">Bạn có thể mở IQC by ThinhXu từ màn hình Desktop hoặc Start Menu bất cứ lúc nào.</p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Laptop className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Trình duyệt đã sẵn sàng để cài đặt tự động</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Nhấn nút bên dưới để tạo biểu tượng App trên Desktop và thanh Taskbar của Windows.
                  </p>
                </div>
              </div>
              <button
                onClick={handleNativeInstall}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cài Đặt Ngay Vào Windows (1 Chạm)</span>
              </button>
            </div>
          ) : null}

          {/* Section 1: Đường link truy cập trực tiếp */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Đường link cài đặt & truy cập:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden selection:bg-cyan-200"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã chép' : 'Sao chép link'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Hướng dẫn cài đặt thủ công trên Chrome / Edge */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Các bước cài đặt trên trình duyệt Windows (Chrome / Edge):
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  Mở đường link trên bằng <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> trên máy tính Windows.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  Nhìn vào thanh địa chỉ góc phải: Bấm vào biểu tượng <strong>Cài đặt ứng dụng</strong> (Icon máy tính có mũi tên xuống).
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  Hoặc bấm menu <strong>3 chấm (⋮)</strong> $\rightarrow$ chọn <strong>&quot;Cài đặt IQC by ThinhXu&quot;</strong> (Install app) $\rightarrow$ Bấm <strong>Cài đặt</strong>.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <div className="text-slate-600">
                  Icon <strong>IQC by ThinhXu</strong> sẽ xuất hiện trên màn hình Desktop và trong menu Start của Windows.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Lệnh mở dưới dạng Desktop App độc lập */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                3. Lệnh mở dạng Cửa sổ App Windows (Command Prompt / Run):
              </label>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-900 text-cyan-400 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto truncate">
                {edgeAppCommand}
              </code>
              <button
                onClick={handleCopyCommand}
                title="Sao chép lệnh Run"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCmd ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Nhấn tổ hợp phím <strong>Windows + R</strong>, dán lệnh trên vào và Enter để mở ngay như một phần mềm Desktop độc lập không có thanh địa chỉ duyệt web.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold inline-flex items-center gap-1"
          >
            <span>Mở trong tab mới</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
