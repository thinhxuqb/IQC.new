import React, { useState } from 'react';
import { Instrument, InstrumentId, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { calculateQCStatistics } from '../utils/westgard';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Radio, 
  PlusCircle, 
  ArrowRight, 
  Server, 
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  results: QCResult[];
  currentUser: UserProfile;
  onSelectAssayForChart: (assayId: string) => void;
  onOpenManualEntry: () => void;
  onOpenReceiver: () => void;
  onOpenReport: () => void;
  onOpenCapaList: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  instruments,
  assays,
  lots,
  results,
  currentUser,
  onSelectAssayForChart,
  onOpenManualEntry,
  onOpenReceiver,
  onOpenReport,
  onOpenCapaList,
}) => {
  const [selectedInstFilter, setSelectedInstFilter] = useState<'ALL' | InstrumentId>('ALL');

  // Thống kê toàn viện
  const totalRuns = results.length;
  const inControlRuns = results.filter((r) => r.status === 'ACCEPTED').length;
  const inControlRate = totalRuns > 0 ? ((inControlRuns / totalRuns) * 100).toFixed(1) : '100';
  const pendingCapaCount = results.filter((r) => (r.status === 'REJECTED' || r.status === 'WARNING') && (!r.capa || r.capa.status === 'PENDING_APPROVAL')).length;

  const filteredAssays = selectedInstFilter === 'ALL'
    ? assays
    : assays.filter((a) => a.instrumentId === selectedInstFilter);

  return (
    <div className="space-y-6">
      {/* Top Clinical Telemetry Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Xét Nghiệm & Thiết Bị Giám Sát
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{assays.length}</span>
            <span className="text-xs text-slate-500">xét nghiệm / 3 máy LIS</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AU400 · Sysmex 800 · Cobas e411</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Tỷ Lệ Trong Kiểm Soát (In-Control)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">{inControlRate}%</span>
            <span className="text-xs text-slate-500">chuẩn ISO 15189</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-mono">
            <span>{inControlRuns} / {totalRuns} lượt chạy đạt</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Sự Cố Westgard Chờ Thẩm Định (CAPA)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${pendingCapaCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {pendingCapaCount}
            </span>
            <span className="text-xs text-slate-500">vụ cần ký duyệt</span>
          </div>
          <div className="mt-2 text-[11px]">
            <button
              onClick={onOpenCapaList}
              className="text-cyan-700 hover:text-cyan-900 font-semibold underline flex items-center gap-1"
            >
              <span>Xem danh sách CAPA</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Độ Tin Cậy Hệ Thống (Six Sigma)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-700">5.4σ</span>
            <span className="text-xs text-slate-500">World Class Quality</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đạt tiêu chuẩn TEa / CLIA 2026</span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold">Thao Tác Nhanh Quản Lý Nội Kiểm (IQC)</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Phục vụ tiếp nhận mẫu đầu ca, kiểm tra vi phạm Westgard và xuất báo cáo lưu trữ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenManualEntry}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nhập Thủ Công</span>
          </button>
          <button
            onClick={onOpenReceiver}
            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-white" />
            <span>Nhận Tín Hiệu Máy LIS</span>
          </button>
          <button
            onClick={onOpenReport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Xuất Báo Cáo PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Instrument */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSelectedInstFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedInstFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả Thiết Bị
          </button>
          <button
            onClick={() => setSelectedInstFilter('AU400')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedInstFilter === 'AU400'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AU400 (Sinh Hóa)
          </button>
          <button
            onClick={() => setSelectedInstFilter('SYSMEX800')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedInstFilter === 'SYSMEX800'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sysmex 800 (Huyết Học)
          </button>
          <button
            onClick={() => setSelectedInstFilter('COBASE411')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedInstFilter === 'COBASE411'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cobas e411 (Miễn Dịch)
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          Hiển thị {filteredAssays.length} xét nghiệm
        </span>
      </div>

      {/* Assay Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssays.map((assay) => {
          const assayResults = results.filter((r) => r.assayId === assay.id);
          const latestResult = assayResults.length > 0 ? assayResults[assayResults.length - 1] : null;
          const assayLots = lots.filter((l) => l.assayId === assay.id);
          const lotL1 = assayLots.find((l) => l.level === 'level1');

          // Tính stats L1 sơ bộ
          const stats = lotL1 ? calculateQCStatistics(
            assayResults.filter(r => r.level === 'level1'),
            lotL1.targetMean,
            lotL1.targetSD,
            lotL1.targetCV,
            assay.cliaTeaPercent
          ) : null;

          const isRejected = latestResult?.status === 'REJECTED';
          const isWarning = latestResult?.status === 'WARNING';

          return (
            <div
              key={assay.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {assay.instrumentId} · {assay.code}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">
                      {assay.name}
                    </h4>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isRejected
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {latestResult ? latestResult.status : 'Chưa chạy'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 mt-1">
                  Đơn vị: {assay.unit} · TEa: {assay.cliaTeaPercent}%
                </div>

                {/* Latest Run Quick Telemetry */}
                {latestResult && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giá trị đo gần nhất:</span>
                      <strong className="text-slate-900">{latestResult.value} {assay.unit}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SDI (Z-Score):</span>
                      <span className={Math.abs(latestResult.zScore) > 2 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {latestResult.zScore > 0 ? `+${latestResult.zScore}` : latestResult.zScore} SD
                      </span>
                    </div>
                    {stats && (
                      <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>CV% Thực tế: <strong className="text-slate-800">{stats.calculatedCV}%</strong></span>
                        <span>Six Sigma: <strong className="text-emerald-700">{stats.sigmaMetric}σ</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {assayResults.length} lần đo
                </span>
                <button
                  onClick={() => onSelectAssayForChart(assay.id)}
                  className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 group"
                >
                  <span>Biểu đồ Levey-Jennings</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
