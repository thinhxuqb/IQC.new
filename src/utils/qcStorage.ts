import { AuditLog, Instrument, LabInfo, MeanSdAuditRecord, QCLot, QCMaterial, QCMapping, QCResult, TestAssay, UserProfile } from '../types/qc';
import { DEFAULT_LAB_INFO, generateInitialResults, INITIAL_ASSAYS, INITIAL_INSTRUMENTS, INITIAL_LOTS, INITIAL_MATERIALS, INITIAL_MAPPINGS, INITIAL_USERS } from './initialData';

export const INITIAL_MEAN_SD_AUDIT: MeanSdAuditRecord[] = [
  {
    id: 'msd_rec_001',
    lotId: 'AU_GLU_L1',
    assayId: 'AU_GLU',
    assayName: 'Glucose (Đường máu)',
    instrumentId: 'AU400',
    lotNumber: '45211',
    level: 'level1',
    levelName: 'Level 1 (Bình thường)',
    timestamp: '2026-09-15T08:30:00.000Z',
    changedBy: 'ThS. Lê Thị Thanh Mai',
    changedByRole: 'Kỹ thuật viên trưởng / QLCL',
    oldMean: 5.10,
    newMean: 5.25,
    oldSD: 0.18,
    newSD: 0.17,
    oldCV: 3.53,
    newCV: 3.24,
    reasonCategory: 'CUMULATIVE_MEAN_20',
    reason: 'Tính toán lại Mean thực tế sau 20 ngày tích lũy đầu kỳ theo quy trình ISO 15189 (Mục 7.3.7)',
    approvedBy: 'TS. BS. Nguyễn Văn Hùng',
    notes: 'Phù hợp với hướng dẫn CLSI C24-A4. CV% thực tế 3.24% < TEa 10%.'
  },
  {
    id: 'msd_rec_002',
    lotId: 'AU_CREA_L2',
    assayId: 'AU_CREA',
    assayName: 'Creatinine (Creatinin máu)',
    instrumentId: 'AU400',
    lotNumber: '45212',
    level: 'level2',
    levelName: 'Level 2 (Bệnh lý cao)',
    timestamp: '2026-09-20T14:15:00.000Z',
    changedBy: 'TS. BS. Nguyễn Văn Hùng',
    changedByRole: 'Trưởng khoa Xét nghiệm',
    oldMean: 350.0,
    newMean: 355.0,
    oldSD: 12.0,
    newSD: 11.5,
    oldCV: 3.43,
    newCV: 3.24,
    reasonCategory: 'MAINTENANCE_CALIBRATION',
    reason: 'Hiệu chuẩn lại sau khi thay bóng đèn quang học Halogen và bảo dưỡng cuvette máy AU400',
    approvedBy: 'TS. BS. Nguyễn Văn Hùng',
    notes: 'Đã chạy 5 mẫu thử lặp lại đạt độ lặp lại CV < 2.5%.'
  }
];

const STORAGE_KEYS = {
  RESULTS: 'qc_lab_results_v2',
  LOTS: 'qc_lab_lots_v2',
  ASSAYS: 'qc_lab_assays_v2',
  INSTRUMENTS: 'qc_lab_instruments_v2',
  LOGS: 'qc_lab_audit_logs_v2',
  CURRENT_USER: 'qc_lab_current_user_v2',
  SYNC_QUEUE: 'qc_lab_sync_queue_v2',
  MEAN_SD_AUDIT: 'qc_lab_mean_sd_audit_v2',
  USERS: 'qc_lab_users_v2',
  MATERIALS: 'qc_lab_materials_v2',
  MAPPINGS: 'qc_lab_mappings_v2',
  LAB_INFO: 'qc_lab_info_v2',
};

export interface AppStateData {
  results: QCResult[];
  lots: QCLot[];
  assays: TestAssay[];
  instruments: Instrument[];
  logs: AuditLog[];
  currentUser: UserProfile;
  meanSdAuditHistory: MeanSdAuditRecord[];
  users: UserProfile[];
  materials: QCMaterial[];
  qcMappings: QCMapping[];
  labInfo: LabInfo;
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
    const rawAudit = localStorage.getItem(STORAGE_KEYS.MEAN_SD_AUDIT);
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const rawMaterials = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    const rawMappings = localStorage.getItem(STORAGE_KEYS.MAPPINGS);
    const rawLabInfo = localStorage.getItem(STORAGE_KEYS.LAB_INFO);

    const instruments: Instrument[] = rawInstruments ? JSON.parse(rawInstruments) : INITIAL_INSTRUMENTS;
    const assays: TestAssay[] = rawAssays ? JSON.parse(rawAssays) : INITIAL_ASSAYS;
    const lots: QCLot[] = rawLots ? JSON.parse(rawLots) : INITIAL_LOTS;
    const users: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : INITIAL_USERS;
    const currentUser: UserProfile = rawUser ? JSON.parse(rawUser) : users[0]; // Mặc định Trưởng khoa
    const meanSdAuditHistory: MeanSdAuditRecord[] = rawAudit ? JSON.parse(rawAudit) : INITIAL_MEAN_SD_AUDIT;
    const materials: QCMaterial[] = rawMaterials ? JSON.parse(rawMaterials) : INITIAL_MATERIALS;
    const qcMappings: QCMapping[] = rawMappings ? JSON.parse(rawMappings) : INITIAL_MAPPINGS;
    const labInfo: LabInfo = rawLabInfo ? JSON.parse(rawLabInfo) : DEFAULT_LAB_INFO;

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

    return { results, lots, assays, instruments, logs, currentUser, meanSdAuditHistory, users, materials, qcMappings, labInfo };
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu QC từ bộ nhớ cục bộ:', error);
    return {
      results: generateInitialResults(),
      lots: INITIAL_LOTS,
      assays: INITIAL_ASSAYS,
      instruments: INITIAL_INSTRUMENTS,
      logs: [],
      currentUser: INITIAL_USERS[0],
      meanSdAuditHistory: INITIAL_MEAN_SD_AUDIT,
      users: INITIAL_USERS,
      materials: INITIAL_MATERIALS,
      qcMappings: INITIAL_MAPPINGS,
      labInfo: DEFAULT_LAB_INFO,
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
 * Lưu danh mục thiết bị
 */
export function saveInstruments(instruments: Instrument[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
  } catch (err) {
    console.error('Không thể lưu Instruments:', err);
  }
}

/**
 * Lưu danh mục người dùng
 */
export function saveUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Không thể lưu Users:', err);
  }
}

/**
 * Lưu lịch sử lưu vết thay đổi Mean & SD
 */
export function saveMeanSdAuditHistory(history: MeanSdAuditRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEAN_SD_AUDIT, JSON.stringify(history));
  } catch (err) {
    console.error('Không thể lưu Mean SD Audit History:', err);
  }
}

/**
 * Lưu danh mục vật liệu QC
 */
export function saveMaterials(materials: QCMaterial[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  } catch (err) {
    console.error('Không thể lưu Materials:', err);
  }
}

/**
 * Lưu danh mục Map kiểm chuẩn (QC Mappings)
 */
export function saveQCMappings(mappings: QCMapping[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(mappings));
  } catch (err) {
    console.error('Không thể lưu QC Mappings:', err);
  }
}

/**
 * Lưu thông tin phòng xét nghiệm (Tên, địa chỉ, người phụ trách...)
 */
export function saveLabInfo(labInfo: LabInfo) {
  try {
    localStorage.setItem(STORAGE_KEYS.LAB_INFO, JSON.stringify(labInfo));
  } catch (err) {
    console.error('Không thể lưu LabInfo:', err);
  }
}

/**
 * Xuất dữ liệu sao lưu ra file JSON
 */
export function exportBackupData(state: AppStateData): string {
  const backupObject = {
    appVersion: '2.5.0-ISO15189',
    exportedAt: new Date().toISOString(),
    laboratory: state.labInfo.name || 'Khoa Xét Nghiệm Y Khoa Chuẩn ISO 15189',
    checksum: `QC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    data: {
      results: state.results,
      lots: state.lots,
      assays: state.assays,
      instruments: state.instruments,
      logs: state.logs,
      meanSdAuditHistory: state.meanSdAuditHistory,
      users: state.users,
      materials: state.materials,
      qcMappings: state.qcMappings,
      labInfo: state.labInfo,
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
    const { results, lots, assays, instruments, logs, meanSdAuditHistory, users, materials, qcMappings, labInfo } = parsed.data;
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    if (lots) localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
    if (assays) localStorage.setItem(STORAGE_KEYS.ASSAYS, JSON.stringify(assays));
    if (instruments) localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
    if (logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    if (meanSdAuditHistory) localStorage.setItem(STORAGE_KEYS.MEAN_SD_AUDIT, JSON.stringify(meanSdAuditHistory));
    if (users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (materials) localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    if (qcMappings) localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(qcMappings));
    if (labInfo) localStorage.setItem(STORAGE_KEYS.LAB_INFO, JSON.stringify(labInfo));

    return {
      results,
      lots: lots || INITIAL_LOTS,
      assays: assays || INITIAL_ASSAYS,
      instruments: instruments || INITIAL_INSTRUMENTS,
      logs: logs || [],
      currentUser: (users && users[0]) || INITIAL_USERS[0],
      meanSdAuditHistory: meanSdAuditHistory || INITIAL_MEAN_SD_AUDIT,
      users: users || INITIAL_USERS,
      materials: materials || INITIAL_MATERIALS,
      qcMappings: qcMappings || INITIAL_MAPPINGS,
      labInfo: labInfo || DEFAULT_LAB_INFO,
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
  localStorage.setItem(STORAGE_KEYS.MEAN_SD_AUDIT, JSON.stringify(INITIAL_MEAN_SD_AUDIT));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
  localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(INITIAL_MAPPINGS));
  localStorage.setItem(STORAGE_KEYS.LAB_INFO, JSON.stringify(DEFAULT_LAB_INFO));
  
  const resetLog: AuditLog = {
    id: `log_reset_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: INITIAL_USERS[0].id,
    userName: INITIAL_USERS[0].name,
    role: INITIAL_USERS[0].role,
    action: 'KHÔI_PHỤC_DỮ_LIỆU_CHUẨN',
    details: 'Đã nạp lại cơ sở dữ liệu mẫu chuẩn y khoa 30 ngày cho AU400, Sysmex 800 và Cobas e411 kèm thông tin phòng xét nghiệm chuẩn ISO 15189.',
  };
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([resetLog]));

  return {
    results: initialResults,
    lots: INITIAL_LOTS,
    assays: INITIAL_ASSAYS,
    instruments: INITIAL_INSTRUMENTS,
    logs: [resetLog],
    currentUser: INITIAL_USERS[0],
    meanSdAuditHistory: INITIAL_MEAN_SD_AUDIT,
    users: INITIAL_USERS,
    materials: INITIAL_MATERIALS,
    qcMappings: INITIAL_MAPPINGS,
    labInfo: DEFAULT_LAB_INFO,
  };
}
