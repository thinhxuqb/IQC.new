import React, { useState, useMemo } from 'react';
import { Instrument, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { calculateQCStatistics } from '../utils/westgard';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Filter 
} from 'lucide-react';

interface QCReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  results: QCResult[];
  currentUser: UserProfile;
}

export const QCReportModal: React.FC<QCReportModalProps> = ({
  isOpen,
  onClose,
  instruments,
  assays,
  lots,
  results,
  currentUser,
}) => {
  if (!isOpen) return null;

  // Cấu hình khoảng thời gian xuất báo cáo
  const [reportPeriodType, setReportPeriodType] = useState<'month' | 'last_month' | '30d' | 'quarter' | 'year' | 'custom'>('month');
  const [reportFromDate, setReportFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [reportToDate, setReportToDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [selectedInstId, setSelectedInstId] = useState<string>('AU400');
  const [selectedAssayId, setSelectedAssayId] = useState<string>('AU_GLU');

  const availableAssays = assays.filter((a) => a.instrumentId === selectedInstId);
  const currentAssay = assays.find((a) => a.id === selectedAssayId) || availableAssays[0];
  const currentInst = instruments.find((i) => i.id === selectedInstId) || instruments[0];

  // Tính toán khoảng ngày thực tế và tiêu đề kỳ báo cáo
  const { dateRange, periodTitle } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (reportPeriodType === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const from = new Date(year, month, 1).toISOString().slice(0, 10);
      const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      return {
        dateRange: { from, to },
        periodTitle: `Tháng ${month + 1}/${year} (${new Date(from).toLocaleDateString('vi-VN')} - ${new Date(to).toLocaleDateString('vi-VN')})`,
      };
    }
    if (reportPeriodType === 'last_month') {
      const year = now.getFullYear();
      const month = now.getMonth() - 1;
      const from = new Date(year, month, 1).toISOString().slice(0, 10);
      const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      return {
        dateRange: { from, to },
        periodTitle: `Tháng ${month + 1}/${year} (${new Date(from).toLocaleDateString('vi-VN')} - ${new Date(to).toLocaleDateString('vi-VN')})`,
      };
    }
    if (reportPeriodType === '30d') {
      const fromD = new Date(now);
      fromD.setDate(fromD.getDate() - 30);
      const from = fromD.toISOString().slice(0, 10);
      return {
        dateRange: { from, to: todayStr },
        periodTitle: `30 Ngày Gần Nhất (${new Date(from).toLocaleDateString('vi-VN')} - ${new Date(todayStr).toLocaleDateString('vi-VN')})`,
      };
    }
    if (reportPeriodType === 'quarter') {
      const year = now.getFullYear();
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(year, q * 3, 1).toISOString().slice(0, 10);
      const to = new Date(year, (q + 1) * 3, 0).toISOString().slice(0, 10);
      return {
        dateRange: { from, to },
        periodTitle: `Quý ${q + 1}/${year} (${new Date(from).toLocaleDateString('vi-VN')} - ${new Date(to).toLocaleDateString('vi-VN')})`,
      };
    }
    if (reportPeriodType === 'year') {
      const year = now.getFullYear();
      const from = `${year}-01-01`;
      const to = `${year}-12-31`;
      return {
        dateRange: { from, to },
        periodTitle: `Năm ${year} (01/01/${year} - 31/12/${year})`,
      };
    }
    // custom
    return {
      dateRange: { from: reportFromDate, to: reportToDate },
      periodTitle: `Từ ngày ${new Date(reportFromDate).toLocaleDateString('vi-VN')} đến ngày ${new Date(reportToDate).toLocaleDateString('vi-VN')}`,
    };
  }, [reportPeriodType, reportFromDate, reportToDate]);

  // Lọc kết quả theo khoảng thời gian đã chọn và xét nghiệm
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchAssay = r.assayId === currentAssay?.id;
      if (!matchAssay) return false;

      if (dateRange.from) {
        const fromTs = new Date(`${dateRange.from}T00:00:00`).getTime();
        if (new Date(r.timestamp).getTime() < fromTs) return false;
      }
      if (dateRange.to) {
        const toTs = new Date(`${dateRange.to}T23:59:59`).getTime();
        if (new Date(r.timestamp).getTime() > toTs) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [results, currentAssay, dateRange]);

  // Các lô của xét nghiệm
  const assayLots = lots.filter((l) => l.assayId === currentAssay?.id);
  const lotL1 = assayLots.find((l) => l.level === 'level1');
  const lotL2 = assayLots.find((l) => l.level === 'level2');

  const l1Results = filteredResults.filter((r) => r.level === 'level1');
  const l2Results = filteredResults.filter((r) => r.level === 'level2');

  const statsL1 = useMemo(() => {
    if (!lotL1 || !currentAssay) return null;
    return calculateQCStatistics(
      l1Results,
      lotL1.targetMean,
      lotL1.targetSD,
      lotL1.targetCV,
      currentAssay.cliaTeaPercent
    );
  }, [l1Results, lotL1, currentAssay]);

  const statsL2 = useMemo(() => {
    if (!lotL2 || !currentAssay) return null;
    return calculateQCStatistics(
      l2Results,
      lotL2.targetMean,
      lotL2.targetSD,
      lotL2.targetCV,
      currentAssay.cliaTeaPercent
    );
  }, [l2Results, lotL2, currentAssay]);

  // Danh sách sự cố vi phạm trong kỳ
  const incidents = useMemo(() => {
    return filteredResults.filter((r) => r.status === 'REJECTED' || r.status === 'WARNING');
  }, [filteredResults]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Báo Cáo Tổng Hợp & Đánh Giá Nội Kiểm Định Kỳ (ISO 15189)
              </h3>
              <p className="text-[11px] text-slate-500">
                Xuất file PDF báo cáo tháng phục vụ thẩm định chất lượng và lưu trữ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In / Lưu PDF (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Selection Ribbon (Hidden on print) */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Kỳ Báo Cáo:</span>
            </div>

            <div className="flex items-center p-0.5 bg-white border border-slate-300 rounded-lg">
              <button
                type="button"
                onClick={() => setReportPeriodType('month')}
                className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
                  reportPeriodType === 'month' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodType('last_month')}
                className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
                  reportPeriodType === 'last_month' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng trước
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodType('30d')}
                className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
                  reportPeriodType === '30d' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 ngày
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodType('quarter')}
                className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
                  reportPeriodType === 'quarter' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quý này
              </button>
              <button
                type="button"
                onClick={() => setReportPeriodType('custom')}
                className={`px-2 py-1 rounded text-xs transition-colors font-medium ${
                  reportPeriodType === 'custom' ? 'bg-cyan-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tùy chọn ngày
              </button>
            </div>

            {reportPeriodType === 'custom' && (
              <div className="flex items-center gap-1.5 font-mono bg-white p-1 rounded-lg border border-slate-300">
                <input
                  type="date"
                  value={reportFromDate}
                  onChange={(e) => setReportFromDate(e.target.value)}
                  className="px-1.5 py-0.5 text-xs text-slate-800"
                />
                <span className="text-slate-400">→</span>
                <input
                  type="date"
                  value={reportToDate}
                  onChange={(e) => setReportToDate(e.target.value)}
                  className="px-1.5 py-0.5 text-xs text-slate-800"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Thiết Bị:</span>
              <select
                value={selectedInstId}
                onChange={(e) => setSelectedInstId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              >
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} - {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Xét Nghiệm:</span>
              <select
                value={selectedAssayId}
                onChange={(e) => setSelectedAssayId(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-medium"
              >
                {availableAssays.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 print-container" id="qc-printable-report">
          {/* Header Phòng Xét Nghiệm Chuẩn Y Tế */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  BỆNH VIỆN ĐA KHOA TRUNG TÂM · KHOA XÉT NGHIỆM
                </h4>
                <p className="text-[11px] text-slate-500">
                  Phòng Quản Lý Chất Lượng Xét Nghiệm (Quality Assurance Office)
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Mã tài liệu: ISO15189-BM-QC-{currentAssay?.code || 'LAB'}-2026
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border border-slate-900 text-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  TIÊU CHUẨN ISO 15189:2022
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Ngày in báo cáo: {new Date().toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                BÁO CÁO TỔNG HỢP VÀ ĐÁNH GIÁ NỘI KIỂM CHẤT LƯỢNG (IQC)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Kỳ đánh giá: <strong className="text-slate-900">{periodTitle}</strong> · Xét nghiệm: <strong className="text-slate-900">{currentAssay?.name} ({currentAssay?.code})</strong>
              </p>
            </div>
          </div>

          {/* Thông Tin Thiết Bị & Phương Pháp Đo */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
            <div>
              <p><span className="text-slate-500">Máy phân tích:</span> <strong className="text-slate-900">{currentInst.name} ({currentInst.code})</strong></p>
              <p className="mt-1"><span className="text-slate-500">Model / Serial:</span> {currentInst.model} - SN: {currentInst.serialNumber}</p>
              <p className="mt-1"><span className="text-slate-500">Khoa / Bộ phận:</span> {currentInst.department}</p>
            </div>
            <div>
              <p><span className="text-slate-500">Phương pháp xét nghiệm:</span> <strong className="text-slate-900">{currentAssay?.method}</strong></p>
              <p className="mt-1"><span className="text-slate-500">Đơn vị đo / Loại mẫu:</span> {currentAssay?.unit} / {currentAssay?.sampleType}</p>
              <p className="mt-1"><span className="text-slate-500">Tổng sai số cho phép TEa:</span> <strong className="text-slate-900">{currentAssay?.cliaTeaPercent}% (CLIA)</strong></p>
            </div>
          </div>

          {/* Bảng Thống Kê Chỉ Số Chất Lượng (Mean, SD, CV, SDI, Six Sigma) */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase text-slate-800 mb-2">
              1. Thống Kê Thông Số Nội Kiểm Thực Tế vs Mục Tiêu (Statistical Evaluation)
            </h4>
            <table className="w-full text-xs border border-slate-300 border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Chỉ số đánh giá</th>
                  <th className="p-2 border-r border-slate-300 text-center">Mức 1 - Level 1 (Normal)</th>
                  <th className="p-2 text-center">Mức 2 - Level 2 (High)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Mã Lô QC / Nhà sản xuất</td>
                  <td className="p-2 text-center border-r border-slate-300">{lotL1?.lotNumber} ({lotL1?.manufacturer})</td>
                  <td className="p-2 text-center">{lotL2?.lotNumber} ({lotL2?.manufacturer})</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Hạn sử dụng (Exp Date)</td>
                  <td className="p-2 text-center border-r border-slate-300">{lotL1?.expDate}</td>
                  <td className="p-2 text-center">{lotL2?.expDate}</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Tổng số lượt chạy (N)</td>
                  <td className="p-2 text-center font-bold border-r border-slate-300">{statsL1?.totalRuns || 0} lần</td>
                  <td className="p-2 text-center font-bold">{statsL2?.totalRuns || 0} lần</td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Mean Mục Tiêu vs Thực Tế</td>
                  <td className="p-2 text-center border-r border-slate-300">
                    {lotL1?.targetMean} vs <strong className="text-slate-900">{statsL1?.calculatedMean || '-'}</strong>
                  </td>
                  <td className="p-2 text-center">
                    {lotL2?.targetMean} vs <strong className="text-slate-900">{statsL2?.calculatedMean || '-'}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Độ lệch chuẩn SD (Target vs Actual)</td>
                  <td className="p-2 text-center border-r border-slate-300">
                    ±{lotL1?.targetSD} vs <strong>±{statsL1?.calculatedSD || '-'}</strong>
                  </td>
                  <td className="p-2 text-center">
                    ±{lotL2?.targetSD} vs <strong>±{statsL2?.calculatedSD || '-'}</strong>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Hệ số biến thiên CV% (Target vs Actual)</td>
                  <td className="p-2 text-center border-r border-slate-300">
                    {lotL1?.targetCV}% vs <strong>{statsL1?.calculatedCV || '-'}%</strong>
                  </td>
                  <td className="p-2 text-center">
                    {lotL2?.targetCV}% vs <strong>{statsL2?.calculatedCV || '-'}%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Chỉ số SDI (Standard Deviation Index)</td>
                  <td className="p-2 text-center border-r border-slate-300 font-bold">
                    {statsL1 ? (statsL1.sdi > 0 ? `+${statsL1.sdi}` : statsL1.sdi) : '-'}
                  </td>
                  <td className="p-2 text-center font-bold">
                    {statsL2 ? (statsL2.sdi > 0 ? `+${statsL2.sdi}` : statsL2.sdi) : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Độ chệch %Bias</td>
                  <td className="p-2 text-center border-r border-slate-300">{statsL1?.biasPercent}%</td>
                  <td className="p-2 text-center">{statsL2?.biasPercent}%</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2 font-sans border-r border-slate-300">Chỉ số Six Sigma (Thang 6σ)</td>
                  <td className="p-2 text-center border-r border-slate-300 text-emerald-800">
                    {statsL1?.sigmaMetric}σ (Đạt chuẩn)
                  </td>
                  <td className="p-2 text-center text-emerald-800">
                    {statsL2?.sigmaMetric}σ (Đạt chuẩn)
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans font-medium border-r border-slate-300">Tỷ lệ lượt chạy hợp lệ (Pass Rate)</td>
                  <td className="p-2 text-center border-r border-slate-300 text-emerald-700 font-bold">{statsL1?.passRate}%</td>
                  <td className="p-2 text-center text-emerald-700 font-bold">{statsL2?.passRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Biểu Đồ Levey-Jennings Gộp Chung Tất Cả Mức Nồng Độ (Embedded Vector L-J Chart) */}
          <div className="mb-6 print-break-inside-avoid">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-slate-800">
                2. Biểu Đồ Levey-Jennings Gộp Tất Cả Mức Nồng Độ (Trục Chuẩn Hóa SDI / Z-Score)
              </h4>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                  <span>Mức 1 (Bình thường): Mean={lotL1?.targetMean}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs rotate-45 bg-[#7c3aed]" />
                  <span>Mức 2 (Bệnh lý): Mean={lotL2?.targetMean}</span>
                </span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-white">
              {filteredResults.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-6">
                  Chưa có dữ liệu nội kiểm cho kỳ {periodTitle}.
                </div>
              ) : (() => {
                const width = 880;
                const height = 260;
                const pad = { top: 25, right: 90, bottom: 35, left: 65 };
                const cW = width - pad.left - pad.right;
                const cH = height - pad.top - pad.bottom;

                const zMin = -3.8;
                const zMax = 3.8;
                const getZY = (z: number) => {
                  const clamped = Math.max(zMin, Math.min(zMax, z));
                  const r = (clamped - zMin) / (zMax - zMin);
                  return pad.top + cH * (1 - r);
                };

                const maxP = Math.max(l1Results.length, l2Results.length, 1);
                const getX = (idx: number) => {
                  if (maxP <= 1) return pad.left + cW / 2;
                  return pad.left + (idx / (maxP - 1)) * cW;
                };

                const genP = (arr: QCResult[]) => arr.reduce((acc, c, i) => {
                  const x = getX(i);
                  const y = getZY(c.zScore);
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '');

                const yP3 = getZY(3.0);
                const yP2 = getZY(2.0);
                const yP1 = getZY(1.0);
                const yM = getZY(0.0);
                const yM1 = getZY(-1.0);
                const yM2 = getZY(-2.0);
                const yM3 = getZY(-3.0);

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-mono text-[10px]">
                    {/* Shaded bands */}
                    <rect x={pad.left} y={pad.top} width={cW} height={yP3 - pad.top} fill="#fef2f2" opacity="0.6" />
                    <rect x={pad.left} y={yM3} width={cW} height={pad.top + cH - yM3} fill="#fef2f2" opacity="0.6" />
                    <rect x={pad.left} y={yP3} width={cW} height={yP2 - yP3} fill="#fffbeb" opacity="0.7" />
                    <rect x={pad.left} y={yM2} width={cW} height={yM3 - yM2} fill="#fffbeb" opacity="0.7" />
                    <rect x={pad.left} y={yP1} width={cW} height={yM1 - yP1} fill="#f8fafc" opacity="0.9" />

                    <rect x={pad.left} y={pad.top} width={cW} height={cH} fill="none" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Standard Deviation Guide Lines */}
                    <line x1={pad.left} y1={yP3} x2={pad.left + cW} y2={yP3} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x={pad.left - 6} y={yP3 + 3} textAnchor="end" className="fill-rose-600 font-bold text-[9px]">+3SD</text>

                    <line x1={pad.left} y1={yP2} x2={pad.left + cW} y2={yP2} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                    <text x={pad.left - 6} y={yP2 + 3} textAnchor="end" className="fill-amber-600 font-semibold text-[9px]">+2SD</text>

                    <line x1={pad.left} y1={yP1} x2={pad.left + cW} y2={yP1} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                    <text x={pad.left - 6} y={yP1 + 3} textAnchor="end" className="fill-slate-400 text-[9px]">+1SD</text>

                    <line x1={pad.left} y1={yM} x2={pad.left + cW} y2={yM} stroke="#0f172a" strokeWidth="1.5" />
                    <text x={pad.left - 6} y={yM + 3} textAnchor="end" className="fill-slate-900 font-bold text-[10px]">Mean</text>

                    <line x1={pad.left} y1={yM1} x2={pad.left + cW} y2={yM1} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                    <text x={pad.left - 6} y={yM1 + 3} textAnchor="end" className="fill-slate-400 text-[9px]">-1SD</text>

                    <line x1={pad.left} y1={yM2} x2={pad.left + cW} y2={yM2} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                    <text x={pad.left - 6} y={yM2 + 3} textAnchor="end" className="fill-amber-600 font-semibold text-[9px]">-2SD</text>

                    <line x1={pad.left} y1={yM3} x2={pad.left + cW} y2={yM3} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x={pad.left - 6} y={yM3 + 3} textAnchor="end" className="fill-rose-600 font-bold text-[9px]">-3SD</text>

                    {/* Right-hand labels */}
                    <text x={pad.left + cW + 6} y={yP2 + 3} textAnchor="start" className="fill-slate-500 text-[8px]">
                      {lotL1 ? `L1:${(lotL1.targetMean + 2 * lotL1.targetSD).toFixed(1)}` : ''}
                    </text>
                    <text x={pad.left + cW + 6} y={yM + 3} textAnchor="start" className="fill-slate-900 font-bold text-[9px]">
                      {lotL1 ? `L1:${lotL1.targetMean}` : ''}
                    </text>
                    <text x={pad.left + cW + 6} y={yM2 + 3} textAnchor="start" className="fill-slate-500 text-[8px]">
                      {lotL1 ? `L1:${(lotL1.targetMean - 2 * lotL1.targetSD).toFixed(1)}` : ''}
                    </text>

                    {/* Level 1 Line (Blue) */}
                    {l1Results.length > 1 && (
                      <path d={genP(l1Results)} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
                    )}

                    {/* Level 2 Line (Purple) */}
                    {l2Results.length > 1 && (
                      <path d={genP(l2Results)} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
                    )}

                    {/* Level 1 Points */}
                    {l1Results.map((r, i) => (
                      <circle 
                        key={`rep-l1-${r.id}`}
                        cx={getX(i)} 
                        cy={getZY(r.zScore)} 
                        r={r.status === 'REJECTED' ? 4.5 : 3} 
                        fill={r.status === 'REJECTED' ? '#ef4444' : r.status === 'WARNING' ? '#f59e0b' : '#0284c7'} 
                        stroke="#ffffff" 
                        strokeWidth="1" 
                      />
                    ))}

                    {/* Level 2 Points */}
                    {l2Results.map((r, i) => (
                      <rect 
                        key={`rep-l2-${r.id}`}
                        x={getX(i) - 3} 
                        y={getZY(r.zScore) - 3} 
                        width="6" 
                        height="6" 
                        transform={`rotate(45 ${getX(i)} ${getZY(r.zScore)})`}
                        fill={r.status === 'REJECTED' ? '#ef4444' : r.status === 'WARNING' ? '#f59e0b' : '#7c3aed'} 
                        stroke="#ffffff" 
                        strokeWidth="1" 
                      />
                    ))}

                    {/* X axis labels */}
                    {Array.from({ length: maxP }).map((_, i) => (
                      <text key={`rx-${i}`} x={getX(i)} y={pad.top + cH + 14} textAnchor="middle" className="fill-slate-400 text-[8px]">
                        #{i + 1}
                      </text>
                    ))}
                  </svg>
                );
              })()}
            </div>
          </div>

          {/* Bảng Sự Cố Vi Phạm & Hồ Sơ Khắc Phục CAPA */}
          <div className="mb-8 print-break-inside-avoid">
            <h4 className="text-xs font-bold uppercase text-slate-800 mb-2">
              3. Nhật Ký Xử Lý Sự Cố Vi Phạm Quy Tắc Westgard & CAPA Trong Kỳ
            </h4>
            {incidents.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200 text-center">
                Không ghi nhận sự cố vi phạm Westgard nào trong kỳ đánh giá này. Toàn bộ các lần chạy đều trong giới hạn kiểm soát.
              </div>
            ) : (
              <table className="w-full text-[11px] border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300">Ngày / Giờ</th>
                    <th className="p-1.5 border-r border-slate-300">Mức QC</th>
                    <th className="p-1.5 border-r border-slate-300">Giá trị đo</th>
                    <th className="p-1.5 border-r border-slate-300">Quy tắc vi phạm</th>
                    <th className="p-1.5 border-r border-slate-300">Nguyên nhân & Hành động CAPA</th>
                    <th className="p-1.5 text-center">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td className="p-1.5 font-mono border-r border-slate-300">
                        {new Date(inc.timestamp).toLocaleDateString('vi-VN')} {new Date(inc.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 uppercase font-mono">{inc.level}</td>
                      <td className="p-1.5 font-mono font-bold border-r border-slate-300">
                        {inc.value} ({inc.zScore > 0 ? `+${inc.zScore}` : inc.zScore}SD)
                      </td>
                      <td className="p-1.5 font-bold text-rose-700 border-r border-slate-300">
                        {inc.violations.map(v => v.ruleName).join(', ') || '1-2s'}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-slate-600">
                        {inc.capa ? (
                          <>
                            <strong>Khắc phục:</strong> {inc.capa.actionTaken}
                            {inc.capa.rerunValue && <span> (Chạy lại: {inc.capa.rerunValue})</span>}
                          </>
                        ) : (
                          <span className="text-amber-600 italic">Đang ghi nhận xử lý</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center font-bold">
                        {inc.capa?.status === 'RESOLVED' ? (
                          <span className="text-emerald-700">Đã duyệt</span>
                        ) : (
                          <span className="text-amber-600">Chờ duyệt</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Phần Ký Duyệt Chuẩn ISO 15189 (3 Chữ Ký) */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs print-break-inside-avoid">
            <div className="space-y-16">
              <div>
                <p className="font-bold text-slate-900 uppercase">Kỹ Thuật Viên Thực Hiện</p>
                <p className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">CN. Trần Quốc Tuấn</p>
                <p className="text-[10px] text-slate-500 font-mono">KTV-082</p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-bold text-slate-900 uppercase">Phụ Trách Quản Lý QC</p>
                <p className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">ThS. Lê Thị Thanh Mai</p>
                <p className="text-[10px] text-slate-500 font-mono">KTVT-014</p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-bold text-slate-900 uppercase">Trưởng Khoa Xét Nghiệm</p>
                <p className="text-[10px] text-slate-500">(Phê duyệt & Đóng dấu)</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">TS. BS. Nguyễn Văn Hùng</p>
                <p className="text-[10px] text-slate-500 font-mono">BSXN-001</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
