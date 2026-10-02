import React, { useState } from 'react';
import { Instrument, QCResult, TestAssay, UserProfile } from '../types/qc';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert, Eye, FileEdit } from 'lucide-react';

interface CapaListViewProps {
  results: QCResult[];
  assays: TestAssay[];
  instruments: Instrument[];
  currentUser: UserProfile;
  onOpenCapaModal: (result: QCResult) => void;
  onOpenChart: (assayId: string) => void;
}

export const CapaListView: React.FC<CapaListViewProps> = ({
  results,
  assays,
  instruments,
  currentUser,
  onOpenCapaModal,
  onOpenChart,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [filterInst, setFilterInst] = useState<string>('ALL');

  // Lọc các kết quả có sự cố (bị Reject hoặc Warning hoặc đã có CAPA)
  const incidentResults = results.filter((r) => {
    const isIncident = r.status === 'REJECTED' || r.status === 'WARNING' || Boolean(r.capa);
    if (!isIncident) return false;

    if (filterInst !== 'ALL' && r.instrumentId !== filterInst) return false;

    if (filterStatus === 'PENDING') {
      return !r.capa || r.capa.status === 'PENDING_APPROVAL';
    }
    if (filterStatus === 'RESOLVED') {
      return r.capa?.status === 'RESOLVED';
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Top Filter and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Sổ Nhật Ký Xử Lý Sự Cố QC & Khắc Phục (CAPA Register)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các lần chạy vi phạm quy tắc Westgard và quy trình thẩm định ký duyệt theo chuẩn ISO 15189
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Tất cả ({incidentResults.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterStatus === 'PENDING' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Chờ phê duyệt
            </button>
            <button
              onClick={() => setFilterStatus('RESOLVED')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                filterStatus === 'RESOLVED' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Đã thẩm định
            </button>
          </div>

          {/* Instrument Filter */}
          <select
            value={filterInst}
            onChange={(e) => setFilterInst(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium"
          >
            <option value="ALL">Tất cả máy (AU400, Sysmex, Cobas)</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>{i.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Incident Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {incidentResults.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">Không có sự cố vi phạm nào trong bộ lọc này!</p>
            <p className="text-[11px] text-slate-400 mt-1">Tất cả các ca đo đều tuân thủ kiểm soát chất lượng ISO 15189.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Thời Gian</th>
                  <th className="p-3">Máy & Xét Nghiệm</th>
                  <th className="p-3">Giá Trị Đo & SDI</th>
                  <th className="p-3">Quy Tắc Westgard</th>
                  <th className="p-3">Nguyên Nhân & Khắc Phục (CAPA)</th>
                  <th className="p-3">Tình Trạng</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidentResults.map((item) => {
                  const assay = assays.find((a) => a.id === item.assayId);
                  const isRejected = item.status === 'REJECTED';
                  const isPending = !item.capa || item.capa.status === 'PENDING_APPROVAL';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                        <span className="block text-[11px] text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{assay?.name || item.assayId}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.instrumentId} · {item.level.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900">{item.value} {assay?.unit}</span>
                        <span className={`block text-[11px] font-semibold ${Math.abs(item.zScore) > 2 ? 'text-rose-600' : 'text-slate-500'}`}>
                          SDI: {item.zScore > 0 ? `+${item.zScore}` : item.zScore} SD
                        </span>
                      </td>

                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.violations.map(v => v.ruleName).join(', ') || (isRejected ? '1-3s (Từ chối)' : '1-2s (Cảnh báo)')}
                        </span>
                        {item.violations.length > 0 && (
                          <span className="block text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                            {item.violations[0].errorType === 'RANDOM' ? 'Lỗi ngẫu nhiên' : 'Lỗi hệ thống'}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-slate-600 max-w-xs">
                        {item.capa ? (
                          <div className="space-y-0.5">
                            <p className="text-[11px] line-clamp-1"><strong className="text-slate-700">Nguyên nhân:</strong> {item.capa.rootCause}</p>
                            <p className="text-[11px] line-clamp-1"><strong className="text-slate-700">Khắc phục:</strong> {item.capa.actionTaken}</p>
                            {item.capa.rerunValue && (
                              <p className="text-[10px] text-emerald-700 font-mono">
                                ✓ Chạy lại đạt: {item.capa.rerunValue} {assay?.unit}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-700 font-medium text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Chưa lập biên bản xử lý CAPA</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Chờ ký duyệt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Đã hoàn tất</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => onOpenCapaModal(item)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
                        >
                          {item.capa ? 'Sửa / Duyệt CAPA' : 'Lập hồ sơ CAPA'}
                        </button>
                        <button
                          onClick={() => onOpenChart(item.assayId)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors"
                          title="Xem trên biểu đồ L-J"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
