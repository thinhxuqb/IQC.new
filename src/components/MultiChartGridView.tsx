import React, { useState, useMemo } from 'react';
import { Instrument, QCLot, QCResult, TestAssay } from '../types/qc';
import { LeveyJenningsChart } from './LeveyJenningsChart';
import { 
  Grid2X2, 
  Square, 
  Filter, 
  Server, 
  Calendar,
  FileText, 
  Plus, 
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface MultiChartGridViewProps {
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  results: QCResult[];
  selectedAssayId: string;
  onSelectAssay: (assayId: string) => void;
  onSelectResultForCapa?: (result: QCResult) => void;
  onOpenManualEntry?: () => void;
  onOpenReportModal?: () => void;
}

export const MultiChartGridView: React.FC<MultiChartGridViewProps> = ({
  instruments,
  assays,
  lots,
  results,
  selectedAssayId,
  onSelectAssay,
  onSelectResultForCapa,
  onOpenManualEntry,
  onOpenReportModal,
}) => {
  // Chế độ xem: 'grid' (Toàn bộ các biểu đồ) hoặc 'single' (Đơn lẻ 1 chỉ số)
  const [chartViewMode, setChartViewMode] = useState<'grid' | 'single'>('grid');

  // Lọc theo máy
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');

  // Bộ chọn thời gian DÙNG CHUNG cho tất cả xét nghiệm (Không chọn riêng từng xét nghiệm)
  const [globalTimePreset, setGlobalTimePreset] = useState<'7d' | '15d' | '30d' | 'month' | 'last_month' | 'all' | 'custom'>('30d');
  const [globalStartDate, setGlobalStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [globalEndDate, setGlobalEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const globalDateRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (globalTimePreset === '7d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: from.toISOString().slice(0, 10), to: todayStr };
    }
    if (globalTimePreset === '15d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 15);
      return { from: from.toISOString().slice(0, 10), to: todayStr };
    }
    if (globalTimePreset === '30d') {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: from.toISOString().slice(0, 10), to: todayStr };
    }
    if (globalTimePreset === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }
    if (globalTimePreset === 'last_month') {
      const year = now.getFullYear();
      const month = now.getMonth() - 1;
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }
    if (globalTimePreset === 'custom') {
      return { from: globalStartDate, to: globalEndDate };
    }
    return { from: '', to: '' }; // 'all'
  }, [globalTimePreset, globalStartDate, globalEndDate]);

  // Danh sách ID xét nghiệm được chọn hiển thị
  const [selectedAssayIds, setSelectedAssayIds] = useState<string[]>(() => {
    return assays.map(a => a.id);
  });

  // Khi chọn máy: lọc các xét nghiệm thuộc máy đó
  const displayedAssays = useMemo(() => {
    return assays.filter(a => {
      const matchInst = selectedInstFilter === 'ALL' || a.instrumentId === selectedInstFilter;
      const isSelected = selectedAssayIds.includes(a.id);
      return matchInst && isSelected;
    });
  }, [assays, selectedInstFilter, selectedAssayIds]);

  // Các xét nghiệm khả dụng theo máy đang lọc
  const availableAssaysForFilter = useMemo(() => {
    return assays.filter(a => selectedInstFilter === 'ALL' || a.instrumentId === selectedInstFilter);
  }, [assays, selectedInstFilter]);

  // Chọn tất cả xét nghiệm của máy đang lọc
  const handleSelectAllCurrent = () => {
    const currentIds = availableAssaysForFilter.map(a => a.id);
    setSelectedAssayIds(prev => Array.from(new Set([...prev, ...currentIds])));
  };

  // Bỏ chọn tất cả xét nghiệm của máy đang lọc
  const handleDeselectAllCurrent = () => {
    const currentIds = new Set(availableAssaysForFilter.map(a => a.id));
    setSelectedAssayIds(prev => prev.filter(id => !currentIds.has(id)));
  };

  // Toggle 1 xét nghiệm
  const handleToggleAssay = (assayId: string) => {
    setSelectedAssayIds(prev => 
      prev.includes(assayId) ? prev.filter(id => id !== assayId) : [...prev, assayId]
    );
  };

  // Đơn xét nghiệm hiện tại khi ở chế độ Single View
  const currentSingleAssay = assays.find(a => a.id === selectedAssayId) || assays[0];
  const currentSingleLots = lots.filter(l => l.assayId === currentSingleAssay?.id);

  // Chuyển sang xem chi tiết 1 xét nghiệm
  const handleDrilldownToSingle = (assayId: string) => {
    onSelectAssay(assayId);
    setChartViewMode('single');
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Controls Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Toggle & Filter by Instrument */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setChartViewMode('grid')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartViewMode === 'grid' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span>Toàn Bộ Xét Nghiệm ({displayedAssays.length})</span>
            </button>
            <button
              onClick={() => setChartViewMode('single')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartViewMode === 'single' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Xem Đơn Chỉ Số</span>
            </button>
          </div>

          {/* If Single Mode: Dropdown to pick assay */}
          {chartViewMode === 'single' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Chỉ số:</span>
              <select
                value={selectedAssayId}
                onChange={e => onSelectAssay(e.target.value)}
                className="text-xs font-bold py-1.5 px-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
              >
                {assays.map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.instrumentId}] {a.code} - {a.name} ({a.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If Grid Mode: Filter by Instrument */}
          {chartViewMode === 'grid' && (
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedInstFilter}
                onChange={e => {
                  const inst = e.target.value;
                  setSelectedInstFilter(inst);
                  if (inst !== 'ALL') {
                    const matchIds = assays.filter(a => a.instrumentId === inst).map(a => a.id);
                    setSelectedAssayIds(prev => Array.from(new Set([...prev, ...matchIds])));
                  }
                }}
                className="text-xs font-bold py-1.5 px-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Tất cả thiết bị ({instruments.length})</option>
                {instruments.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    [{inst.id}] {inst.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenManualEntry && (
            <button
              onClick={onOpenManualEntry}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nhập Kết Quả QC</span>
            </button>
          )}

          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất Báo Cáo QC (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* BỘ CHỌN THỜI GIAN DÙNG CHUNG CHO TẤT CẢ XÉT NGHIỆM */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              Khoảng Thời Gian Biểu Đồ Dùng Chung
            </span>
            <span className="text-[11px] text-slate-500">
              Đồng bộ dữ liệu thời gian cho toàn bộ các xét nghiệm hiển thị bên dưới
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setGlobalTimePreset('7d')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                globalTimePreset === '7d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setGlobalTimePreset('15d')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                globalTimePreset === '15d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              15 ngày
            </button>
            <button
              type="button"
              onClick={() => setGlobalTimePreset('30d')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                globalTimePreset === '30d' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => setGlobalTimePreset('month')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                globalTimePreset === 'month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => setGlobalTimePreset('last_month')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                globalTimePreset === 'last_month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng trước
            </button>
            <button
              type="button"
              onClick={() => setGlobalTimePreset('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                globalTimePreset === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setGlobalTimePreset('custom')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                globalTimePreset === 'custom' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tùy chọn ngày
            </button>
          </div>

          {globalTimePreset === 'custom' && (
            <div className="flex items-center gap-1.5 font-mono bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200">
              <span className="text-indigo-900 font-medium">Từ:</span>
              <input
                type="date"
                value={globalStartDate}
                onChange={e => setGlobalStartDate(e.target.value)}
                className="px-2 py-0.5 border border-indigo-300 rounded bg-white text-slate-900 text-xs"
              />
              <span className="text-indigo-400">→</span>
              <span className="text-indigo-900 font-medium">Đến:</span>
              <input
                type="date"
                value={globalEndDate}
                onChange={e => setGlobalEndDate(e.target.value)}
                className="px-2 py-0.5 border border-indigo-300 rounded bg-white text-slate-900 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Multi-Chart Assay Filter Tags (Khi ở chế độ hiển thị toàn bộ) */}
      {chartViewMode === 'grid' && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Bộ Lọc Xét Nghiệm Hiển Thị ({displayedAssays.length}/{availableAssaysForFilter.length}):</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllCurrent}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
              >
                Chọn Tất Cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllCurrent}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                Bỏ Chọn Hết
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
            {availableAssaysForFilter.map(a => {
              const isSelected = selectedAssayIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleToggleAssay(a.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-400">[{a.instrumentId}]</span>
                  <span>{a.code}</span>
                  <span className="text-[10px] opacity-70">({a.name})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HIỂN THỊ TOÀN BỘ THEO CHIỀU NGANG (KHÔNG CHIA 2 CỘT)     */}
      {/* ======================================================== */}
      {chartViewMode === 'grid' && (
        <div className="w-full">
          {displayedAssays.length > 0 ? (
            <div className="flex flex-col gap-6 w-full">
              {displayedAssays.map(assay => {
                const assayLots = lots.filter(l => l.assayId === assay.id);
                const assayResults = results.filter(r => r.assayId === assay.id);
                
                const latestResult = [...assayResults].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                const isRejected = latestResult?.status === 'REJECTED';
                const isWarning = latestResult?.status === 'WARNING';

                return (
                  <div
                    key={assay.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden w-full"
                  >
                    {/* Full Width Card Header */}
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 text-white">
                          {assay.instrumentId}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">
                            {assay.code} - {assay.name}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">
                            Đơn vị: <strong>{assay.unit}</strong> · Giới hạn sai số TEa: <strong>{assay.cliaTeaPercent}%</strong> · Phương pháp: {assay.method}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Từ chối (Vi phạm Westgard)
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Cảnh báo theo dõi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đạt kiểm chuẩn QC
                          </span>
                        )}

                        <button
                          onClick={() => handleDrilldownToSingle(assay.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Xem phân tích chi tiết từng mức"
                        >
                          <span>Xem Chi Tiết</span>
                        </button>
                      </div>
                    </div>

                    {/* Chart Canvas: Full Width Across Horizontal Space */}
                    <div className="p-3 w-full">
                      <LeveyJenningsChart
                        assay={assay}
                        lots={assayLots}
                        results={results}
                        onSelectResultForCapa={onSelectResultForCapa}
                        compact={false}
                        globalDateRange={globalDateRange}
                        hideIndividualTimeFilter={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Chưa có xét nghiệm nào được chọn hiển thị
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Vui lòng chọn ít nhất một xét nghiệm từ danh sách phía trên hoặc bấm &quot;Chọn Tất Cả&quot;.
              </p>
              <button
                type="button"
                onClick={handleSelectAllCurrent}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Chọn Tất Cả Xét Nghiệm
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CHẾ ĐỘ 2: XEM ĐƠN CHỈ SỐ (SINGLE VIEW)                   */}
      {/* ======================================================== */}
      {chartViewMode === 'single' && currentSingleAssay && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs w-full">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                [{currentSingleAssay.instrumentId}]
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Biểu Đồ Levey-Jennings Chi Tiết: {currentSingleAssay.code} - {currentSingleAssay.name} ({currentSingleAssay.unit})
              </h3>
            </div>
            <button
              onClick={() => setChartViewMode('grid')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-lg"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span>Quay Lại Xem Toàn Bộ</span>
            </button>
          </div>

          <LeveyJenningsChart
            assay={currentSingleAssay}
            lots={currentSingleLots}
            results={results}
            onSelectResultForCapa={onSelectResultForCapa}
            compact={false}
            globalDateRange={globalDateRange}
            hideIndividualTimeFilter={true}
          />
        </div>
      )}
    </div>
  );
};
