import { AuditLog, Instrument, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { generateInitialResults, INITIAL_ASSAYS, INITIAL_INSTRUMENTS, INITIAL_LOTS, INITIAL_USERS } from './initialData';

const STORAGE_KEYS = {
  RESULTS: 'qc_lab_results_v2',
  LOTS: 'qc_lab_lots_v2',
  ASSAYS: 'qc_lab_assays_v2',
  INSTRUMENTS: 'qc_lab_instruments_v2',
  LOGS: 'qc_lab_audit_logs_v2',
  CURRENT_USER: 'qc_lab_current_user_v2',
  SYNC_QUEUE: 'qc_lab_sync_queue_v2',
};

export interface AppStateData {
  results: QCResult[];
  lots: QCLot[];
  assays: TestAssay[];
  instruments: Instrument[];
  logs: AuditLog[];
  currentUser: UserProfile;
}

/**
 * Đọc dữ liệu từ bộ nhớ LocalStorage (Offline-First)
 */
export function loadAppState(): AppStateData {
  try {
    const rawResults = localStorage.getItem(STORAGE_KEYS.RESULTS);
    const rawLots = localStorage.getItem(STORAGE_KEYS.LOTS);
    const rawAssays = localStorage.getItem(STORAGE_KEYS.ASSAYS);
    const rawInstruments = localStorage.getItem(STORAGE_KEYS.INSTRUMENTS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const rawUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    const instruments: Instrument[] = rawInstruments ? JSON.parse(rawInstruments) : INITIAL_INSTRUMENTS;
    const assays: TestAssay[] = rawAssays ? JSON.parse(rawAssays) : INITIAL_ASSAYS;
    const lots: QCLot[] = rawLots ? JSON.parse(rawLots) : INITIAL_LOTS;
    const currentUser: UserProfile = rawUser ? JSON.parse(rawUser) : INITIAL_USERS[0]; // Mặc định Trưởng khoa
    const logs: AuditLog[] = rawLogs ? JSON.parse(rawLogs) : [
      {
        id: 'log_init',
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: 'KHỞI_TẠO_HỆ_THỐNG',
        details: 'Hệ thống quản lý nội kiểm QC xét nghiệm ISO 15189 khởi động thành công.',
      }
    ];

    let results: QCResult[] = [];
    if (rawResults) {
      results = JSON.parse(rawResults);
    } else {
      results = generateInitialResults();
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    }

    return { results, lots, assays, instruments, logs, currentUser };
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu QC từ bộ nhớ cục bộ:', error);
    return {
      results: generateInitialResults(),
      lots: INITIAL_LOTS,
      assays: INITIAL_ASSAYS,
      instruments: INITIAL_INSTRUMENTS,
      logs: [],
      currentUser: INITIAL_USERS[0],
    };
  }
}

/**
 * Lưu toàn bộ kết quả vào bộ nhớ
 */
export function saveResults(results: QCResult[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  } catch (err) {
    console.error('Không thể lưu kết quả QC:', err);
  }
}

/**
 * Lưu danh mục Lô QC
 */
export function saveLots(lots: QCLot[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
  } catch (err) {
    console.error('Không thể lưu Lô QC:', err);
  }
}

/**
 * Lưu danh mục xét nghiệm
 */
export function saveAssays(assays: TestAssay[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSAYS, JSON.stringify(assays));
  } catch (err) {
    console.error('Không thể lưu Assays:', err);
  }
}

/**
 * Lưu nhật ký kiểm toán (Audit Trail)
 */
export function saveAuditLog(log: AuditLog) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(log);
    // Giữ tối đa 500 bản ghi nhật ký
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Không thể lưu nhật ký:', err);
  }
}

/**
 * Lưu người dùng đang đăng nhập
 */
export function saveCurrentUser(user: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (err) {
    console.error('Không thể lưu người dùng:', err);
  }
}

/**
 * Xuất dữ liệu sao lưu ra file JSON
 */
export function exportBackupData(state: AppStateData): string {
  const backupObject = {
    appVersion: '2.5.0-ISO15189',
    exportedAt: new Date().toISOString(),
    laboratory: 'Khoa Xét Nghiệm Y Khoa Chuẩn ISO 15189',
    checksum: `QC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    data: {
      results: state.results,
      lots: state.lots,
      assays: state.assays,
      instruments: state.instruments,
      logs: state.logs,
    },
  };
  return JSON.stringify(backupObject, null, 2);
}

/**
 * Khôi phục dữ liệu từ chuỗi JSON sao lưu
 */
export function importBackupData(jsonString: string): AppStateData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !Array.isArray(parsed.data.results)) {
      throw new Error('Định dạng tệp sao lưu không hợp lệ!');
    }
    const { results, lots, assays, instruments, logs } = parsed.data;
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    if (lots) localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
    if (assays) localStorage.setItem(STORAGE_KEYS.ASSAYS, JSON.stringify(assays));
    if (instruments) localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
    if (logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

    return {
      results,
      lots: lots || INITIAL_LOTS,
      assays: assays || INITIAL_ASSAYS,
      instruments: instruments || INITIAL_INSTRUMENTS,
      logs: logs || [],
      currentUser: INITIAL_USERS[0],
    };
  } catch (err) {
    console.error('Lỗi khi phục hồi tệp sao lưu:', err);
    return null;
  }
}

/**
 * Đặt lại dữ liệu chuẩn mẫu (Reset Demo Data)
 */
export function resetDemoDatabase(): AppStateData {
  const initialResults = generateInitialResults();
  localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(initialResults));
  localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(INITIAL_LOTS));
  localStorage.setItem(STORAGE_KEYS.ASSAYS, JSON.stringify(INITIAL_ASSAYS));
  localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(INITIAL_INSTRUMENTS));
  
  const resetLog: AuditLog = {
    id: `log_reset_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: INITIAL_USERS[0].id,
    userName: INITIAL_USERS[0].name,
    role: INITIAL_USERS[0].role,
    action: 'KHÔI_PHỤC_DỮ_LIỆU_CHUẨN',
    details: 'Đã nạp lại cơ sở dữ liệu mẫu chuẩn y khoa 30 ngày cho AU400, Sysmex 800 và Cobas e411.',
  };
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([resetLog]));

  return {
    results: initialResults,
    lots: INITIAL_LOTS,
    assays: INITIAL_ASSAYS,
    instruments: INITIAL_INSTRUMENTS,
    logs: [resetLog],
    currentUser: INITIAL_USERS[0],
  };
}
