/**
 * Bộ máy phân tích quy tắc Westgard chuẩn quốc tế (Westgard Multirule Engine)
 * Đạt tiêu chuẩn kiểm soát chất lượng cho phòng xét nghiệm y khoa
 */

import { QCLot, QCResult, WestgardViolation } from '../types/qc';

/**
 * Tính SDI (Standard Deviation Index / Z-score)
 */
export function calculateZScore(value: number, targetMean: number, targetSD: number): number {
  if (targetSD === 0) return 0;
  return Number(((value - targetMean) / targetSD).toFixed(2));
}

/**
 * Đánh giá quy tắc Westgard cho một kết quả mới dựa trên chuỗi kết quả lịch sử
 * @param currentValue Giá trị xét nghiệm vừa đo
 * @param currentZ SDI của giá trị hiện tại
 * @param lot Thông tin lô QC mục tiêu
 * @param historicalResults Danh sách các lần chạy trước đó (đã sắp xếp tăng dần theo thời gian)
 * @param companionResult Kết quả của mức nồng độ khác (Level khác) trong cùng lần chạy nếu có (để xét R-4s liên mức)
 */
export function evaluateWestgard(
  currentValue: number,
  currentZ: number,
  lot: QCLot,
  historicalResults: QCResult[],
  companionResult?: QCResult
): { status: 'ACCEPTED' | 'WARNING' | 'REJECTED'; violations: WestgardViolation[] } {
  const violations: WestgardViolation[] = [];

  // Lấy các SDI trước đó của cùng Lô này (tối đa 15 điểm gần nhất)
  const prevZScores = historicalResults.map(r => r.zScore);
  const allZ = [...prevZScores, currentZ];
  const n = allZ.length;

  // 1. Quy tắc 1-3s (Random Error - Từ chối kết quả)
  if (Math.abs(currentZ) > 3.0) {
    violations.push({
      rule: '1_3s',
      severity: 'REJECT',
      ruleName: 'Quy tắc 1-3s',
      description: `Kết quả hiện tại (${currentValue} ${lot.assayId}) lệch ${currentZ > 0 ? '+' : ''}${currentZ} SD, vượt ngưỡng giới hạn ±3SD.`,
      recommendation: 'Lỗi ngẫu nhiên (Random Error). Dừng trả kết quả xét nghiệm bệnh nhân. Kiểm tra bọt khí, kim hút, lắc trộn lại mẫu QC và chạy lại ngay.',
      errorType: 'RANDOM',
    });
  }

  // 2. Quy tắc 2-2s (Systematic Error - Từ chối kết quả)
  // Hai điểm liên tiếp cùng vượt quá +2SD hoặc cùng vượt quá -2SD
  if (n >= 2) {
    const z1 = allZ[n - 2];
    const z2 = allZ[n - 1];
    if ((z1 > 2.0 && z2 > 2.0) || (z1 < -2.0 && z2 < -2.0)) {
      violations.push({
        rule: '2_2s',
        severity: 'REJECT',
        ruleName: 'Quy tắc 2-2s',
        description: `2 kết quả liên tiếp cùng phía vượt ngưỡng ±2SD (${z1 > 0 ? '+' : ''}${z1}SD và ${z2 > 0 ? '+' : ''}${z2}SD).`,
        recommendation: 'Lỗi hệ thống (Systematic Error). Hiệu chuẩn lại (Calibrate) hóa chất, kiểm tra hạn dùng thuốc thử, kiểm tra nhiệt độ ủ phản ứng.',
        errorType: 'SYSTEMATIC',
      });
    }
  }

  // 3. Quy tắc R-4s (Random Error - Từ chối kết quả)
  // Trong chuỗi 2 điểm liên tiếp hoặc giữa 2 mức trong cùng lượt: chênh lệch SDI >= 4.0
  let isR4s = false;
  if (n >= 2) {
    const z1 = allZ[n - 2];
    const z2 = allZ[n - 1];
    if (Math.abs(z2 - z1) >= 4.0) {
      isR4s = true;
    }
  }
  if (!isR4s && companionResult) {
    if (Math.abs(currentZ - companionResult.zScore) >= 4.0) {
      isR4s = true;
    }
  }

  if (isR4s) {
    violations.push({
      rule: 'R_4s',
      severity: 'REJECT',
      ruleName: 'Quy tắc R-4s',
      description: 'Chênh lệch độ lệch chuẩn giữa 2 điểm liên tiếp (hoặc giữa 2 mức nồng độ cùng lượt) đạt ≥ 4.0 SD.',
      recommendation: 'Lỗi ngẫu nhiên phân tán lớn. Kiểm tra độ ổn định nguồn điện máy phân tích, kim hút mẫu, cuvette đo hoặc thuốc thử.',
      errorType: 'RANDOM',
    });
  }

  // 4. Quy tắc 4-1s (Systematic Error / Drift - Từ chối kết quả)
  // 4 điểm liên tiếp cùng nằm về một phía và vượt quá +1SD hoặc -1SD
  if (n >= 4) {
    const last4 = allZ.slice(n - 4);
    const allAbove1 = last4.every(z => z > 1.0);
    const allBelow1 = last4.every(z => z < -1.0);
    if (allAbove1 || allBelow1) {
      violations.push({
        rule: '4_1s',
        severity: 'REJECT',
        ruleName: 'Quy tắc 4-1s',
        description: `4 kết quả liên tiếp đều vượt qua ngưỡng ±1SD về cùng một phía (${allAbove1 ? '> +1SD' : '< -1SD'}).`,
        recommendation: 'Lỗi hệ thống tích lũy hoặc trôi đường chuẩn (Drift). Thực hiện bảo trì kim hút, kiểm tra độ suy thoái của Calibrator hoặc hóa chất.',
        errorType: 'SYSTEMATIC',
      });
    }
  }

  // 5. Quy tắc 10-x (Shift - Lệch hệ thống)
  // 10 điểm liên tiếp cùng nằm về một phía của Mean (cùng > 0 hoặc cùng < 0)
  if (n >= 10) {
    const last10 = allZ.slice(n - 10);
    const allPositive = last10.every(z => z > 0);
    const allNegative = last10.every(z => z < 0);
    if (allPositive || allNegative) {
      violations.push({
        rule: '10_x',
        severity: 'REJECT',
        ruleName: 'Quy tắc 10-x',
        description: `10 kết quả liên tiếp đều nằm về một phía của Mean (${allPositive ? 'dương (+)' : 'âm (-)'}).`,
        recommendation: 'Dịch chuyển hệ thống (Shift). Thường do thay đổi lô hóa chất, thay đổi lô chuẩn, hoặc suy giảm cường độ đèn quang phổ.',
        errorType: 'SYSTEMATIC',
      });
    }
  }

  // 6. Quy tắc 7-T (Trend - Xu hướng tăng/giảm liên tục)
  // 7 điểm liên tiếp tăng dần hoặc giảm dần
  if (n >= 7) {
    const last7 = allZ.slice(n - 7);
    let strictlyIncreasing = true;
    let strictlyDecreasing = true;
    for (let i = 1; i < last7.length; i++) {
      if (last7[i] <= last7[i - 1]) strictlyIncreasing = false;
      if (last7[i] >= last7[i - 1]) strictlyDecreasing = false;
    }
    if (strictlyIncreasing || strictlyDecreasing) {
      violations.push({
        rule: '7_T',
        severity: 'WARNING',
        ruleName: 'Quy tắc 7-T (Xu hướng)',
        description: `7 kết quả liên tiếp có xu hướng ${strictlyIncreasing ? 'tăng liên tục' : 'giảm liên tục'}.`,
        recommendation: 'Cảnh báo xu hướng suy thoái thuốc thử, đèn quang kế già cỗi hoặc chất chuẩn đang bay hơi/thoái biến.',
        errorType: 'TREND',
      });
    }
  }

  // 7. Quy tắc 1-2s (Warning Rule - Cảnh báo, thường là quy tắc khởi động)
  // Nếu chỉ vượt 2SD mà không vi phạm 1-3s, 2-2s, R-4s
  if (Math.abs(currentZ) > 2.0 && Math.abs(currentZ) <= 3.0) {
    const hasReject = violations.some(v => v.severity === 'REJECT');
    if (!hasReject) {
      violations.push({
        rule: '1_2s',
        severity: 'WARNING',
        ruleName: 'Quy tắc 1-2s (Cảnh báo)',
        description: `Kết quả (${currentValue}) vượt ngưỡng ±2SD (${currentZ > 0 ? '+' : ''}${currentZ} SD).`,
        recommendation: 'Cảnh báo. Không từ chối kết quả bệnh nhân nếu không vi phạm quy tắc khác, nhưng cần theo dõi sát lần chạy tiếp theo.',
        errorType: 'WARNING',
      });
    }
  }

  // Quyết định trạng thái tổng thể
  const hasReject = violations.some(v => v.severity === 'REJECT');
  const hasWarning = violations.some(v => v.severity === 'WARNING');

  let status: 'ACCEPTED' | 'WARNING' | 'REJECTED' = 'ACCEPTED';
  if (hasReject) {
    status = 'REJECTED';
  } else if (hasWarning) {
    status = 'WARNING';
  }

  return { status, violations };
}

/**
 * Tính toán số liệu thống kê cho tập dữ liệu QC (Mean, SD, CV%, SDI, CVI, Sigma Metric)
 */
export function calculateQCStatistics(
  results: QCResult[],
  targetMean: number,
  targetSD: number,
  targetCV: number,
  cliaTeaPercent: number
) {
  if (results.length === 0) {
    return {
      totalRuns: 0,
      acceptedCount: 0,
      warningCount: 0,
      rejectedCount: 0,
      calculatedMean: targetMean,
      calculatedSD: targetSD,
      calculatedCV: targetCV,
      sdi: 0,
      cvi: 1,
      biasPercent: 0,
      sigmaMetric: 6,
      passRate: 100,
    };
  }

  const values = results.map(r => r.value);
  const totalRuns = values.length;
  const acceptedCount = results.filter(r => r.status === 'ACCEPTED').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const rejectedCount = results.filter(r => r.status === 'REJECTED').length;

  // Tính Mean
  const sum = values.reduce((a, b) => a + b, 0);
  const calculatedMean = Number((sum / totalRuns).toFixed(2));

  // Tính SD mẫu
  let calculatedSD = 0;
  if (totalRuns > 1) {
    const variance = values.reduce((acc, v) => acc + Math.pow(v - calculatedMean, 2), 0) / (totalRuns - 1);
    calculatedSD = Number(Math.sqrt(variance).toFixed(3));
  } else {
    calculatedSD = targetSD;
  }

  // Tính CV%
  const calculatedCV = calculatedMean > 0 ? Number(((calculatedSD / calculatedMean) * 100).toFixed(2)) : 0;

  // Tính Bias (%)
  const biasPercent = targetMean > 0 ? Number((((calculatedMean - targetMean) / targetMean) * 100).toFixed(2)) : 0;

  // SDI (Standard Deviation Index)
  const sdi = targetSD > 0 ? Number(((calculatedMean - targetMean) / targetSD).toFixed(2)) : 0;

  // CVI (Coefficient of Variation Index)
  const cvi = targetCV > 0 ? Number((calculatedCV / targetCV).toFixed(2)) : 1;

  // Six Sigma Metric = (TEa% - |Bias%|) / CV%
  let sigmaMetric = 6.0;
  if (calculatedCV > 0) {
    sigmaMetric = Number(((cliaTeaPercent - Math.abs(biasPercent)) / calculatedCV).toFixed(1));
    if (sigmaMetric < 0) sigmaMetric = 0;
  }

  const passRate = Number((((acceptedCount + warningCount) / totalRuns) * 100).toFixed(1));

  return {
    totalRuns,
    acceptedCount,
    warningCount,
    rejectedCount,
    calculatedMean,
    calculatedSD,
    calculatedCV,
    sdi,
    cvi,
    biasPercent,
    sigmaMetric,
    passRate,
  };
}
