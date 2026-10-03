import { Instrument, QCLevel, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { calculateZScore, evaluateWestgard } from './westgard';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_director',
    username: 'hung.nguyen',
    password: '123',
    name: 'TS. BS. Nguyễn Văn Hùng',
    role: 'director',
    roleTitle: 'Trưởng khoa Xét nghiệm / Bác sĩ duyệt chuyên môn',
    department: 'Khoa Xét nghiệm Trung tâm',
    code: 'BSXN-001',
    phone: '0912.345.678',
    email: 'hung.nguyen@medlab.vn',
    active: true,
    permissions: {
      canInputQC: true,
      canEditMeanSD: true,
      canApproveCapa: true,
      canManageConfig: true,
      canManageUsers: true,
      canExportReports: true,
      canResetDatabase: true,
    },
  },
  {
    id: 'user_manager',
    username: 'mai.le',
    password: '123',
    name: 'ThS. Lê Thị Thanh Mai',
    role: 'manager',
    roleTitle: 'Kỹ thuật viên trưởng / Quản lý chất lượng ISO 15189',
    department: 'Tổ Quản lý Chất lượng QC',
    code: 'KTVT-014',
    phone: '0983.888.999',
    email: 'mai.le@medlab.vn',
    active: true,
    permissions: {
      canInputQC: true,
      canEditMeanSD: true,
      canApproveCapa: true,
      canManageConfig: true,
      canManageUsers: true,
      canExportReports: true,
      canResetDatabase: false,
    },
  },
  {
    id: 'user_tech',
    username: 'tuan.tran',
    password: '123',
    name: 'CN. Trần Quốc Tuấn',
    role: 'technician',
    roleTitle: 'Kỹ thuật viên thực hiện xét nghiệm',
    department: 'Bộ phận Hóa sinh - Huyết học',
    code: 'KTV-082',
    phone: '0975.123.456',
    email: 'tuan.tran@medlab.vn',
    active: true,
    permissions: {
      canInputQC: true,
      canEditMeanSD: false,
      canApproveCapa: false,
      canManageConfig: false,
      canManageUsers: false,
      canExportReports: true,
      canResetDatabase: false,
    },
  },
  {
    id: 'user_auditor',
    username: 'tri.pham',
    password: '123',
    name: 'BS. Phạm Minh Trí',
    role: 'auditor',
    roleTitle: 'Chuyên viên Đánh giá Độc lập (ISO Auditor)',
    department: 'Ban Kiểm định Chất lượng Bệnh viện',
    code: 'AUD-009',
    phone: '0903.654.321',
    email: 'tri.pham@medlab.vn',
    active: true,
    permissions: {
      canInputQC: false,
      canEditMeanSD: false,
      canApproveCapa: false,
      canManageConfig: false,
      canManageUsers: false,
      canExportReports: true,
      canResetDatabase: false,
    },
  },
];

export const INITIAL_INSTRUMENTS: Instrument[] = [
  {
    id: 'AU400',
    name: 'Máy Sinh Hóa Beckman Coulter AU400',
    code: 'AU-400-01',
    manufacturer: 'Beckman Coulter Inc. (USA)',
    department: 'Khoa Hóa Sinh',
    model: 'AU400 Chemistry Analyzer',
    serialNumber: 'AU4-2023-8821',
    status: 'ONLINE',
    connectionType: 'RS232_SERIAL',
    port: 'COM1 (9600-8-N-1)',
    baudRate: 9600,
    protocol: 'ASTM_E1381_E1394',
  },
  {
    id: 'SYSMEX800',
    name: 'Máy Huyết Học Sysmex 800 Series',
    code: 'SYS-800-02',
    manufacturer: 'Sysmex Corporation (Japan)',
    department: 'Khoa Huyết Học',
    model: 'Sysmex XP/KX-800 Automated Hematology',
    serialNumber: 'KX8-7712-4410',
    status: 'ONLINE',
    connectionType: 'TCP_IP',
    port: '192.168.1.150:5000',
    protocol: 'SYSMEX_CUSTOM',
  },
  {
    id: 'COBASE411',
    name: 'Máy Miễn Dịch Roche Cobas e411',
    code: 'COB-411-01',
    manufacturer: 'Roche Diagnostics (Switzerland)',
    department: 'Khoa Miễn Dịch & Sinh học phân tử',
    model: 'Cobas e411 Disk System (ECLIA)',
    serialNumber: 'E411-094-1189',
    status: 'ONLINE',
    connectionType: 'HL7_INTERFACE',
    port: '192.168.1.180:2575',
    protocol: 'HL7_V25',
  },
];

export const INITIAL_ASSAYS: TestAssay[] = [
  // AU400 Sinh Hóa
  {
    id: 'AU_GLU',
    instrumentId: 'AU400',
    code: 'GLU',
    name: 'Glucose (Đường máu)',
    unit: 'mmol/L',
    sampleType: 'SERUM',
    decimalPlaces: 2,
    cliaTeaPercent: 10.0, // TEa = 10%
    method: 'Hexokinase / G6PDH',
  },
  {
    id: 'AU_URE',
    instrumentId: 'AU400',
    code: 'URE',
    name: 'Urea (Ure máu)',
    unit: 'mmol/L',
    sampleType: 'SERUM',
    decimalPlaces: 2,
    cliaTeaPercent: 12.0,
    method: 'Urease / GLDH',
  },
  {
    id: 'AU_CREA',
    instrumentId: 'AU400',
    code: 'CREA',
    name: 'Creatinine (Creatinin máu)',
    unit: 'µmol/L',
    sampleType: 'SERUM',
    decimalPlaces: 1,
    cliaTeaPercent: 15.0,
    method: 'Jaffe Động học enzym bù trừ',
  },
  {
    id: 'AU_AST',
    instrumentId: 'AU400',
    code: 'AST',
    name: 'AST / GOT (Men gan)',
    unit: 'U/L',
    sampleType: 'SERUM',
    decimalPlaces: 1,
    cliaTeaPercent: 16.7,
    method: 'IFCC không pyridoxal phosphate',
  },
  {
    id: 'AU_ALT',
    instrumentId: 'AU400',
    code: 'ALT',
    name: 'ALT / GPT (Men gan)',
    unit: 'U/L',
    sampleType: 'SERUM',
    decimalPlaces: 1,
    cliaTeaPercent: 16.7,
    method: 'IFCC không pyridoxal phosphate',
  },
  {
    id: 'AU_CHOL',
    instrumentId: 'AU400',
    code: 'CHOL',
    name: 'Cholesterol toàn phần',
    unit: 'mmol/L',
    sampleType: 'SERUM',
    decimalPlaces: 2,
    cliaTeaPercent: 10.0,
    method: 'CHOD-PAP enzym',
  },

  // Sysmex 800 Huyết Học
  {
    id: 'SYS_WBC',
    instrumentId: 'SYSMEX800',
    code: 'WBC',
    name: 'Số lượng Bạch cầu (WBC)',
    unit: '10^9/L',
    sampleType: 'WHOLE_BLOOD',
    decimalPlaces: 2,
    cliaTeaPercent: 15.0,
    method: 'Đếm trở kháng điện học (DC)',
  },
  {
    id: 'SYS_RBC',
    instrumentId: 'SYSMEX800',
    code: 'RBC',
    name: 'Số lượng Hồng cầu (RBC)',
    unit: '10^12/L',
    sampleType: 'WHOLE_BLOOD',
    decimalPlaces: 2,
    cliaTeaPercent: 6.0,
    method: 'Phương pháp dòng xoáy tụ tiêu thủy động',
  },
  {
    id: 'SYS_HGB',
    instrumentId: 'SYSMEX800',
    code: 'HGB',
    name: 'Huyết sắc tố (Hemoglobin)',
    unit: 'g/L',
    sampleType: 'WHOLE_BLOOD',
    decimalPlaces: 1,
    cliaTeaPercent: 7.0,
    method: 'SLS-Hemoglobin không chứa Cyanide',
  },
  {
    id: 'SYS_PLT',
    instrumentId: 'SYSMEX800',
    code: 'PLT',
    name: 'Số lượng Tiểu cầu (PLT)',
    unit: '10^9/L',
    sampleType: 'WHOLE_BLOOD',
    decimalPlaces: 0,
    cliaTeaPercent: 20.0,
    method: 'Đếm trở kháng điện tử DC',
  },

  // Cobas e411 Miễn Dịch
  {
    id: 'COB_TSH',
    instrumentId: 'COBASE411',
    code: 'TSH',
    name: 'TSH (Hormone tuyến giáp)',
    unit: 'µIU/mL',
    sampleType: 'SERUM',
    decimalPlaces: 3,
    cliaTeaPercent: 20.0,
    method: 'Miễn dịch điện hóa phát quang ECLIA',
  },
  {
    id: 'COB_FT4',
    instrumentId: 'COBASE411',
    code: 'FT4',
    name: 'FT4 (Thyroxine tự do)',
    unit: 'pmol/L',
    sampleType: 'SERUM',
    decimalPlaces: 2,
    cliaTeaPercent: 18.0,
    method: 'Miễn dịch cạnh tranh ECLIA',
  },
  {
    id: 'COB_TROPT',
    instrumentId: 'COBASE411',
    code: 'TROP-T',
    name: 'Troponin T hs (Tim mạch)',
    unit: 'ng/L',
    sampleType: 'SERUM',
    decimalPlaces: 1,
    cliaTeaPercent: 20.0,
    method: 'Sandwich ECLIA độ nhạy cao',
  },
  {
    id: 'COB_CEA',
    instrumentId: 'COBASE411',
    code: 'CEA',
    name: 'CEA (Dấu ấn ung thư)',
    unit: 'ng/mL',
    sampleType: 'SERUM',
    decimalPlaces: 2,
    cliaTeaPercent: 15.0,
    method: 'ECLIA vi hạt từ tính',
  },
];

export const INITIAL_LOTS: QCLot[] = [
  // AU400 Glucose
  {
    id: 'LOT_GLU_L1',
    assayId: 'AU_GLU',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2401-L1',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L1',
    expDate: '2027-08-31',
    targetMean: 5.35,
    targetSD: 0.16,
    targetCV: 2.99,
    active: true,
  },
  {
    id: 'LOT_GLU_L2',
    assayId: 'AU_GLU',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2402-L2',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L2',
    expDate: '2027-08-31',
    targetMean: 15.2,
    targetSD: 0.45,
    targetCV: 2.96,
    active: true,
  },

  // AU400 Ure
  {
    id: 'LOT_URE_L1',
    assayId: 'AU_URE',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2401-L1',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L1',
    expDate: '2027-08-31',
    targetMean: 6.8,
    targetSD: 0.28,
    targetCV: 4.12,
    active: true,
  },
  {
    id: 'LOT_URE_L2',
    assayId: 'AU_URE',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2402-L2',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L2',
    expDate: '2027-08-31',
    targetMean: 19.5,
    targetSD: 0.72,
    targetCV: 3.69,
    active: true,
  },

  // AU400 Creatinine
  {
    id: 'LOT_CREA_L1',
    assayId: 'AU_CREA',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2401-L1',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L1',
    expDate: '2027-08-31',
    targetMean: 88.5,
    targetSD: 3.2,
    targetCV: 3.62,
    active: true,
  },
  {
    id: 'LOT_CREA_L2',
    assayId: 'AU_CREA',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2402-L2',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L2',
    expDate: '2027-08-31',
    targetMean: 345.0,
    targetSD: 11.5,
    targetCV: 3.33,
    active: true,
  },

  // AU400 AST
  {
    id: 'LOT_AST_L1',
    assayId: 'AU_AST',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2401-L1',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L1',
    expDate: '2027-08-31',
    targetMean: 36.2,
    targetSD: 1.4,
    targetCV: 3.87,
    active: true,
  },
  {
    id: 'LOT_AST_L2',
    assayId: 'AU_AST',
    instrumentId: 'AU400',
    lotNumber: 'BIO-2402-L2',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Bio-Rad Laboratories',
    controlName: 'Lyphochek Assayed Chemistry Control L2',
    expDate: '2027-08-31',
    targetMean: 168.0,
    targetSD: 5.6,
    targetCV: 3.33,
    active: true,
  },

  // Sysmex 800 WBC
  {
    id: 'LOT_WBC_L1',
    assayId: 'SYS_WBC',
    instrumentId: 'SYSMEX800',
    lotNumber: 'SYS-8C-2401',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Sysmex Corporation',
    controlName: 'Eightcheck-3WP Hematology Control N',
    expDate: '2027-04-15',
    targetMean: 7.25,
    targetSD: 0.32,
    targetCV: 4.41,
    active: true,
  },
  {
    id: 'LOT_WBC_L2',
    assayId: 'SYS_WBC',
    instrumentId: 'SYSMEX800',
    lotNumber: 'SYS-8C-2402',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Sysmex Corporation',
    controlName: 'Eightcheck-3WP Hematology Control H',
    expDate: '2027-04-15',
    targetMean: 18.6,
    targetSD: 0.75,
    targetCV: 4.03,
    active: true,
  },

  // Sysmex 800 HGB
  {
    id: 'LOT_HGB_L1',
    assayId: 'SYS_HGB',
    instrumentId: 'SYSMEX800',
    lotNumber: 'SYS-8C-2401',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Sysmex Corporation',
    controlName: 'Eightcheck-3WP Hematology Control N',
    expDate: '2027-04-15',
    targetMean: 136.0,
    targetSD: 2.8,
    targetCV: 2.06,
    active: true,
  },
  {
    id: 'LOT_HGB_L2',
    assayId: 'SYS_HGB',
    instrumentId: 'SYSMEX800',
    lotNumber: 'SYS-8C-2402',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Sysmex Corporation',
    controlName: 'Eightcheck-3WP Hematology Control H',
    expDate: '2027-04-15',
    targetMean: 184.0,
    targetSD: 3.5,
    targetCV: 1.90,
    active: true,
  },

  // Sysmex 800 PLT
  {
    id: 'LOT_PLT_L1',
    assayId: 'SYS_PLT',
    instrumentId: 'SYSMEX800',
    lotNumber: 'SYS-8C-2401',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Sysmex Corporation',
    controlName: 'Eightcheck-3WP Hematology Control N',
    expDate: '2027-04-15',
    targetMean: 242,
    targetSD: 12,
    targetCV: 4.96,
    active: true,
  },
  {
    id: 'LOT_PLT_L2',
    assayId: 'SYS_PLT',
    instrumentId: 'SYSMEX800',
    lotNumber: 'SYS-8C-2402',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Sysmex Corporation',
    controlName: 'Eightcheck-3WP Hematology Control H',
    expDate: '2027-04-15',
    targetMean: 510,
    targetSD: 22,
    targetCV: 4.31,
    active: true,
  },

  // Cobas e411 TSH
  {
    id: 'LOT_TSH_L1',
    assayId: 'COB_TSH',
    instrumentId: 'COBASE411',
    lotNumber: 'ROC-PC-8911',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Roche Diagnostics',
    controlName: 'PreciControl Universal PCU 1',
    expDate: '2027-06-30',
    targetMean: 2.15,
    targetSD: 0.11,
    targetCV: 5.12,
    active: true,
  },
  {
    id: 'LOT_TSH_L2',
    assayId: 'COB_TSH',
    instrumentId: 'COBASE411',
    lotNumber: 'ROC-PC-8912',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Roche Diagnostics',
    controlName: 'PreciControl Universal PCU 2',
    expDate: '2027-06-30',
    targetMean: 9.85,
    targetSD: 0.44,
    targetCV: 4.47,
    active: true,
  },

  // Cobas e411 Troponin T
  {
    id: 'LOT_TROP_L1',
    assayId: 'COB_TROPT',
    instrumentId: 'COBASE411',
    lotNumber: 'ROC-CAR-331',
    level: 'level1',
    levelName: 'Mức 1 (Bình thường)',
    manufacturer: 'Roche Diagnostics',
    controlName: 'PreciControl Cardiac 1',
    expDate: '2027-05-31',
    targetMean: 13.8,
    targetSD: 0.95,
    targetCV: 6.88,
    active: true,
  },
  {
    id: 'LOT_TROP_L2',
    assayId: 'COB_TROPT',
    instrumentId: 'COBASE411',
    lotNumber: 'ROC-CAR-332',
    level: 'level2',
    levelName: 'Mức 2 (Bệnh lý cao)',
    manufacturer: 'Roche Diagnostics',
    controlName: 'PreciControl Cardiac 2',
    expDate: '2027-05-31',
    targetMean: 245.0,
    targetSD: 12.0,
    targetCV: 4.90,
    active: true,
  },
];

/**
 * Sinh dữ liệu mẫu lịch sử 25 ngày cho các xét nghiệm chính
 */
export function generateInitialResults(): QCResult[] {
  const results: QCResult[] = [];
  const baseDate = new Date(); // Thời điểm hiện tại

  // Chọn ra các Lô cần tạo dữ liệu mẫu
  const keyLots = INITIAL_LOTS;

  keyLots.forEach(lot => {
    const historicalForLot: QCResult[] = [];
    const numPoints = 24; // 24 ngày

    // Để tạo dữ liệu thật: hầu hết dao động xung quanh Mean với z-score trong [-1.8, 1.8]
    // Tại một số điểm đặc biệt (ví dụ ngày thứ 14 và ngày thứ 21) cố tình tạo vi phạm để test Westgard
    for (let dayOffset = numPoints; dayOffset >= 1; dayOffset--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(7, 30 + (dayOffset % 30), 0, 0);

      // Tính giá trị đo
      let zMultiplier = (Math.sin(dayOffset * 1.3) * 0.9 + Math.cos(dayOffset * 0.7) * 0.6);
      
      // Ngày 16: Test vi phạm cảnh báo 1-2s trên AU_GLU L1
      if (lot.assayId === 'AU_GLU' && lot.level === 'level1' && dayOffset === 8) {
        zMultiplier = 2.25; // 1-2s cảnh báo
      }
      
      // Ngày 5: Test vi phạm 1-3s (Reject) trên AU_GLU L1 đã được xử lý CAPA
      if (lot.assayId === 'AU_GLU' && lot.level === 'level1' && dayOffset === 4) {
        zMultiplier = 3.25; // 1-3s Reject
      }

      // Trên Sysmex WBC: thử nghiệm dao động nhẹ
      if (lot.assayId === 'SYS_WBC' && dayOffset === 6) {
        zMultiplier = -2.15; // 1-2s
      }

      let val = Number((lot.targetMean + zMultiplier * lot.targetSD).toFixed(
        lot.assayId.includes('TSH') ? 3 : (lot.assayId.includes('CREA') || lot.assayId.includes('HGB') || lot.assayId.includes('PLT') ? 1 : 2)
      ));
      if (lot.assayId.includes('PLT')) val = Math.round(val);

      const z = calculateZScore(val, lot.targetMean, lot.targetSD);
      const evalResult = evaluateWestgard(val, z, lot, historicalForLot);

      const resultItem: QCResult = {
        id: `qc_res_${lot.id}_${dayOffset}`,
        assayId: lot.assayId,
        lotId: lot.id,
        instrumentId: lot.instrumentId,
        level: lot.level,
        timestamp: date.toISOString(),
        shift: 'SÁNG',
        value: val,
        zScore: z,
        operatorId: 'user_tech',
        operatorName: 'CN. Trần Quốc Tuấn',
        source: 'MÁY_XÉT_NGHIỆM_LIS',
        rawSignal: `H|\\^&|||${lot.instrumentId}|||||||P|1|${date.toISOString()}|R|1|^^^${lot.assayId}|${val}|${lot.level}||N||F`,
        status: evalResult.status,
        violations: evalResult.violations,
        syncStatus: 'SYNCED',
      };

      // Nếu là điểm vi phạm ở ngày thứ 4, tạo hồ sơ CAPA đã xử lý hoàn tất chuẩn ISO 15189
      if (evalResult.status === 'REJECTED') {
        resultItem.capa = {
          rootCause: 'Bọt khí xuất hiện tại kim hút mẫu vi thể do ống xi-lanh phân phối bị hở gioăng cao su nhẹ.',
          actionTaken: 'Đã xả khí (Purge/Prime) hệ thống kim hút, vệ sinh kim bằng cồn 70% và chạy lại mẫu QC từ lọ mới.',
          reportedBy: 'CN. Trần Quốc Tuấn',
          reportedAt: date.toISOString(),
          resolvedBy: 'ThS. Lê Thị Thanh Mai',
          resolvedAt: new Date(date.getTime() + 45 * 60000).toISOString(),
          approvedBy: 'TS. BS. Nguyễn Văn Hùng',
          approvedAt: new Date(date.getTime() + 90 * 60000).toISOString(),
          approvalNotes: 'Đã thẩm định kết quả chạy lại đạt Mean ± 0.3SD. Đủ điều kiện giải phóng kết quả bệnh nhân.',
          status: 'RESOLVED',
          rerunValue: Number((lot.targetMean + 0.05 * lot.targetSD).toFixed(2)),
        };
      }

      historicalForLot.push(resultItem);
      results.push(resultItem);
    }
  });

  return results;
}
