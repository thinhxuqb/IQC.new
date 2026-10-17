import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuditLog } from '../types/qc';
import { AppStateData, exportBackupData, importBackupData, resetDemoDatabase, saveAuditLog } from '../utils/qcStorage';
import { 
  googleSignIn, 
  googleSignOut, 
  initGoogleAuth, 
  uploadDatabaseToDrive, 
  downloadDatabaseFromDrive, 
  findDriveDatabaseFile, 
  DriveFileInfo,
  SYNC_FILENAME
} from '../services/googleDriveService';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CloudCheck, 
  CloudOff, 
  ShieldCheck, 
  History, 
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Share2,
  Lock,
  Globe,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  X
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

  // Trạng thái Google Drive Auth & Sync
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isDriveLoading, setIsDriveLoading] = useState<boolean>(false);
  const [driveFileInfo, setDriveFileInfo] = useState<DriveFileInfo | null>(null);

  // Modal xác nhận thao tác Google Drive (theo quy chuẩn Workspace)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'UPLOAD' | 'DOWNLOAD';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'UPLOAD',
    title: '',
    description: '',
  });

  // Lắng nghe đăng nhập Google
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        // Quét thông tin tệp trên Drive
        findDriveDatabaseFile(token).then((info) => setDriveFileInfo(info)).catch(() => {});
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setDriveFileInfo(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Đăng nhập Google
  const handleGoogleLogin = async () => {
    setIsDriveLoading(true);
    setImportError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        const info = await findDriveDatabaseFile(res.accessToken);
        setDriveFileInfo(info);
        setImportSuccess(`Đã kết nối tài khoản Google: ${res.user.email}. Sẵn sàng đồng bộ dữ liệu liên máy.`);
      }
    } catch (err: any) {
      setImportError(`Đăng nhập Google thất bại: ${err.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Đăng xuất Google
  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      setDriveFileInfo(null);
      setImportSuccess('Đã đăng xuất tài khoản Google Drive.');
    } catch (err: any) {
      setImportError('Lỗi khi đăng xuất Google.');
    }
  };

  // Làm mới thông tin tệp trên Google Drive
  const handleRefreshDriveInfo = async () => {
    if (!googleToken) return;
    setIsDriveLoading(true);
    try {
      const info = await findDriveDatabaseFile(googleToken);
      setDriveFileInfo(info);
      setImportSuccess('Đã cập nhật trạng thái tệp Google Drive mới nhất.');
    } catch (err: any) {
      setImportError('Không thể kiểm tra tệp trên Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Mở hộp thoại xác nhận đồng bộ lên Drive
  const promptUploadToDrive = () => {
    if (!googleToken) {
      handleGoogleLogin();
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'UPLOAD',
      title: 'Đồng bộ cơ sở dữ liệu lên Google Drive?',
      description: `Thao tác này sẽ lưu toàn bộ ${appState.results.length} kết quả nội kiểm, danh mục thiết bị, xét nghiệm và lô QC hiện tại lên tệp "${SYNC_FILENAME}" trên Google Drive của bạn (${googleUser?.email}). Các máy tính khác trong phòng xét nghiệm có thể tải về để cùng sử dụng chung.`,
    });
  };

  // Mở hộp thoại xác nhận tải từ Drive về
  const promptDownloadFromDrive = () => {
    if (!googleToken) {
      handleGoogleLogin();
      return;
    }
    setConfirmDialog({
      isOpen: true,
      type: 'DOWNLOAD',
      title: 'Tải dữ liệu mới nhất từ Google Drive về máy này?',
      description: `Thao tác này sẽ cập nhật cơ sở dữ liệu trên máy tính này bằng bản sao lưu mới nhất trên Google Drive. Mọi dữ liệu vừa được các máy khác đồng bộ lên sẽ được nạp vào máy này.`,
    });
  };

  // Thực hiện thao tác sau khi người dùng bấm xác nhận
  const handleExecuteConfirmedAction = async () => {
    if (!googleToken) return;
    const actionType = confirmDialog.type;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setIsDriveLoading(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      if (actionType === 'UPLOAD') {
        const res = await uploadDatabaseToDrive(googleToken, appState);
        const updatedInfo = await findDriveDatabaseFile(googleToken);
        setDriveFileInfo(updatedInfo);

        const log: AuditLog = {
          id: `log_drive_upload_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: appState.currentUser.id,
          userName: appState.currentUser.name,
          role: appState.currentUser.role,
          action: 'ĐỒNG_BỘ_GOOGLE_DRIVE_LÊN_MÂY',
          details: `Đã đồng bộ ${appState.results.length} kết quả QC lên Google Drive (Tệp: ${SYNC_FILENAME}, ID: ${res.fileId}).`,
        };
        saveAuditLog(log);
        onRestoreState({ ...appState, logs: [log, ...appState.logs] });

        setImportSuccess(`Đã đồng bộ cơ sở dữ liệu lên Google Drive thành công! Thời gian: ${new Date(res.modifiedTime).toLocaleTimeString('vi-VN')}.`);
      } else {
        const { data: restoredData, modifiedTime } = await downloadDatabaseFromDrive(googleToken);
        
        const log: AuditLog = {
          id: `log_drive_download_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: appState.currentUser.id,
          userName: appState.currentUser.name,
          role: appState.currentUser.role,
          action: 'NẠP_DỮ_LIỆU_TỪ_GOOGLE_DRIVE',
          details: `Đã tải cơ sở dữ liệu đồng bộ từ Google Drive về máy này (${restoredData.results.length} kết quả QC).`,
        };
        saveAuditLog(log);
        onRestoreState({ ...restoredData, logs: [log, ...restoredData.logs] });

        setImportSuccess(`Đã nạp thành công ${restoredData.results.length} kết quả QC từ Google Drive về máy tính hiện tại!`);
      }
    } catch (err: any) {
      console.error('Lỗi thao tác Drive:', err);
      setImportError(`Thao tác Google Drive thất bại: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Tải file backup JSON về máy
  const handleExportBackup = () => {
    const jsonStr = exportBackupData(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LAB_QC_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Nạp file backup JSON từ máy tính
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
    <div className="space-y-6 w-full">
      {/* SECTION CHÍNH: GOOGLE DRIVE CLOUD SYNC ĐỒNG BỘ ĐA MÁY TRẠM */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-900/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Đồng Bộ Google Drive Dùng Chung Cho Nhiều Máy Tính
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  Multi-PC Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Tất cả dữ liệu nội kiểm (kết quả chạy máy, cấu hình Mean/SD, lô QC, hồ sơ CAPA) được đồng bộ an toàn qua Google Drive cá nhân của bạn, cho phép nhiều máy tính phòng xét nghiệm cùng làm việc và dùng chung nguồn dữ liệu thời gian thực.
              </p>
            </div>
          </div>

          {/* Trạng thái tài khoản Google */}
          <div className="flex items-center gap-2 shrink-0">
            {googleUser ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt="" className="w-6 h-6 rounded-full border border-cyan-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    {googleUser.displayName?.[0] || 'G'}
                  </div>
                )}
                <div className="text-left">
                  <div className="font-semibold text-slate-200 text-[11px] truncate max-w-[150px]">
                    {googleUser.displayName || 'Tài khoản Google'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                    {googleUser.email}
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="ml-2 text-[10px] text-rose-300 hover:text-rose-100 font-semibold px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 transition-colors cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isDriveLoading}
                className="gsi-material-button py-2 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer border border-slate-300 disabled:opacity-60"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isDriveLoading ? 'Đang xác thực...' : 'Đăng nhập Google để đồng bộ'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bảng điều khiển tác vụ Google Drive */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Cột 1: Thông tin tệp trên Google Drive */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 font-semibold uppercase text-[11px]">
                <span>Tệp Đồng Bộ Trên Drive</span>
                <button
                  onClick={handleRefreshDriveInfo}
                  disabled={!googleToken || isDriveLoading}
                  className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40 cursor-pointer"
                  title="Làm mới trạng thái tệp"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDriveLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="mt-2 font-mono text-sm font-bold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>{SYNC_FILENAME}</span>
              </div>
              <div className="mt-2 space-y-1 text-slate-300 text-[11px] font-mono">
                {driveFileInfo?.exists ? (
                  <>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Trạng thái:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã sẵn sàng trên Cloud
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Cập nhật lúc:</span>
                      <span className="text-slate-200">
                        {driveFileInfo.modifiedTime ? new Date(driveFileInfo.modifiedTime).toLocaleString('vi-VN') : 'Mới tạo'}
                      </span>
                    </p>
                    {Boolean(driveFileInfo.size) && (
                      <p className="flex justify-between">
                        <span className="text-slate-400">Dung lượng:</span>
                        <span className="text-slate-200">{Math.round((driveFileInfo.size || 0) / 1024)} KB</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-amber-300/80 py-1">
                    {googleToken 
                      ? 'Chưa có tệp đồng bộ trên Drive. Nhấp nút "Đồng bộ lên Google Drive" bên cạnh để khởi tạo.'
                      : 'Đăng nhập Google để xem trạng thái tệp.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cột 2: Nút Đẩy dữ liệu lên Drive */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[11px] block">
                Từ Máy Này → Google Drive
              </span>
              <p className="text-slate-300 text-xs mt-1">
                Lưu toàn bộ dữ liệu nội kiểm máy hiện tại ({appState.results.length} kết quả, {appState.assays.length} xét nghiệm) lên Google Drive để các máy tính khác tải về.
              </p>
            </div>
            <button
              onClick={promptUploadToDrive}
              disabled={isDriveLoading}
              className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-200" />
              <span>{isDriveLoading ? 'Đang xử lý...' : 'Đồng Bộ Ngay Lên Google Drive'}</span>
            </button>
          </div>

          {/* Cột 3: Nút Nạp dữ liệu từ Drive về máy này */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[11px] block">
                Google Drive → Máy Tính Này
              </span>
              <p className="text-slate-300 text-xs mt-1">
                Tải bản cơ sở dữ liệu mới nhất được đồng bộ từ các máy tính khác về máy này để cập nhật đầy đủ kết quả toàn viện.
              </p>
            </div>
            <button
              onClick={promptDownloadFromDrive}
              disabled={isDriveLoading || !driveFileInfo?.exists}
              className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-40"
            >
              <ArrowDownLeft className="w-4 h-4 text-cyan-200" />
              <span>{isDriveLoading ? 'Đang tải...' : 'Tải Dữ Liệu Mới Nhất Về Máy Này'}</span>
            </button>
          </div>
        </div>
      </div>

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
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onToggleOnline}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 underline cursor-pointer"
            >
              Mô phỏng {isOnline ? 'mất mạng (Offline)' : 'có mạng lại'}
            </button>
            <button
              onClick={onForceSync}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>

        {/* Card 2: Database Size & Counts (Toàn bộ bộ đếm thực tế) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dung Lượng Cơ Sở Dữ Liệu Thực Tế
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {appState.results.length}
              </span>
              <span className="text-xs text-slate-500">lần chạy QC đã lưu</span>
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-1 font-mono max-h-32 overflow-y-auto pr-1">
              {appState.instruments.map((inst) => {
                const count = appState.results.filter((r) => r.instrumentId === inst.id).length;
                return (
                  <p key={inst.id} className="flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[170px]">• {inst.code || inst.id} ({inst.name}):</span>
                    <strong className="text-slate-900 ml-1">{count} bản ghi</strong>
                  </p>
                );
              })}
              <p className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100">
                <span>• Số xét nghiệm hoạt động:</span>
                <strong className="text-slate-900">{appState.assays.length} chỉ số</strong>
              </p>
              <p className="flex justify-between items-center text-[11px]">
                <span>• Lô QC (Control Lots):</span>
                <strong className="text-slate-900">{appState.lots.length} lô</strong>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Toàn vẹn dữ liệu y khoa chuẩn ISO 15189</span>
          </div>
        </div>

        {/* Card 3: Local File Backup & Restore */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sao Lưu Cục Bộ (Tệp .JSON)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                Offline Backup
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleExportBackup}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer font-medium"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {importSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
          <button 
            onClick={() => setImportSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
          <button 
            onClick={() => setImportError(null)}
            className="text-rose-700 hover:text-rose-900 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Audit Trail Register */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Nhật Ký Kiểm Toán Toàn Vẹn Dữ Liệu (Audit Trail)
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
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2.5 font-bold text-slate-800">{log.userName}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600 max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XÁC NHẬN THAO TÁC GOOGLE DRIVE (MANDATORY THEO CHUẨN WORKSPACE INTEGRATION) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmDialog.type === 'UPLOAD' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {confirmDialog.type === 'UPLOAD' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>Tài khoản Google:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{googleUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Tên tệp trên Drive:</span>
                <span className="font-bold text-indigo-700">{SYNC_FILENAME}</span>
              </div>
              <div className="flex justify-between">
                <span>Số bản ghi QC:</span>
                <span className="font-bold text-slate-900">{appState.results.length} kết quả</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                  confirmDialog.type === 'UPLOAD' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Xác Nhận Tiến Hành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
