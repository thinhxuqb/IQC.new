/**
 * Định nghĩa kiểu dữ liệu cho Hệ Thống Quản Lý Nội Kiểm Xét Nghiệm QC (ISO 15189)
 */

export type UserRole = 'director' | 'manager' | 'technician' | 'auditor';

export interface UserPermissions {
  canInputQC: boolean;           // Quyền nhập kết quả QC thủ công & nhận LIS
  canEditMeanSD: boolean;        // Quyền sửa Mean & SD có lưu vết ISO 15189
  canApproveCapa: boolean;       // Quyền phê duyệt CAPA
  canManageConfig: boolean;      // Quyền cấu hình máy, xét nghiệm, vật liệu QC
  canManageUsers: boolean;       // Quyền khai báo người dùng & cấp quyền
  canExportReports: boolean;     // Quyền xuất báo cáo & ký số
  canResetDatabase: boolean;     // Quyền khôi phục / sao lưu cơ sở dữ liệu
}

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  code: string;
  phone: string;
  email: string;
  active: boolean;
  permissions: UserPermissions;
}

export type InstrumentId = 'AU400' | 'SYSMEX800' | 'COBASE411' | (string & {});

export interface Instrument {
  id: InstrumentId;
  name: string;
  code: string;
  manufacturer: string;
  department: string;
  model: string;
  serialNumber: string;
  status: 'ONLINE' | 'STANDBY' | 'BUSY' | 'ERROR';
  connectionType: 'RS232_SERIAL' | 'TCP_IP' | 'HL7_INTERFACE';
  port: string;
  baudRate?: number;
  protocol: 'ASTM_E1381_E1394' | 'HL7_V25' | 'SYSMEX_CUSTOM';
}

export type QCLevel = 'level1' | 'level2' | 'level3';

export interface TestAssay {
  id: string;
  instrumentId: InstrumentId;
  code: string;
  name: string;
  unit: string;
  sampleType: 'SERUM' | 'PLASMA' | 'WHOLE_BLOOD' | 'URINE';
  decimalPlaces: number;
  cliaTeaPercent: number; // Tổng sai số cho phép TEa (%) theo CLIA / Ricos
  method: string;
}

export interface MeanSdAuditRecord {
  id: string;
  lotId: string;
  assayId: string;
  assayName: string;
  instrumentId: InstrumentId;
  lotNumber: string;
  level: QCLevel;
  levelName: string;
  timestamp: string; // ISO 8601
  changedBy: string;
  changedByRole: string;
  oldMean: number;
  newMean: number;
  oldSD: number;
  newSD: number;
  oldCV: number;
  newCV: number;
  reason: string;
  reasonCategory: 'NEW_REAGENT_LOT' | 'CUMULATIVE_MEAN_20' | 'MAINTENANCE_CALIBRATION' | 'MANUFACTURER_RECOMMENDATION' | 'OTHER';
  approvedBy?: string;
  notes?: string;
}

export interface QCLot {
  id: string;
  assayId: string;
  instrumentId: InstrumentId;
  lotNumber: string;
  level: QCLevel;
  levelName: string; // "Level 1 (Bình thường)" | "Level 2 (Bệnh lý)"
  manufacturer: string;
  controlName: string; // vd: Lyphochek Assayed Chemistry Control
  expDate: string;
  targetMean: number;
  targetSD: number;
  targetCV: number; // Hệ số biến thiên % = (SD / Mean) * 100
  active: boolean;
  history?: MeanSdAuditRecord[];
}

export type WestgardRule = '1_2s' | '1_3s' | '2_2s' | 'R_4s' | '4_1s' | '10_x' | '7_T';
export type RuleSeverity = 'WARNING' | 'REJECT';

export interface WestgardViolation {
  rule: WestgardRule;
  severity: RuleSeverity;
  ruleName: string;
  description: string;
  recommendation: string;
  errorType: 'RANDOM' | 'SYSTEMATIC' | 'TREND' | 'WARNING';
}

export interface CapaRecord {
  rootCause: string;
  actionTaken: string;
  reportedBy: string;
  reportedAt: string;
  resolvedBy: string;
  resolvedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  status: 'PENDING_APPROVAL' | 'RESOLVED';
  rerunValue?: number;
}

export interface QCResult {
  id: string;
  assayId: string;
  lotId: string;
  instrumentId: InstrumentId;
  level: QCLevel;
  timestamp: string; // ISO 8601
  shift: 'SÁNG' | 'CHIỀU' | 'ĐÊM';
  value: number;
  zScore: number; // SDI = (value - targetMean) / targetSD
  operatorId: string;
  operatorName: string;
  source: 'MÁY_XÉT_NGHIỆM_LIS' | 'NHẬP_TAY' | 'FILE_IMPORT';
  rawSignal?: string;
  status: 'ACCEPTED' | 'WARNING' | 'REJECTED';
  violations: WestgardViolation[];
  capa?: CapaRecord;
  syncStatus: 'SYNCED' | 'PENDING' | 'OFFLINE';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  instrumentId?: InstrumentId;
}

export interface MonthlyStats {
  totalRuns: number;
  acceptedCount: number;
  warningCount: number;
  rejectedCount: number;
  calculatedMean: number;
  calculatedSD: number;
  calculatedCV: number;
  sdi: number;
  cvi: number;
  biasPercent: number;
  sigmaMetric: number;
  passRate: number;
}
