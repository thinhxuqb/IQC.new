import React, { useState, useMemo } from 'react';
import { QCLot, QCResult, TestAssay } from '../types/qc';
import { calculateQCStatistics } from '../utils/westgard';
import { 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  Layers, 
  Eye, 
  EyeOff,
  GitMerge,
  SplitSquareVertical,
  Calendar
} from 'lucide-react';

interface LeveyJenningsChartProps {
  assay: TestAssay;
  lots: QCLot[]; // Các lô của xét nghiệm này (thường có Level 1 và Level 2)
  results: QCResult[];
  onSelectResultForCapa?: (result: QCResult) => void;
  compact?: boolean;
  onZoomIn?: () => void;
  globalDateRange?: { from: string; to: string };
  hideIndividualTimeFilter?: boolean;
}

export const LeveyJenningsChart: React.FC<LeveyJenningsChartProps> = ({
  assay,
  lots,
  results,
  onSelectResultForCapa,
  compact = false,
  onZoomIn,
  globalDateRange,
  hideIndividualTimeFilter = false,
}) => {
  // Chế độ hiển thị: 'combined' (gộp chung 1 trục) hoặc 'separated' (tách riêng từng trục)
  const [viewMode, setViewMode] = useState<'combined' | 'separated'>('combined');
  
  // Quản lý khoảng thời gian xem biểu đồ (dùng khi không có globalDateRange)
  const [timePreset, setTimePreset] = useState<'7d' | '15d' | '30d' | 'month' | 'last_month' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  
  // Bật/tắt hiển thị từng mức nồng độ
  const [visibleLevels, setVisibleLevels] = useState<{ [key: string]: boolean }>({
    level1: true,
    level2: true,
    level3: true,
  });

  const [hoveredPoint, setHoveredPoint] = useState<{
    result: QCResult;
    lot: QCLot;
    x: number;
    y: number;
  } | null>(null);

  // Tính toán khoảng ngày bắt đầu & kết thúc dựa trên preset hoặc globalDateRange
  const activeDateRange = useMemo(() => {
    if (globalDateRange) {
      return globalDateRange;
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (timePreset === '7d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: from.toISOString().slice(0, 10), to: todayStr };
    }
    if (timePreset === '15d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 15);
      return { from: from.toISOString().slice(0, 10), to: todayStr };
    }
    if (timePreset === '30d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: from.toISOString().slice(0, 10), to: todayStr };
    }
    if (timePreset === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }
    if (timePreset === 'last_month') {
      const year = now.getFullYear();
      const month = now.getMonth() - 1;
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }
    if (timePreset === 'custom') {
      return { from: customStartDate, to: customEndDate };
    }
    return { from: '', to: '' }; // 'all'
  }, [globalDateRange, timePreset, customStartDate, customEndDate]);

  // Lọc kết quả của xét nghiệm theo khoảng thời gian đã chọn
  const assayResults = useMemo(() => {
    let list = results.filter((r) => r.assayId === assay.id);

    if (activeDateRange.from) {
      const fromTs = new Date(`${activeDateRange.from}T00:00:00`).getTime();
      list = list.filter((r) => new Date(r.timestamp).getTime() >= fromTs);
    }
    if (activeDateRange.to) {
      const toTs = new Date(`${activeDateRange.to}T23:59:59`).getTime();
      list = list.filter((r) => new Date(r.timestamp).getTime() <= toTs);
    }

    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [results, assay.id, activeDateRange]);

  // Các lô theo từng level
  const lotL1 = lots.find((l) => l.level === 'level1');
  const lotL2 = lots.find((l) => l.level === 'level2');
  const lotL3 = lots.find((l) => l.level === 'level3');

  // Kết quả theo từng level trong khoảng thời gian đã chọn
  const l1Results = useMemo(() => {
    return assayResults.filter((r) => r.level === 'level1');
  }, [assayResults]);

  const l2Results = useMemo(() => {
    return assayResults.filter((r) => r.level === 'level2');
  }, [assayResults]);

  const l3Results = useMemo(() => {
    return assayResults.filter((r) => r.level === 'level3');
  }, [assayResults]);

  // Thống kê cho từng Level
  const statsL1 = useMemo(() => {
    if (!lotL1) return null;
    return calculateQCStatistics(
      l1Results,
      lotL1.targetMean,
      lotL1.targetSD,
      lotL1.targetCV,
      assay.cliaTeaPercent
    );
  }, [l1Results, lotL1, assay.cliaTeaPercent]);

  const statsL2 = useMemo(() => {
    if (!lotL2) return null;
    return calculateQCStatistics(
      l2Results,
      lotL2.targetMean,
      lotL2.targetSD,
      lotL2.targetCV,
      assay.cliaTeaPercent
    );
  }, [l2Results, lotL2, assay.cliaTeaPercent]);

  const statsL3 = useMemo(() => {
    if (!lotL3) return null;
    return calculateQCStatistics(
      l3Results,
      lotL3.targetMean,
      lotL3.targetSD,
      lotL3.targetCV,
      assay.cliaTeaPercent
    );
  }, [l3Results, lotL3, assay.cliaTeaPercent]);

  const toggleLevelVisibility = (level: string) => {
    setVisibleLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  /**
   * Render BIỂU ĐỒ GỘP TẤT CẢ CÁC MỨC NỒNG ĐỘ LÊN CHUNG 1 TRỤC (Shared SDI / Z-Score Axis)
   */
  const renderCombinedMultiLevelLJ = () => {
    const width = 1040;
    const height = 400;
    const padding = { top: 40, right: 140, bottom: 50, left: 75 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Trục Y dùng chung biểu diễn độ lệch chuẩn Z-Score (SDI) từ -3.8SD đến +3.8SD
    const zMin = -3.8;
    const zMax = 3.8;

    const getZ_Y = (z: number) => {
      const clamped = Math.max(zMin, Math.min(zMax, z));
      const ratio = (clamped - zMin) / (zMax - zMin);
      return padding.top + chartH * (1 - ratio);
    };

    const yP3SD = getZ_Y(3.0);
    const yP2SD = getZ_Y(2.0);
    const yP1SD = getZ_Y(1.0);
    const yMean = getZ_Y(0.0);
    const yM1SD = getZ_Y(-1.0);
    const yM2SD = getZ_Y(-2.0);
    const yM3SD = getZ_Y(-3.0);

    // Xác định số lượng điểm trên trục X (lấy số điểm lớn nhất giữa các level)
    const maxPoints = Math.max(
      visibleLevels.level1 ? l1Results.length : 0,
      visibleLevels.level2 ? l2Results.length : 0,
      visibleLevels.level3 ? l3Results.length : 0,
      1
    );

    const getX = (index: number) => {
      if (maxPoints <= 1) return padding.left + chartW / 2;
      return padding.left + (index / (maxPoints - 1)) * chartW;
    };

    // Tạo đường SVG Path cho từng mức nồng độ
    const generatePath = (resultsList: QCResult[]) => {
      return resultsList.reduce((acc, curr, idx) => {
        const x = getX(idx);
        const y = getZ_Y(curr.zScore);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '');
    };

    const pathL1 = visibleLevels.level1 ? generatePath(l1Results) : '';
    const pathL2 = visibleLevels.level2 ? generatePath(l2Results) : '';
    const pathL3 = visibleLevels.level3 && lotL3 ? generatePath(l3Results) : '';

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Header Thông Tin L-J Gộp Chung */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse" />
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Biểu Đồ Levey-Jennings Gộp Chung Tất Cả Mức Nồng Độ</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Chuẩn hóa Trục SDI (Z-Score)
                </span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đồng trục chuẩn hóa theo độ lệch chuẩn (±1SD, ±2SD, ±3SD). Giúp so sánh độ chệch hệ thống và phát hiện vi phạm liên mức R-4s tức thì.
            </p>
          </div>

          {/* Interactive Legend Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {lotL1 && (
              <button
                type="button"
                onClick={() => toggleLevelVisibility('level1')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                  visibleLevels.level1
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                <span>Mức 1: {lotL1.targetMean} {assay.unit}</span>
                {visibleLevels.level1 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}

            {lotL2 && (
              <button
                type="button"
                onClick={() => toggleLevelVisibility('level2')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                  visibleLevels.level2
                    ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-xs rotate-45 bg-[#7c3aed]" />
                <span>Mức 2: {lotL2.targetMean} {assay.unit}</span>
                {visibleLevels.level2 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}

            {lotL3 && (
              <button
                type="button"
                onClick={() => toggleLevelVisibility('level3')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                  visibleLevels.level3
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                <span>Mức 3: {lotL3.targetMean} {assay.unit}</span>
                {visibleLevels.level3 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Multi-Level Stats Comparison Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          {lotL1 && statsL1 && (
            <div className="p-3 bg-cyan-50/50 rounded-lg border border-cyan-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-cyan-950 font-sans block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                  <span>Mức 1 (Bình thường) · Lô {lotL1.lotNumber}</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Target Mean: {lotL1.targetMean} ± {lotL1.targetSD} (CV: {lotL1.targetCV}%)
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">
                  Thực tế: {statsL1.calculatedMean} (CV: {statsL1.calculatedCV}%)
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  SDI: {statsL1.sdi > 0 ? `+${statsL1.sdi}` : statsL1.sdi} · Six Sigma: {statsL1.sigmaMetric}σ
                </span>
              </div>
            </div>
          )}

          {lotL2 && statsL2 && (
            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-950 font-sans block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs rotate-45 bg-[#7c3aed]" />
                  <span>Mức 2 (Bệnh lý cao) · Lô {lotL2.lotNumber}</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Target Mean: {lotL2.targetMean} ± {lotL2.targetSD} (CV: {lotL2.targetCV}%)
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">
                  Thực tế: {statsL2.calculatedMean} (CV: {statsL2.calculatedCV}%)
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  SDI: {statsL2.sdi > 0 ? `+${statsL2.sdi}` : statsL2.sdi} · Six Sigma: {statsL2.sigmaMetric}σ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SVG Multi-Level Combined Canvas */}
        <div className="relative overflow-x-auto">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-auto min-w-[850px] select-none"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {/* Shaded Background Zones (Standard Deviation Intervals) */}
            {/* Vùng ngoài ±3SD (Đỏ nhạt - Không chấp nhận / Reject) */}
            <rect x={padding.left} y={padding.top} width={chartW} height={yP3SD - padding.top} fill="#fef2f2" opacity="0.6" />
            <rect x={padding.left} y={yM3SD} width={chartW} height={padding.top + chartH - yM3SD} fill="#fef2f2" opacity="0.6" />

            {/* Vùng cảnh báo 2SD đến 3SD (Vàng cam nhạt - Cảnh báo / Warning) */}
            <rect x={padding.left} y={yP3SD} width={chartW} height={yP2SD - yP3SD} fill="#fffbeb" opacity="0.75" />
            <rect x={padding.left} y={yM2SD} width={chartW} height={yM3SD - yM2SD} fill="#fffbeb" opacity="0.75" />

            {/* Vùng an toàn trong ±1SD (Xám nhạt chuẩn / In-Control) */}
            <rect x={padding.left} y={yP1SD} width={chartW} height={yM1SD - yP1SD} fill="#f8fafc" opacity="0.9" />

            {/* Khung viền đồ thị */}
            <rect 
              x={padding.left} 
              y={padding.top} 
              width={chartW} 
              height={chartH} 
              fill="none" 
              stroke="#e2e8f0" 
              strokeWidth="1" 
            />

            {/* Lưới dọc theo số lần chạy */}
            {Array.from({ length: maxPoints }).map((_, idx) => {
              const x = getX(idx);
              return (
                <line 
                  key={`comb-vline-${idx}`}
                  x1={x} 
                  y1={padding.top} 
                  x2={x} 
                  y2={padding.top + chartH} 
                  stroke="#f1f5f9" 
                  strokeWidth="1" 
                />
              );
            })}

            {/* CÁC ĐƯỜNG THAM CHIẾU QUY TẮC WESTGARD TRÊN TRỤC DÙNG CHUNG */}
            {/* +3SD (Reject Limit) */}
            <line x1={padding.left} y1={yP3SD} x2={padding.left + chartW} y2={yP3SD} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={padding.left - 8} y={yP3SD + 3} textAnchor="end" className="text-[10px] font-mono fill-rose-600 font-bold">+3SD</text>
            <text x={padding.left + chartW + 8} y={yP3SD + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">
              {lotL1 ? `L1: ${(lotL1.targetMean + 3 * lotL1.targetSD).toFixed(1)}` : ''} {lotL2 ? `| L2: ${(lotL2.targetMean + 3 * lotL2.targetSD).toFixed(1)}` : ''}
            </text>

            {/* +2SD (Warning Limit) */}
            <line x1={padding.left} y1={yP2SD} x2={padding.left + chartW} y2={yP2SD} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,3" />
            <text x={padding.left - 8} y={yP2SD + 3} textAnchor="end" className="text-[10px] font-mono fill-amber-600 font-semibold">+2SD</text>
            <text x={padding.left + chartW + 8} y={yP2SD + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">
              {lotL1 ? `L1: ${(lotL1.targetMean + 2 * lotL1.targetSD).toFixed(1)}` : ''} {lotL2 ? `| L2: ${(lotL2.targetMean + 2 * lotL2.targetSD).toFixed(1)}` : ''}
            </text>

            {/* +1SD */}
            <line x1={padding.left} y1={yP1SD} x2={padding.left + chartW} y2={yP1SD} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
            <text x={padding.left - 8} y={yP1SD + 3} textAnchor="end" className="text-[10px] font-mono fill-slate-400">+1SD</text>
            <text x={padding.left + chartW + 8} y={yP1SD + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">
              {lotL1 ? `L1: ${(lotL1.targetMean + 1 * lotL1.targetSD).toFixed(1)}` : ''} {lotL2 ? `| L2: ${(lotL2.targetMean + 1 * lotL2.targetSD).toFixed(1)}` : ''}
            </text>

            {/* Mean (Trung tâm 0 SD) */}
            <line x1={padding.left} y1={yMean} x2={padding.left + chartW} y2={yMean} stroke="#0f172a" strokeWidth="1.75" />
            <text x={padding.left - 8} y={yMean + 3} textAnchor="end" className="text-[11px] font-mono fill-slate-900 font-bold">Mean (0)</text>
            <text x={padding.left + chartW + 8} y={yMean + 3} textAnchor="start" className="text-[10px] font-mono fill-slate-900 font-bold">
              {lotL1 ? `L1: ${lotL1.targetMean}` : ''} {lotL2 ? `| L2: ${lotL2.targetMean}` : ''}
            </text>

            {/* -1SD */}
            <line x1={padding.left} y1={yM1SD} x2={padding.left + chartW} y2={yM1SD} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
            <text x={padding.left - 8} y={yM1SD + 3} textAnchor="end" className="text-[10px] font-mono fill-slate-400">-1SD</text>
            <text x={padding.left + chartW + 8} y={yM1SD + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">
              {lotL1 ? `L1: ${(lotL1.targetMean - 1 * lotL1.targetSD).toFixed(1)}` : ''} {lotL2 ? `| L2: ${(lotL2.targetMean - 1 * lotL2.targetSD).toFixed(1)}` : ''}
            </text>

            {/* -2SD (Warning Limit) */}
            <line x1={padding.left} y1={yM2SD} x2={padding.left + chartW} y2={yM2SD} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,3" />
            <text x={padding.left - 8} y={yM2SD + 3} textAnchor="end" className="text-[10px] font-mono fill-amber-600 font-semibold">-2SD</text>
            <text x={padding.left + chartW + 8} y={yM2SD + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">
              {lotL1 ? `L1: ${(lotL1.targetMean - 2 * lotL1.targetSD).toFixed(1)}` : ''} {lotL2 ? `| L2: ${(lotL2.targetMean - 2 * lotL2.targetSD).toFixed(1)}` : ''}
            </text>

            {/* -3SD (Reject Limit) */}
            <line x1={padding.left} y1={yM3SD} x2={padding.left + chartW} y2={yM3SD} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={padding.left - 8} y={yM3SD + 3} textAnchor="end" className="text-[10px] font-mono fill-rose-600 font-bold">-3SD</text>
            <text x={padding.left + chartW + 8} y={yM3SD + 3} textAnchor="start" className="text-[9px] font-mono fill-slate-400">
              {lotL1 ? `L1: ${(lotL1.targetMean - 3 * lotL1.targetSD).toFixed(1)}` : ''} {lotL2 ? `| L2: ${(lotL2.targetMean - 3 * lotL2.targetSD).toFixed(1)}` : ''}
            </text>

            {/* ĐƯỜNG NỐI ĐỒ THỊ MỨC 1 (Level 1: Màu Xanh Cyan / Cobalt) */}
            {visibleLevels.level1 && l1Results.length > 1 && (
              <path 
                d={pathL1} 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="2.25" 
                strokeLinejoin="round" 
              />
            )}

            {/* ĐƯỜNG NỐI ĐỒ THỊ MỨC 2 (Level 2: Màu Tím Indigo / Purple) */}
            {visibleLevels.level2 && l2Results.length > 1 && (
              <path 
                d={pathL2} 
                fill="none" 
                stroke="#7c3aed" 
                strokeWidth="2.25" 
                strokeLinejoin="round" 
              />
            )}

            {/* ĐƯỜNG NỐI ĐỒ THỊ MỨC 3 (Level 3 nếu có: Màu Xanh Lá Emerald) */}
            {visibleLevels.level3 && l3Results.length > 1 && (
              <path 
                d={pathL3} 
                fill="none" 
                stroke="#059669" 
                strokeWidth="2" 
                strokeLinejoin="round" 
              />
            )}

            {/* CÁC ĐIỂM ĐO MỨC 1 (Level 1 - Điểm Tròn Circle) */}
            {visibleLevels.level1 && lotL1 && l1Results.map((res, idx) => {
              const cx = getX(idx);
              const cy = getZ_Y(res.zScore);
              const isReject = res.status === 'REJECTED';
              const isWarning = res.status === 'WARNING';
              const hasCapa = Boolean(res.capa);

              return (
                <g 
                  key={`l1-${res.id}`} 
                  className="cursor-pointer transition-transform"
                  onMouseEnter={() => setHoveredPoint({ result: res, lot: lotL1, x: cx, y: cy })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectResultForCapa && onSelectResultForCapa(res)}
                >
                  {isReject && (
                    <circle cx={cx} cy={cy} r="10" fill="#ef4444" opacity="0.3" className="animate-pulse" />
                  )}
                  {isWarning && (
                    <circle cx={cx} cy={cy} r="8" fill="#f59e0b" opacity="0.3" />
                  )}

                  {/* Marker Mức 1: Hình Tròn */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={isReject ? '5.5' : isWarning ? '5' : '4'} 
                    fill={isReject ? '#ef4444' : isWarning ? '#f59e0b' : '#0284c7'} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />

                  {hasCapa && (
                    <circle cx={cx} cy={cy - 7} r="2" fill="#10b981" />
                  )}
                </g>
              );
            })}

            {/* CÁC ĐIỂM ĐO MỨC 2 (Level 2 - Điểm Hình Thoi Diamond) */}
            {visibleLevels.level2 && lotL2 && l2Results.map((res, idx) => {
              const cx = getX(idx);
              const cy = getZ_Y(res.zScore);
              const isReject = res.status === 'REJECTED';
              const isWarning = res.status === 'WARNING';
              const hasCapa = Boolean(res.capa);
              const dSize = isReject ? 6 : isWarning ? 5.5 : 4.5;

              return (
                <g 
                  key={`l2-${res.id}`} 
                  className="cursor-pointer transition-transform"
                  onMouseEnter={() => setHoveredPoint({ result: res, lot: lotL2, x: cx, y: cy })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectResultForCapa && onSelectResultForCapa(res)}
                >
                  {isReject && (
                    <rect x={cx - 7} y={cy - 7} width="14" height="14" transform={`rotate(45 ${cx} ${cy})`} fill="#ef4444" opacity="0.3" className="animate-pulse" />
                  )}
                  {isWarning && (
                    <rect x={cx - 6} y={cy - 6} width="12" height="12" transform={`rotate(45 ${cx} ${cy})`} fill="#f59e0b" opacity="0.3" />
                  )}

                  {/* Marker Mức 2: Hình Thoi (Diamond) xoay 45 độ */}
                  <rect 
                    x={cx - dSize} 
                    y={cy - dSize} 
                    width={dSize * 2} 
                    height={dSize * 2} 
                    transform={`rotate(45 ${cx} ${cy})`}
                    fill={isReject ? '#ef4444' : isWarning ? '#f59e0b' : '#7c3aed'} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />

                  {hasCapa && (
                    <circle cx={cx} cy={cy - 8} r="2" fill="#10b981" />
                  )}
                </g>
              );
            })}

            {/* NHÃN THỜI GIAN / NGÀY THÁNG TRÊN TRỤC X */}
            {Array.from({ length: maxPoints }).map((_, idx) => {
              const cx = getX(idx);
              const sampleResult = (visibleLevels.level1 && l1Results[idx]) || (visibleLevels.level2 && l2Results[idx]) || (visibleLevels.level3 && l3Results[idx]);
              const dateLabel = sampleResult ? new Date(sampleResult.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : `#${idx + 1}`;
              return (
                <text 
                  key={`xlabel-${idx}`}
                  x={cx} 
                  y={padding.top + chartH + 18} 
                  textAnchor="middle" 
                  className="text-[9px] font-mono fill-slate-500 font-medium"
                >
                  {dateLabel}
                </text>
              );
            })}

            {/* Tiêu đề trục X */}
            <text 
              x={padding.left + chartW / 2} 
              y={height - 8} 
              textAnchor="middle" 
              className="text-[11px] font-medium fill-slate-500"
            >
              Chuỗi lượt chạy nội kiểm định kỳ ({maxPoints} lượt đo gần nhất)
            </text>
          </svg>

          {/* Interactive Floating Tooltip HUD */}
          {hoveredPoint && (
            <div 
              className="absolute z-30 pointer-events-none bg-slate-900 text-white rounded-xl p-3.5 shadow-2xl text-xs space-y-1.5 w-72 border border-slate-700 font-mono"
              style={{
                left: `${Math.min(hoveredPoint.x + 14, width - 290)}px`,
                top: `${Math.max(hoveredPoint.y - 80, 10)}px`,
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-sans">
                  <span className={`w-2.5 h-2.5 rounded-full ${hoveredPoint.lot.level === 'level1' ? 'bg-[#0284c7]' : 'bg-[#7c3aed]'}`} />
                  <span>{hoveredPoint.lot.levelName}</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  hoveredPoint.result.status === 'REJECTED' 
                    ? 'bg-rose-500/20 text-rose-300' 
                    : hoveredPoint.result.status === 'WARNING' 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {hoveredPoint.result.status}
                </span>
              </div>

              <div className="flex justify-between text-slate-300 pt-0.5">
                <span>Giá trị đo thực tế:</span>
                <strong className="text-white text-sm font-bold">{hoveredPoint.result.value} {assay.unit}</strong>
              </div>

              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Target Mean ± SD:</span>
                <span>{hoveredPoint.lot.targetMean} ± {hoveredPoint.lot.targetSD}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Độ lệch chuẩn SDI (Z):</span>
                <span className={`font-bold ${Math.abs(hoveredPoint.result.zScore) > 2 ? 'text-amber-400' : 'text-cyan-300'}`}>
                  {hoveredPoint.result.zScore > 0 ? `+${hoveredPoint.result.zScore}` : hoveredPoint.result.zScore} SD
                </span>
              </div>

              <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                <span>Thời gian:</span>
                <span>{new Date(hoveredPoint.result.timestamp).toLocaleDateString('vi-VN')} {new Date(hoveredPoint.result.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Người chạy:</span>
                <span>{hoveredPoint.result.operatorName}</span>
              </div>

              {hoveredPoint.result.violations.length > 0 && (
                <div className="pt-1.5 border-t border-slate-700/80 text-[11px] text-rose-300">
                  <div className="font-bold flex items-center gap-1 font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Vi phạm: {hoveredPoint.result.violations.map(v => v.ruleName).join(', ')}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 italic mt-0.5 font-sans">
                    {hoveredPoint.result.violations[0].description}
                  </div>
                </div>
              )}

              {hoveredPoint.result.capa && (
                <div className="text-[10px] text-emerald-400 pt-1 border-t border-slate-700/80 flex items-center gap-1 font-sans">
                  <CheckCircle className="w-3 h-3" />
                  <span>Đã lập CAPA: {hoveredPoint.result.capa.status === 'RESOLVED' ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800 font-sans">
                Nhấp chuột để mở hồ sơ xử lý sự cố CAPA
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render biểu đồ riêng lẻ từng mức (cho chế độ xem tách rời khi cần kiểm tra sâu)
   */
  const renderSingleLotLJ = (lot: QCLot, lotResults: QCResult[], stats: ReturnType<typeof calculateQCStatistics> | null) => {
    const width = 1040;
    const height = 320;
    const padding = { top: 35, right: 60, bottom: 45, left: 75 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const mean = lot.targetMean;
    const sd = lot.targetSD;

    const yMin = mean - 3.8 * sd;
    const yMax = mean + 3.8 * sd;

    const getY = (val: number) => {
      const clamped = Math.max(yMin, Math.min(yMax, val));
      const ratio = (clamped - yMin) / (yMax - yMin);
      return padding.top + chartH * (1 - ratio);
    };

    const getX = (index: number, total: number) => {
      if (total <= 1) return padding.left + chartW / 2;
      return padding.left + (index / (total - 1)) * chartW;
    };

    const yP3SD = getY(mean + 3 * sd);
    const yP2SD = getY(mean + 2 * sd);
    const yP1SD = getY(mean + 1 * sd);
    const yMean = getY(mean);
    const yM1SD = getY(mean - 1 * sd);
    const yM2SD = getY(mean - 2 * sd);
    const yM3SD = getY(mean - 3 * sd);

    const linePath = lotResults.reduce((acc, curr, idx) => {
      const x = getX(idx, lotResults.length);
      const y = getY(curr.value);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${lot.level === 'level1' ? 'bg-[#0284c7]' : 'bg-[#7c3aed]'}`} />
              <h4 className="font-bold text-sm text-slate-900">
                {lot.levelName} · Lô: <span className="font-mono text-slate-700">{lot.lotNumber}</span>
              </h4>
              <span className="text-xs text-slate-500">({lot.controlName})</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-mono">
              <span>HSD: {lot.expDate}</span>
              <span>·</span>
              <span>Target Mean: <strong className="text-slate-800">{lot.targetMean} {assay.unit}</strong></span>
              <span>·</span>
              <span>Target SD: <strong className="text-slate-800">±{lot.targetSD}</strong></span>
              <span>·</span>
              <span>Target CV%: <strong className="text-slate-800">{lot.targetCV}%</strong></span>
            </div>
          </div>

          {stats && (
            <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Mean Thực</span>
                <span className="font-bold text-slate-900">{stats.calculatedMean}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">CV% Thực</span>
                <span className={`font-bold ${stats.calculatedCV > lot.targetCV * 1.2 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {stats.calculatedCV}%
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">SDI (Z)</span>
                <span className="font-bold text-slate-900">{stats.sdi > 0 ? `+${stats.sdi}` : stats.sdi}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">Six Sigma</span>
                <span className="font-bold text-emerald-700">{stats.sigmaMetric}σ</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[750px] select-none font-mono">
            <rect x={padding.left} y={padding.top} width={chartW} height={yP3SD - padding.top} fill="#fef2f2" opacity="0.6" />
            <rect x={padding.left} y={yM3SD} width={chartW} height={padding.top + chartH - yM3SD} fill="#fef2f2" opacity="0.6" />
            <rect x={padding.left} y={yP3SD} width={chartW} height={yP2SD - yP3SD} fill="#fffbeb" opacity="0.75" />
            <rect x={padding.left} y={yM2SD} width={chartW} height={yM3SD - yM2SD} fill="#fffbeb" opacity="0.75" />
            <rect x={padding.left} y={yP1SD} width={chartW} height={yM1SD - yP1SD} fill="#f8fafc" opacity="0.9" />

            <rect x={padding.left} y={padding.top} width={chartW} height={chartH} fill="none" stroke="#e2e8f0" strokeWidth="1" />

            <line x1={padding.left} y1={yP3SD} x2={padding.left + chartW} y2={yP3SD} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={padding.left - 8} y={yP3SD + 3} textAnchor="end" className="text-[10px] fill-rose-600 font-bold">+3SD</text>

            <line x1={padding.left} y1={yP2SD} x2={padding.left + chartW} y2={yP2SD} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,3" />
            <text x={padding.left - 8} y={yP2SD + 3} textAnchor="end" className="text-[10px] fill-amber-600 font-semibold">+2SD</text>

            <line x1={padding.left} y1={yP1SD} x2={padding.left + chartW} y2={yP1SD} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
            <text x={padding.left - 8} y={yP1SD + 3} textAnchor="end" className="text-[10px] fill-slate-400">+1SD</text>

            <line x1={padding.left} y1={yMean} x2={padding.left + chartW} y2={yMean} stroke="#0f172a" strokeWidth="1.75" />
            <text x={padding.left - 8} y={yMean + 3} textAnchor="end" className="text-[11px] fill-slate-900 font-bold">Mean</text>

            <line x1={padding.left} y1={yM1SD} x2={padding.left + chartW} y2={yM1SD} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
            <text x={padding.left - 8} y={yM1SD + 3} textAnchor="end" className="text-[10px] fill-slate-400">-1SD</text>

            <line x1={padding.left} y1={yM2SD} x2={padding.left + chartW} y2={yM2SD} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,3" />
            <text x={padding.left - 8} y={yM2SD + 3} textAnchor="end" className="text-[10px] fill-amber-600 font-semibold">-2SD</text>

            <line x1={padding.left} y1={yM3SD} x2={padding.left + chartW} y2={yM3SD} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={padding.left - 8} y={yM3SD + 3} textAnchor="end" className="text-[10px] fill-rose-600 font-bold">-3SD</text>

            {lotResults.length > 1 && (
              <path 
                d={linePath} 
                fill="none" 
                stroke={lot.level === 'level1' ? '#0284c7' : '#7c3aed'} 
                strokeWidth="2" 
                strokeLinejoin="round" 
              />
            )}

            {lotResults.map((res, idx) => {
              const cx = getX(idx, lotResults.length);
              const cy = getY(res.value);
              const isReject = res.status === 'REJECTED';
              const isWarning = res.status === 'WARNING';

              return (
                <circle 
                  key={res.id}
                  cx={cx} 
                  cy={cy} 
                  r={isReject ? '5' : isWarning ? '4.5' : '3.5'} 
                  fill={isReject ? '#ef4444' : isWarning ? '#f59e0b' : lot.level === 'level1' ? '#0284c7' : '#7c3aed'} 
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Assay Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
              {assay.code}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {assay.name} ({assay.unit})
            </h3>
            <span className="text-xs text-slate-500 font-mono">· TEa: {assay.cliaTeaPercent}%</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Phương pháp: {assay.method} · Mẫu: {assay.sampleType}
          </div>
        </div>

        {/* View Mode & Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Gộp chung 1 trục vs Tách riêng từng trục */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('combined')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'combined'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5 text-cyan-600" />
              <span>Gộp Chung 1 Trục</span>
            </button>
            <button
              onClick={() => setViewMode('separated')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'separated'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-slate-600" />
              <span>Tách Riêng Từng Mức</span>
            </button>
          </div>

          {/* Time Range Selector (chỉ hiện khi không có bộ chọn thời gian chung) */}
          {!hideIndividualTimeFilter && !globalDateRange && (
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              <div className="flex items-center gap-1 px-1.5 py-0.5 text-slate-500 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Khoảng thời gian:</span>
              </div>

              <button
                type="button"
                onClick={() => setTimePreset('7d')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === '7d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 ngày
              </button>
              <button
                type="button"
                onClick={() => setTimePreset('15d')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === '15d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                15 ngày
              </button>
              <button
                type="button"
                onClick={() => setTimePreset('30d')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === '30d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 ngày
              </button>
              <button
                type="button"
                onClick={() => setTimePreset('month')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === 'month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setTimePreset('last_month')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === 'last_month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng trước
              </button>
              <button
                type="button"
                onClick={() => setTimePreset('all')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setTimePreset('custom')}
                className={`px-2 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  timePreset === 'custom' ? 'bg-white text-cyan-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tùy chọn ngày
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Range Custom Input Bar (when custom is selected and individual time filter is active) */}
      {!hideIndividualTimeFilter && !globalDateRange && timePreset === 'custom' && (
        <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-700" />
            <span className="font-bold text-cyan-950">Chọn Khoảng Ngày Cụ Thể Để Vẽ Biểu Đồ L-J:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">Từ ngày:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium focus:outline-hidden focus:border-cyan-600"
              />
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">Đến ngày:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium focus:outline-hidden focus:border-cyan-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Area */}
      {viewMode === 'combined' ? (
        renderCombinedMultiLevelLJ()
      ) : (
        <div className="space-y-6">
          {visibleLevels.level1 && lotL1 && renderSingleLotLJ(lotL1, l1Results, statsL1)}
          {visibleLevels.level2 && lotL2 && renderSingleLotLJ(lotL2, l2Results, statsL2)}
          {visibleLevels.level3 && lotL3 && renderSingleLotLJ(lotL3, l3Results, statsL3)}
        </div>
      )}

      {/* Ghi chú hướng dẫn đọc biểu đồ Levey-Jennings gộp */}
      {!compact && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
          <h5 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Ý Nghĩa Biểu Đồ Levey-Jennings Gộp Chung 1 Trục (Multi-Level Normalization)</span>
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <span className="font-medium text-slate-900">● Đường Mức 1 (Normal - Xanh Cyan):</span>
              <p className="text-[11px] text-slate-500">Biểu diễn mẫu kiểm tra ở dải nồng độ sinh lý bình thường. Điểm đánh dấu dạng tròn (●).</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-purple-900">◆ Đường Mức 2 (Pathological - Tím Indigo):</span>
              <p className="text-[11px] text-slate-500">Biểu diễn mẫu kiểm tra ở dải bệnh lý cao. Điểm đánh dấu dạng hình thoi (◆).</p>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-rose-700">▲ Phát hiện lỗi R-4s và trôi hệ thống:</span>
              <p className="text-[11px] text-slate-500">Khi hai đường tách xa nhau quá 4SD trong cùng một ca, hoặc cùng trôi về một phía của trục 0 SD, hệ thống phát hiện lỗi chéo giữa các mức nồng độ.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
