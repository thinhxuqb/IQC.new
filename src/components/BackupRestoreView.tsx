import React, { useState } from 'react';
import { AuditLog, Instrument, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { AppStateData, exportBackupData, importBackupData, resetDemoDatabase } from '../utils/qcStorage';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CloudCheck, 
  CloudOff, 
  ShieldCheck, 
  FileCheck, 
  History, 
  AlertTriangle,
  CheckCircle,
  FolderArchive,
  ExternalLink
} from 'lucide-react';

interface BackupRestoreViewProps {
  appState: AppStateData;
  isOnline: boolean;
  onToggleOnline: () => void;
  onRestoreState: (newState: AppStateData) => void;
  onForceSync: () => void;
  onOpenUpdateModal?: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  appState,
  isOnline,
  onToggleOnline,
  onRestoreState,
  onForceSync,
  onOpenUpdateModal,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState<string>('');

  // Tải file backup JSON
  const handleExportBackup = () => {
    const jsonStr = exportBackupData(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LAB_QC_BACKUP_ISO15189_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Nạp file backup JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const restored = importBackupData(text);
        if (restored) {
          onRestoreState(restored);
          setImportSuccess('Khôi phục cơ sở dữ liệu nội kiểm thành công từ tệp sao lưu!');
          setImportError(null);
        } else {
          setImportError('Tệp sao lưu không đúng định dạng chuẩn của hệ thống QC.');
          setImportSuccess(null);
        }
      } catch (err) {
        setImportError('Lỗi đọc tệp dữ liệu. Vui lòng kiểm tra lại file .json.');
        setImportSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  // Đặt lại dữ liệu mẫu
  const handleResetDemo = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại cơ sở dữ liệu về tập dữ liệu mẫu chuẩn y tế 30 ngày? Mọi kết quả vừa nhập sẽ được làm mới.')) {
      const reset = resetDemoDatabase();
      onRestoreState(reset);
      setImportSuccess('Đã khôi phục dữ liệu mẫu chuẩn y tế 30 ngày cho AU400, Sysmex 800 và Cobas e411.');
    }
  };

  const filteredLogs = appState.logs.filter((l) => 
    l.action.toLowerCase().includes(searchLog.toLowerCase()) ||
    l.details.toLowerCase().includes(searchLog.toLowerCase()) ||
    l.userName.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cloud Sync & Connectivity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cloud Sync State */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Trạng Thái Kết Nối Đám Mây
              </span>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isOnline ? (
                <>
                  <CloudCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-bold text-slate-900">Trực Tuyến (Online)</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-5 h-5 text-amber-600" />
                  <span className="text-base font-bold text-amber-800">Ngoại Tuyến (Offline Mode)</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kiến trúc Offline-First: Dữ liệu luôn an toàn trên máy trạm và tự động đồng bộ khi có mạng.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onToggleOnline}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
            >
              Mô phỏng {isOnline ? 'mất mạng (Offline)' : 'có mạng lại'}
            </button>
            <button
              onClick={onForceSync}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>

        {/* Card 2: Database Size & Counts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dung Lượng Cơ Sở Dữ Liệu
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {appState.results.length}
              </span>
              <span className="text-xs text-slate-500">lần chạy QC đã lưu</span>
            </div>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5 font-mono">
              <p>• AU400 Sinh hóa: {appState.results.filter(r => r.instrumentId === 'AU400').length} bản ghi</p>
              <p>• Sysmex 800 Huyết học: {appState.results.filter(r => r.instrumentId === 'SYSMEX800').length} bản ghi</p>
              <p>• Cobas e411 Miễn dịch: {appState.results.filter(r => r.instrumentId === 'COBASE411').length} bản ghi</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
            ✓ Mã hóa toàn vẹn dữ liệu chuẩn y khoa ISO 15189
          </div>
        </div>

        {/* Card 3: Backup & Restore Actions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sao Lưu & Phục Hồi Dữ Liệu
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Xuất tệp sao lưu dự phòng định dạng JSON chuẩn hoặc phục hồi khi chuyển đổi máy tính phòng lab.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleExportBackup}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tải Tệp Sao Lưu Dự Phòng (.json)</span>
            </button>

            <div className="flex items-center gap-2">
              <label className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Nạp Tệp Phục Hồi</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleResetDemo}
                title="Khôi phục lại dữ liệu mẫu 30 ngày"
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Update & Full Source ZIP Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold">Cập Nhật Mã Nguồn Lên GitHub (Tự Động Build .EXE)</h4>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Tải gói mã nguồn nén (.ZIP) chứa toàn bộ các chỉnh sửa mới nhất (Khai báo User, Phân quyền, Đăng nhập mật khẩu, Sửa Mean/SD có lưu vết) để cập nhật kho GitHub và kích hoạt tự động đóng gói file .exe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenUpdateModal && (
            <button
              onClick={onOpenUpdateModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kiểm Tra Cập Nhật Thủ Công</span>
            </button>
          )}
          <a
            href="/iqc-full-source.zip"
            download="IQC-Full-Source-Update.zip"
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Tải Mã Nguồn (.ZIP)</span>
          </a>
          <a
            href="https://github.com/thinhxuqb/IQC.new"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Mở GitHub Repo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Notifications */}
      {importSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importSuccess}</span>
        </div>
      )}

      {importError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* ISO 15189 Audit Trail Register */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Nhật Ký Kiểm Toán Toàn Vẹn Dữ Liệu (ISO 15189 Audit Trail)
            </h3>
          </div>
          <input
            type="text"
            placeholder="Tìm theo hành động, nhân sự..."
            value={searchLog}
            onChange={(e) => setSearchLog(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-64 focus:outline-hidden focus:border-cyan-600"
          />
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-2.5">Thời Gian</th>
                <th className="p-2.5">Nhân Sự Thực Hiện</th>
                <th className="p-2.5">Vai Trò</th>
                <th className="p-2.5">Hành Động</th>
                <th className="p-2.5">Nội Dung Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString('vi-VN')} {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                  </td>
                  <td className="p-2.5 font-sans font-medium text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="p-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-slate-100 text-slate-700">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="p-2.5 font-sans text-slate-600">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
