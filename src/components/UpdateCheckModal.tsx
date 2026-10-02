import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  X, 
  Package, 
  Clock, 
  ShieldCheck,
  FileCode,
  Sparkles
} from 'lucide-react';
import { 
  checkGitHubReleaseUpdate, 
  UpdateInfo, 
  APP_CURRENT_VERSION, 
  GITHUB_REPO 
} from '../services/updateService';

interface UpdateCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheckTriggered?: boolean;
}

export const UpdateCheckModal: React.FC<UpdateCheckModalProps> = ({ 
  isOpen, 
  onClose,
  autoCheckTriggered = false
}) => {
  const [checking, setChecking] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState<boolean>(() => {
    return localStorage.getItem('iqc_auto_check_update') !== 'false';
  });
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);

  const performCheck = async () => {
    setChecking(true);
    setErrorMsg(null);
    try {
      const info = await checkGitHubReleaseUpdate();
      setUpdateInfo(info);
    } catch {
      setErrorMsg('Không thể kết nối đến GitHub để kiểm tra bản mới. Vui lòng thử lại sau.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performCheck();
    }
  }, [isOpen]);

  const handleToggleAutoCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoCheckEnabled(val);
    localStorage.setItem('iqc_auto_check_update', val ? 'true' : 'false');
  };

  const handleAcceptUpdate = () => {
    if (!updateInfo?.exeDownloadUrl) return;
    setDownloadStarted(true);
    // Kích hoạt mở link tải file .exe từ GitHub Releases
    window.open(updateInfo.exeDownloadUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Kiểm Tra Bản Cập Nhật Phần Mềm</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-[10px] font-mono text-indigo-300">
                  {APP_CURRENT_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Đồng bộ và tải bộ cài đặt .exe mới nhất từ GitHub Repository
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Checking Spinner */}
          {checking && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Đang truy vấn GitHub API...</p>
                <p className="text-xs text-slate-500 mt-0.5">Kiểm tra phiên bản mới nhất của repo {GITHUB_REPO}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!checking && errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lỗi kiểm tra cập nhật</p>
                <p className="mt-0.5">{errorMsg}</p>
                <button
                  onClick={performCheck}
                  className="mt-2 text-rose-700 underline font-semibold cursor-pointer"
                >
                  Thử lại ngay
                </button>
              </div>
            </div>
          )}

          {/* Results: Case 1 - New Version Available */}
          {!checking && updateInfo && updateInfo.hasUpdate && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm">
                        Có Bản Cập Nhật Mới!
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {updateInfo.latestVersion}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {updateInfo.releaseName}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Ngày phát hành: {new Date(updateInfo.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Release Notes */}
                <div className="bg-white border border-emerald-100 rounded-lg p-3 text-xs text-slate-700 space-y-1 max-h-36 overflow-y-auto font-sans">
                  <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Nội dung thay đổi (Changelog):
                  </p>
                  <div className="whitespace-pre-line text-slate-600">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              </div>

              {/* User Confirmation Buttons (Đồng ý cập nhật hay không) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bạn có muốn cập nhật lên phiên bản này ngay không?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAcceptUpdate}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Đồng ý Cập Nhật</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Để sau / Không cập nhật
                  </button>
                </div>
                {downloadStarted && (
                  <p className="text-[11px] text-emerald-700 text-center font-medium animate-pulse">
                    ✓ Đang tải file cài đặt .exe từ GitHub... Vui lòng mở và cài đè lên bản cũ khi tải xong!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Results: Case 2 - Up To Date */}
          {!checking && updateInfo && !updateInfo.hasUpdate && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Bạn đang sử dụng phiên bản mới nhất!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Phiên bản hiện tại <strong>{APP_CURRENT_VERSION}</strong> là bản phát hành ổn định và đạt chuẩn kiểm tra chất lượng cao nhất.
                  </p>
                </div>
              </div>

              {/* Direct Download .exe link for another Windows PC */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Tải file cài đặt Windows (.exe) trực tiếp:</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Chọn định dạng bạn muốn tải về máy tính Windows:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://github.com/thinhxuqb/IQC.new/releases/download/v1.0.0/IQC-by-ThinhXu-Setup-v1.0.0.exe"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Bộ Cài Setup (.exe)</span>
                  </a>
                  <a
                    href="https://github.com/thinhxuqb/IQC.new/releases/download/v1.0.0/IQC-by-ThinhXu-Portable.exe"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Bản Portable (.exe)</span>
                  </a>
                </div>
                <div className="pt-1 text-center">
                  <a
                    href={`https://github.com/${GITHUB_REPO}/releases`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-indigo-700 underline inline-flex items-center gap-1"
                  >
                    <span>Xem toàn bộ danh sách phiên bản trên GitHub Releases</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Settings: Auto Check Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCheckEnabled}
                onChange={handleToggleAutoCheck}
                className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="font-medium text-slate-700">
                Tự động kiểm tra bản cập nhật mới khi mở ứng dụng
              </span>
            </label>
            
            <button
              onClick={performCheck}
              disabled={checking}
              className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>Kiểm tra lại</span>
            </button>
          </div>

          {/* Quick Notice about Windows SmartScreen */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-800 space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Lưu ý khi cài file .exe trên Windows:</span>
            </div>
            <p className="text-slate-600">
              Nếu Windows hiện thông báo <em>&quot;Windows protected your PC&quot;</em> do ứng dụng mới tạo, hãy bấm <strong>More info</strong> $\rightarrow$ chọn <strong>Run anyway</strong> để cài đặt bình thường.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>GitHub: {GITHUB_REPO}</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
