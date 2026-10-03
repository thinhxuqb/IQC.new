import React, { useState, useMemo } from 'react';
import { Instrument, QCLot, QCResult, TestAssay } from '../types/qc';
import { LeveyJenningsChart } from './LeveyJenningsChart';
import { 
  BarChart2, 
  Grid2X2, 
  Square, 
  Grid3X3, 
  Filter, 
  Server, 
  TestTube, 
  Maximize2, 
  CheckSquare, 
  Square as SquareIcon, 
  FileText, 
  Plus, 
  Layers,
  Sparkles,
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
  // Chế độ xem: 'grid' (Đa biểu đồ) hoặc 'single' (Đơn lẻ)
  const [chartViewMode, setChartViewMode] = useState<'grid' | 'single'>('grid');

  // Lọc theo máy
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');

  // Số cột của lưới đa biểu đồ: 1, 2, 3
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(2);

  // Danh sách ID xét nghiệm được chọn hiển thị trong chế độ Đa biểu đồ
  const [selectedAssayIds, setSelectedAssayIds] = useState<string[]>(() => {
    // Mặc định chọn tất cả xét nghiệm của máy đầu tiên hoặc tất cả
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

  // Hàm chuyển sang xem chi tiết 1 xét nghiệm
  const handleDrilldownToSingle = (assayId: string) => {
    onSelectAssay(assayId);
    setChartViewMode('single');
  };

  return (
    <div className="space-y-4">
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
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span>Xem Đa Biểu Đồ ({displayedAssays.length})</span>
            </button>
            <button
              onClick={() => setChartViewMode('single')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartViewMode === 'single' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
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
                    // Tự động kích hoạt toàn bộ xét nghiệm của máy đó
                    const matchIds = assays.filter(a => a.instrumentId === inst).map(a => a.id);
                    setSelectedAssayIds(prev => Array.from(new Set([...prev, ...matchIds])));
                  }
                }}
                className="text-xs font-bold py-1.5 px-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Grid Column Selector */}
          {chartViewMode === 'grid' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setGridCols(1)}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  gridCols === 1 ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hiển thị 1 cột (Lớn)"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCols(2)}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  gridCols === 2 ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hiển thị 2 cột (Chuẩn cân đối)"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  gridCols === 3 ? 'bg-white shadow-2xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hiển thị 3 cột (Thu nhỏ tổng quan)"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
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
              <span>Xuất Báo Cáo Tháng (PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Chart Assay Filter Tags (Khi ở chế độ Đa biểu đồ) */}
      {chartViewMode === 'grid' && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <TestTube className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chọn các xét nghiệm hiển thị ({displayedAssays.length} / {availableAssaysForFilter.length}):</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllCurrent}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
              >
                Chọn Tất Cả
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllCurrent}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                Bỏ Chọn
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {availableAssaysForFilter.map(assay => {
              const isSelected = selectedAssayIds.includes(assay.id);
              return (
                <button
                  key={assay.id}
                  type="button"
                  onClick={() => handleToggleAssay(assay.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 opacity-60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  <span className="font-mono text-[10px] text-slate-500">[{assay.instrumentId}]</span>
                  <span>{assay.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHẾ ĐỘ 1: XEM ĐA BIỂU ĐỒ (MULTI-CHART GRID VIEW)         */}
      {/* ======================================================== */}
      {chartViewMode === 'grid' && (
        <div>
          {displayedAssays.length > 0 ? (
            <div className={`grid gap-4 ${
              gridCols === 1 
                ? 'grid-cols-1' 
                : gridCols === 2 
                ? 'grid-cols-1 lg:grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {displayedAssays.map(assay => {
                const assayLots = lots.filter(l => l.assayId === assay.id);
                const assayResults = results.filter(r => r.assayId === assay.id);
                
                // Kiểm tra xem xét nghiệm này có vi phạm gần nhất không
                const latestResult = [...assayResults].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                const isRejected = latestResult?.status === 'REJECTED';
                const isWarning = latestResult?.status === 'WARNING';

                return (
                  <div
                    key={assay.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between"
                  >
                    {/* Compact Card Header */}
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                          {assay.instrumentId}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">
                            {assay.code} - {assay.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Đơn vị: {assay.unit} · TEa: {assay.cliaTeaPercent}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Từ chối
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            Cảnh báo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Đạt QC
                          </span>
                        )}

                        <button
                          onClick={() => handleDrilldownToSingle(assay.id)}
                          className="p-1 rounded text-slate-500 hover:text-indigo-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Phóng to & Xem phân tích chi tiết"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Chart Canvas */}
                    <div className="p-2">
                      <LeveyJenningsChart
                        assay={assay}
                        lots={assayLots}
                        results={results}
                        onSelectResultForCapa={onSelectResultForCapa}
                        compact={true}
                        onZoomIn={() => handleDrilldownToSingle(assay.id)}
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
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
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
              <span>Quay Lại Xem Đa Biểu Đồ</span>
            </button>
          </div>

          <LeveyJenningsChart
            assay={currentSingleAssay}
            lots={currentSingleLots}
            results={results}
            onSelectResultForCapa={onSelectResultForCapa}
            compact={false}
          />
        </div>
      )}
    </div>
  );
};
