import React, { useState } from 'react';
import { CapaRecord, QCResult, TestAssay, UserProfile } from '../types/qc';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ShieldAlert, 
  FileCheck, 
  UserCheck 
} from 'lucide-react';

interface CapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: QCResult | null;
  assay?: TestAssay;
  currentUser: UserProfile;
  onSaveCapa: (resultId: string, capa: CapaRecord) => void;
}

export const CapaModal: React.FC<CapaModalProps> = ({
  isOpen,
  onClose,
  result,
  assay,
  currentUser,
  onSaveCapa,
}) => {
  if (!isOpen || !result) return null;

  const existingCapa = result.capa;

  const [rootCause, setRootCause] = useState<string>(
    existingCapa?.rootCause || 'Bọt khí tại kim hút mẫu vi thể hoặc thuốc thử đang có dấu hiệu suy giảm độ ổn định.'
  );
  const [actionTaken, setActionTaken] = useState<string>(
    existingCapa?.actionTaken || 'Đã xả khí (Purge/Prime) hệ thống kim hút, vệ sinh kim đo bằng cồn 70%, lắc đều và chạy lại mẫu QC từ lọ mới.'
  );
  const [rerunValue, setRerunValue] = useState<string>(
    existingCapa?.rerunValue ? String(existingCapa.rerunValue) : ''
  );
  const [approvalNotes, setApprovalNotes] = useState<string>(
    existingCapa?.approvalNotes || 'Đã thẩm định kết quả chạy lại đạt giới hạn Mean ± 0.5SD. Đủ điều kiện giải phóng kết quả bệnh nhân.'
  );
  const [isApproved, setIsApproved] = useState<boolean>(
    existingCapa?.status === 'RESOLVED' || currentUser.role === 'director' || currentUser.role === 'manager'
  );

  const canApprove = currentUser.role === 'director' || currentUser.role === 'manager';

  const ROOT_CAUSE_PRESETS = [
    'Bọt khí trong kim hút mẫu hoặc đường ống phân phối chất lỏng.',
    'Thuốc thử (Reagent) đã quá hạn mở nắp trên máy hoặc bay hơi.',
    'Chất chuẩn (Calibrator) bị trôi đường chuẩn, cần hiệu chuẩn lại.',
    'Lọ mẫu QC hoàn nguyên sai tỷ lệ thể tích nước cất hoặc bảo quản sai nhiệt độ.',
    'Cuvette phản ứng bị xước hoặc bám bẩn dẫn tới nhiễu tín hiệu quang kế.',
    'Nhiệt độ buồng ủ phản ứng của máy dao động ngoài dải chuẩn 37°C ± 0.2°C.',
  ];

  const ACTION_PRESETS = [
    'Xả khí (Prime/Purge) hệ thống kim hút, lắc đều lọ QC và chạy lại.',
    'Mở lọ QC mới nguyên niêm phong, kiểm tra nhiệt độ rã đông và chạy lại.',
    'Thực hiện hiệu chuẩn lại (Recalibration) xét nghiệm bằng Calibrator chuẩn.',
    'Thay chai pack thuốc thử mới, nạp lại mã vạch và chạy kiểm chứng.',
    'Vệ sinh bảo dưỡng buồng ủ quang học và kim hút mẫu bằng dung dịch chuyên dụng.',
    'Tạm ngưng trả kết quả xét nghiệm bệnh nhân cho đến khi KTV trưởng thẩm định.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const updatedCapa: CapaRecord = {
      rootCause,
      actionTaken,
      reportedBy: existingCapa?.reportedBy || currentUser.name,
      reportedAt: existingCapa?.reportedAt || now,
      resolvedBy: currentUser.name,
      resolvedAt: now,
      rerunValue: rerunValue ? parseFloat(rerunValue) : undefined,
      status: isApproved && canApprove ? 'RESOLVED' : 'PENDING_APPROVAL',
      approvedBy: isApproved && canApprove ? currentUser.name : existingCapa?.approvedBy,
      approvedAt: isApproved && canApprove ? now : existingCapa?.approvedAt,
      approvalNotes: isApproved && canApprove ? approvalNotes : existingCapa?.approvalNotes,
    };

    onSaveCapa(result.id, updatedCapa);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${result.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hồ Sơ Xử Lý Sự Cố QC & Hành Động Khắc Phục (CAPA)
              </h3>
              <p className="text-xs text-slate-500">
                Quy trình chuẩn hóa ISO 15189 - Quản lý sự cố nội kiểm chất lượng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Incident Details Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-900 text-sm">
                {assay?.name} ({assay?.code}) · Máy: <strong className="font-mono">{result.instrumentId}</strong>
              </span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                result.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {result.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block">Thời gian chạy:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(result.timestamp).toLocaleDateString('vi-VN')} {new Date(result.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Giá trị đo:</span>
                <span className="font-bold text-slate-900">{result.value} {assay?.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Độ lệch SDI (Z):</span>
                <span className={`font-bold ${Math.abs(result.zScore) > 2 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {result.zScore > 0 ? `+${result.zScore}` : result.zScore} SD
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Người chạy:</span>
                <span className="text-slate-800">{result.operatorName}</span>
              </div>
            </div>

            {result.violations.length > 0 && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                <span className="font-bold block">
                  Quy tắc Westgard vi phạm: {result.violations.map(v => v.ruleName).join(', ')}
                </span>
                <span className="text-[11px] block mt-0.5">
                  {result.violations[0].description}
                </span>
                <span className="text-[10px] text-rose-700 italic block mt-0.5">
                  Khuyến cáo: {result.violations[0].recommendation}
                </span>
              </div>
            )}
          </div>

          {/* Root Cause Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              1. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis):
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500"
              required
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-1">
              {ROOT_CAUSE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRootCause(p)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors"
                >
                  + {p.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Action Taken Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              2. Hành Động Khắc Phục Ngay & Phòng Ngừa (Corrective & Preventive Action):
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500"
              required
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-1">
              {ACTION_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActionTaken(p)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors"
                >
                  + {p.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Rerun Verification Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                3. Kết Quả Chạy Lại Kiểm Chứng (Rerun Value):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={rerunValue}
                  onChange={(e) => setRerunValue(e.target.value)}
                  placeholder="vd: 5.38"
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-cyan-500"
                />
                <span className="text-xs text-slate-500 font-mono shrink-0">{assay?.unit}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Nhập giá trị sau khi khắc phục để kiểm tra tính hợp lệ
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Người Lập Biên Bản:
              </label>
              <div className="text-xs p-2 bg-slate-100 rounded-lg border border-slate-200 font-medium text-slate-700">
                {currentUser.name} ({currentUser.roleTitle.split('/')[0]})
              </div>
            </div>
          </div>

          {/* Approval Section (Lab Director / QC Manager) */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isApproved}
                  disabled={!canApprove}
                  onChange={(e) => setIsApproved(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Ký Phê Duyệt Hồ Sơ CAPA & Đóng Sự Cố</span>
              </label>

              {!canApprove && (
                <span className="text-[11px] text-amber-600 italic">
                  * Yêu cầu tài khoản Trưởng khoa hoặc Quản lý chất lượng để ký duyệt
                </span>
              )}
            </div>

            {isApproved && canApprove && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Ý kiến thẩm định của Bác sĩ / Quản lý chất lượng:
                </label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Lưu Hồ Sơ CAPA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
