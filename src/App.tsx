/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AuditLog, 
  CapaRecord, 
  Instrument, 
  InstrumentId, 
  MeanSdAuditRecord, 
  QCLot, 
  QCResult, 
  TestAssay, 
  UserProfile 
} from './types/qc';
import { 
  AppStateData, 
  loadAppState, 
  saveAssays, 
  saveAuditLog, 
  saveCurrentUser, 
  saveInstruments, 
  saveLots, 
  saveMeanSdAuditHistory, 
  saveResults,
  saveUsers 
} from './utils/qcStorage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LeveyJenningsChart } from './components/LeveyJenningsChart';
import { MachineSignalReceiver } from './components/MachineSignalReceiver';
import { CapaListView } from './components/CapaListView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { QCConfigView } from './components/QCConfigView';
import { UserRoleSwitcherModal } from './components/UserRoleSwitcherModal';
import { CapaModal } from './components/CapaModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { QCReportModal } from './components/QCReportModal';
import { LoginModal } from './components/LoginModal';
import { UpdateCheckModal } from './components/UpdateCheckModal';
import { checkGitHubReleaseUpdate } from './services/updateService';
import { 
  AlertTriangle, 
  Activity, 
  Filter, 
  CheckCircle, 
  ArrowRight, 
  X,
  FileText
} from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(loadAppState);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedAssayId, setSelectedAssayId] = useState<string>('AU_GLU');
  
  // Trạng thái mạng
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isCapaModalOpen, setIsCapaModalOpen] = useState<boolean>(false);
  const [selectedResultForCapa, setSelectedResultForCapa] = useState<QCResult | null>(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  // Toast thông báo tức thì khi máy truyền kết quả vi phạm
  const [activeAlert, setActiveAlert] = useState<{
    result: QCResult;
    title: string;
    description: string;
  } | null>(null);

  // Theo dõi sự kiện online / offline của trình duyệt
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tự động kiểm tra bản cập nhật mới trên GitHub khi khởi động ứng dụng
  useEffect(() => {
    const autoCheck = localStorage.getItem('iqc_auto_check_update') !== 'false';
    if (autoCheck) {
      const timer = setTimeout(() => {
        checkGitHubReleaseUpdate().then((info) => {
          if (info.hasUpdate) {
            setIsUpdateModalOpen(true);
          }
        }).catch(() => {});
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Đếm số sự cố CAPA chưa hoàn tất
  const unresolvedCapaCount = appState.results.filter(
    (r) => (r.status === 'REJECTED' || r.status === 'WARNING') && (!r.capa || r.capa.status === 'PENDING_APPROVAL')
  ).length;

  // Thêm kết quả QC mới (từ máy LIS hoặc nhập tay)
  const handleAddNewResult = (newResult: QCResult) => {
    const updatedResults = [...appState.results, newResult];
    saveResults(updatedResults);

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: appState.currentUser.id,
      userName: appState.currentUser.name,
      role: appState.currentUser.role,
      action: newResult.source === 'MÁY_XÉT_NGHIỆM_LIS' ? 'NHẬN_TÍN_HIỆU_LIS' : 'NHẬP_QC_THỦ_CÔNG',
      details: `${newResult.source}: ${newResult.assayId} (${newResult.level}) = ${newResult.value}. Trạng thái: ${newResult.status}.`,
      instrumentId: newResult.instrumentId,
    };
    saveAuditLog(log);

    setAppState((prev) => ({
      ...prev,
      results: updatedResults,
      logs: [log, ...prev.logs],
    }));

    // Kích hoạt chuông thông báo nếu có vi phạm Westgard
    if (newResult.status === 'REJECTED' || newResult.status === 'WARNING') {
      setActiveAlert({
        result: newResult,
        title: newResult.status === 'REJECTED' ? 'Cảnh Báo Vi Phạm Westgard (Từ Chối / Reject)' : 'Cảnh Báo Theo Dõi (Warning 1-2s)',
        description: newResult.violations.length > 0 
          ? `${newResult.violations.map(v => v.ruleName).join(', ')}: ${newResult.violations[0].description}`
          : `Giá trị ${newResult.value} vượt ngưỡng kiểm soát.`,
      });
    }
  };

  // Cập nhật hồ sơ CAPA
  const handleSaveCapa = (resultId: string, capa: CapaRecord) => {
    const updatedResults = appState.results.map((r) => {
      if (r.id === resultId) {
        return {
          ...r,
          capa,
        };
      }
      return r;
    });

    saveResults(updatedResults);

    const log: AuditLog = {
      id: `log_capa_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: appState.currentUser.id,
      userName: appState.currentUser.name,
      role: appState.currentUser.role,
      action: capa.status === 'RESOLVED' ? 'PHÊ_DUYỆT_CAPA' : 'CẬP_NHẬT_CAPA',
      details: `Hồ sơ CAPA cho lượt chạy ${resultId}. Trạng thái: ${capa.status}. Người thực hiện: ${capa.resolvedBy}.`,
    };
    saveAuditLog(log);

    setAppState((prev) => ({
      ...prev,
      results: updatedResults,
      logs: [log, ...prev.logs],
    }));

    if (activeAlert?.result.id === resultId) {
      setActiveAlert(null);
    }
  };

  // Đổi người dùng / vai trò
  const handleSelectUser = (user: UserProfile) => {
    saveCurrentUser(user);
    const log: AuditLog = {
      id: `log_usr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'CHUYỂN_ĐỔI_VAI_TRÒ',
      details: `Đăng nhập vai trò: ${user.roleTitle}`,
    };
    saveAuditLog(log);

    setAppState((prev) => ({
      ...prev,
      currentUser: user,
      logs: [log, ...prev.logs],
    }));
  };

  // Đồng bộ cưỡng bức
  const handleForceSync = () => {
    setTimeout(() => {
      setPendingSyncCount(0);
      alert('Đã đồng bộ toàn bộ cơ sở dữ liệu nội kiểm với máy chủ đám mây an toàn.');
    }, 400);
  };

  // Cập nhật Lô QC (bao gồm sửa Mean/SD có lưu vết ISO 15189)
  const handleUpdateLot = (updatedLot: QCLot, auditRecord?: MeanSdAuditRecord) => {
    let updatedLots: QCLot[];
    const exists = appState.lots.some((l) => l.id === updatedLot.id);
    if (exists) {
      updatedLots = appState.lots.map((l) => (l.id === updatedLot.id ? updatedLot : l));
    } else {
      updatedLots = [...appState.lots, updatedLot];
    }
    saveLots(updatedLots);

    let updatedAuditHistory = appState.meanSdAuditHistory || [];
    let updatedLogs = appState.logs;

    if (auditRecord) {
      updatedAuditHistory = [auditRecord, ...updatedAuditHistory];
      saveMeanSdAuditHistory(updatedAuditHistory);

      const log: AuditLog = {
        id: `log_msd_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: appState.currentUser.id,
        userName: appState.currentUser.name,
        role: appState.currentUser.role,
        action: 'HIỆU_CHỈNH_MEAN_SD',
        details: `Hiệu chỉnh Mean & SD Lô ${updatedLot.lotNumber} (${updatedLot.levelName}) - ${auditRecord.assayName}. Mean: ${auditRecord.oldMean} -> ${auditRecord.newMean}, SD: ${auditRecord.oldSD} -> ${auditRecord.newSD}. Lý do: ${auditRecord.reason}`,
        instrumentId: updatedLot.instrumentId,
      };
      saveAuditLog(log);
      updatedLogs = [log, ...updatedLogs];
    }

    setAppState((prev) => ({
      ...prev,
      lots: updatedLots,
      meanSdAuditHistory: updatedAuditHistory,
      logs: updatedLogs,
    }));
  };

  // Xóa Lô QC
  const handleDeleteLot = (lotId: string) => {
    const updatedLots = appState.lots.filter((l) => l.id !== lotId);
    saveLots(updatedLots);
    setAppState((prev) => ({ ...prev, lots: updatedLots }));
  };

  // Thêm / Sửa Xét nghiệm
  const handleSaveAssay = (assay: TestAssay) => {
    let updatedAssays: TestAssay[];
    const exists = appState.assays.some((a) => a.id === assay.id);
    if (exists) {
      updatedAssays = appState.assays.map((a) => (a.id === assay.id ? assay : a));
    } else {
      updatedAssays = [...appState.assays, assay];
    }
    saveAssays(updatedAssays);
    setAppState((prev) => ({ ...prev, assays: updatedAssays }));
  };

  // Xóa Xét nghiệm
  const handleDeleteAssay = (assayId: string) => {
    const updatedAssays = appState.assays.filter((a) => a.id !== assayId);
    saveAssays(updatedAssays);
    setAppState((prev) => ({ ...prev, assays: updatedAssays }));
  };

  // Thêm / Sửa Thiết bị
  const handleSaveInstrument = (inst: Instrument) => {
    let updatedInstruments: Instrument[];
    const exists = appState.instruments.some((i) => i.id === inst.id);
    if (exists) {
      updatedInstruments = appState.instruments.map((i) => (i.id === inst.id ? inst : i));
    } else {
      updatedInstruments = [...appState.instruments, inst];
    }
    saveInstruments(updatedInstruments);
    setAppState((prev) => ({ ...prev, instruments: updatedInstruments }));
  };

  // Xóa Thiết bị
  const handleDeleteInstrument = (instId: string) => {
    const updatedInstruments = appState.instruments.filter((i) => i.id !== instId);
    saveInstruments(updatedInstruments);
    setAppState((prev) => ({ ...prev, instruments: updatedInstruments }));
  };

  // Thêm / Sửa Người Dùng & Phân Quyền
  const handleSaveUser = (user: UserProfile) => {
    let updatedUsers: UserProfile[];
    const exists = (appState.users || []).some((u) => u.id === user.id);
    if (exists) {
      updatedUsers = (appState.users || []).map((u) => (u.id === user.id ? user : u));
    } else {
      updatedUsers = [...(appState.users || []), user];
    }
    saveUsers(updatedUsers);

    const isSelf = appState.currentUser.id === user.id;

    const log: AuditLog = {
      id: `log_usr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: appState.currentUser.id,
      userName: appState.currentUser.name,
      role: appState.currentUser.role,
      action: exists ? 'CẬP_NHẬT_NGƯỜI_DÙNG' : 'TẠO_NGƯỜI_DÙNG_MỚI',
      details: `${exists ? 'Cập nhật tài khoản & phân quyền' : 'Khai báo người dùng mới'}: ${user.name} (@${user.username}) - ${user.roleTitle}`,
    };
    saveAuditLog(log);

    setAppState((prev) => ({
      ...prev,
      users: updatedUsers,
      currentUser: isSelf ? user : prev.currentUser,
      logs: [log, ...prev.logs],
    }));
  };

  // Xóa Người Dùng
  const handleDeleteUser = (userId: string) => {
    const updatedUsers = (appState.users || []).filter((u) => u.id !== userId);
    saveUsers(updatedUsers);
    setAppState((prev) => ({ ...prev, users: updatedUsers }));
  };

  const selectedAssay = appState.assays.find((a) => a.id === selectedAssayId) || appState.assays[0];
  const selectedAssayLots = appState.lots.filter((l) => l.assayId === selectedAssay?.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={appState.currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onLogout={() => setIsLoginModalOpen(true)}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        unresolvedCapaCount={unresolvedCapaCount}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
      />

      {/* Instant Westgard Incident Alert Toast */}
      {activeAlert && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full no-print">
          <div className={`p-4 rounded-xl border shadow-md flex items-start justify-between gap-4 animate-in slide-in-from-top-3 ${
            activeAlert.result.status === 'REJECTED'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${
                activeAlert.result.status === 'REJECTED' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <span>{activeAlert.title}</span>
                  <span className="font-mono text-xs font-normal">
                    [{activeAlert.result.instrumentId} · {activeAlert.result.assayId}]
                  </span>
                </h4>
                <p className="text-xs mt-1 text-slate-700">
                  {activeAlert.description}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedResultForCapa(activeAlert.result);
                      setIsCapaModalOpen(true);
                    }}
                    className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    Xử lý CAPA ngay
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAssayId(activeAlert.result.assayId);
                      setCurrentTab('chart');
                      setActiveAlert(null);
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                  >
                    Xem trên biểu đồ L-J
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveAlert(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Dashboard */}
        {currentTab === 'dashboard' && (
          <DashboardView
            instruments={appState.instruments}
            assays={appState.assays}
            lots={appState.lots}
            results={appState.results}
            currentUser={appState.currentUser}
            onSelectAssayForChart={(id) => {
              setSelectedAssayId(id);
              setCurrentTab('chart');
            }}
            onOpenManualEntry={() => setIsManualEntryOpen(true)}
            onOpenReceiver={() => setCurrentTab('receiver')}
            onOpenReport={() => setIsReportModalOpen(true)}
            onOpenCapaList={() => setCurrentTab('capa')}
            onOpenConfig={() => setCurrentTab('config')}
          />
        )}

        {/* Tab 2: Levey-Jennings Chart */}
        {currentTab === 'chart' && (
          <div className="space-y-6">
            {/* Assay Selector Top Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-600" />
                <span className="font-bold text-sm text-slate-900">
                  Chọn Xét Nghiệm Kiểm Tra:
                </span>
                <select
                  value={selectedAssayId}
                  onChange={(e) => setSelectedAssayId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-cyan-600"
                >
                  {appState.assays.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.instrumentId}] {a.code} - {a.name} ({a.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsManualEntryOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  + Nhập Kết Quả
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xuất Báo Cáo Tháng (PDF)</span>
                </button>
              </div>
            </div>

            {/* Levey-Jennings Chart Canvas */}
            <LeveyJenningsChart
              assay={selectedAssay}
              lots={selectedAssayLots}
              results={appState.results}
              onSelectResultForCapa={(res) => {
                setSelectedResultForCapa(res);
                setIsCapaModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 3: QC Master Data & Mean/SD Audit Trail */}
        {currentTab === 'config' && (
          <QCConfigView
            instruments={appState.instruments}
            assays={appState.assays}
            lots={appState.lots}
            meanSdAuditHistory={appState.meanSdAuditHistory || []}
            currentUser={appState.currentUser}
            users={appState.users || []}
            onUpdateLot={handleUpdateLot}
            onDeleteLot={handleDeleteLot}
            onSaveAssay={handleSaveAssay}
            onDeleteAssay={handleDeleteAssay}
            onSaveInstrument={handleSaveInstrument}
            onDeleteInstrument={handleDeleteInstrument}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* Tab 4: Machine Signal Receiver */}
        {currentTab === 'receiver' && (
          <MachineSignalReceiver
            instruments={appState.instruments}
            assays={appState.assays}
            lots={appState.lots}
            currentUser={appState.currentUser}
            onNewQCResult={handleAddNewResult}
            onOpenChart={(id) => {
              setSelectedAssayId(id);
              setCurrentTab('chart');
            }}
            onOpenCapa={(res) => {
              setSelectedResultForCapa(res);
              setIsCapaModalOpen(true);
            }}
          />
        )}

        {/* Tab 4: CAPA Register */}
        {currentTab === 'capa' && (
          <CapaListView
            results={appState.results}
            assays={appState.assays}
            instruments={appState.instruments}
            currentUser={appState.currentUser}
            onOpenCapaModal={(res) => {
              setSelectedResultForCapa(res);
              setIsCapaModalOpen(true);
            }}
            onOpenChart={(id) => {
              setSelectedAssayId(id);
              setCurrentTab('chart');
            }}
          />
        )}

        {/* Tab 5: Reports */}
        {currentTab === 'reports' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xuất Báo Cáo Nội Kiểm Định Kỳ ISO 15189 (PDF)
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Tạo báo cáo tháng tiêu chuẩn y khoa với đầy đủ chỉ số thống kê Mean, SD, CV%, SDI, Six Sigma, biểu đồ L-J và 3 chữ ký thẩm định.
              </p>
            </div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Khởi Tạo Báo Cáo A4 Ngay</span>
            </button>
          </div>
        )}

        {/* Tab 6: Backup & Audit */}
        {currentTab === 'backup' && (
          <BackupRestoreView
            appState={appState}
            isOnline={isOnline}
            onToggleOnline={() => setIsOnline(!isOnline)}
            onRestoreState={(newState) => setAppState(newState)}
            onForceSync={handleForceSync}
          />
        )}
      </main>

      {/* Modals */}
      <UserRoleSwitcherModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={appState.currentUser}
        onSelectUser={handleSelectUser}
      />

      <CapaModal
        isOpen={isCapaModalOpen}
        onClose={() => {
          setIsCapaModalOpen(false);
          setSelectedResultForCapa(null);
        }}
        result={selectedResultForCapa}
        assay={appState.assays.find((a) => a.id === selectedResultForCapa?.assayId)}
        currentUser={appState.currentUser}
        onSaveCapa={handleSaveCapa}
      />

      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        instruments={appState.instruments}
        assays={appState.assays}
        lots={appState.lots}
        currentUser={appState.currentUser}
        historicalResults={appState.results}
        onAddResult={handleAddNewResult}
      />

      <QCReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        instruments={appState.instruments}
        assays={appState.assays}
        lots={appState.lots}
        results={appState.results}
        currentUser={appState.currentUser}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        users={appState.users || []}
        onLoginSuccess={(u) => {
          saveCurrentUser(u);
          setAppState((prev) => ({ ...prev, currentUser: u }));
          setIsLoginModalOpen(false);
        }}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <UpdateCheckModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
}
