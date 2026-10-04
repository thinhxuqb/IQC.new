import React, { useState, useEffect } from 'react';
import { Instrument, MeanSdAuditRecord, QCLot, TestAssay, UserProfile } from '../types/qc';
import { X, ShieldAlert, History, Check, AlertCircle, Calculator } from 'lucide-react';

interface EditMeanSdModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: QCLot;
  assay?: TestAssay;
  instrument?: Instrument;
  currentUser: UserProfile;
  onSave: (auditRecord: MeanSdAuditRecord, updatedLot: QCLot) => void;
}

export const EditMeanSdModal: React.FC<EditMeanSdModalProps> = ({
  isOpen,
  onClose,
  lot,
  assay,
  instrument,
  currentUser,
  onSave,
}) => {
  const [newMeanStr, setNewMeanStr] = useState<string>(Number(lot.targetMean).toFixed(2));
  const [newSDStr, setNewSDStr] = useState<string>(Number(lot.targetSD).toFixed(2));
  const [reasonCategory, setReasonCategory] = useState<MeanSdAuditRecord['reasonCategory']>('CUMULATIVE_MEAN_20');
  const [reason, setReason] = useState<string>(
    'Tính toán lại Mean thực tế tích lũy sau 20 ngày chạy QC đầu kỳ'
  );
  const [approvedBy, setApprovedBy] = useState<string>(
    currentUser.role === 'director' ? currentUser.name : 'TS. BS. Nguyễn Văn Hùng'
  );
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (lot) {
      setNewMeanStr(Number(lot.targetMean).toFixed(2));
      setNewSDStr(Number(lot.targetSD).toFixed(2));
      setReasonCategory('CUMULATIVE_MEAN_20');
      setReason('Tính toán lại Mean thực tế tích lũy sau 20 ngày chạy QC đầu kỳ');
      setApprovedBy(currentUser.role === 'director' ? currentUser.name : 'TS. BS. Nguyễn Văn Hùng');
      setNotes('');
      setErrorMsg('');
    }
  }, [lot, isOpen, currentUser]);

  if (!isOpen) return null;

  const newMean = parseFloat(newMeanStr) || 0;
  const newSD = parseFloat(newSDStr) || 0;

  // Tính CV% mới = (SD / Mean) * 100
  const calculatedNewCV = newMean > 0 && newSD > 0 ? (newSD / newMean) * 100 : 0;
  const oldCV = lot.targetCV || (lot.targetMean > 0 ? (lot.targetSD / lot.targetMean) * 100 : 0);

  // Tính độ chênh lệch Mean (%)
  const meanDiffPercent = lot.targetMean > 0 
    ? ((newMean - lot.targetMean) / lot.targetMean) * 100 
    : 0;

  const handleReasonCategoryChange = (cat: MeanSdAuditRecord['reasonCategory']) => {
    setReasonCategory(cat);
    switch (cat) {
      case 'CUMULATIVE_MEAN_20':
        setReason('Tính toán lại Mean thực tế tích lũy sau 20 ngày chạy QC đầu kỳ');
        break;
      case 'NEW_REAGENT_LOT':
        setReason('Chuyển đổi sang Lô hóa chất xét nghiệm mới (New Reagent Lot) của nhà sản xuất');
        break;
      case 'MAINTENANCE_CALIBRATION':
        setReason('Hiệu chuẩn lại máy sau bảo dưỡng định kỳ / Thay bóng đèn quang học / Thay kim hút mẫu');
        break;
      case 'MANUFACTURER_RECOMMENDATION':
        setReason('Cập nhật theo thông báo thay đổi giá trị ấn định (Assigned Value) từ nhà sản xuất');
        break;
      case 'OTHER':
        setReason('');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedMean = parseFloat(newMeanStr);
    const parsedSD = parseFloat(newSDStr);

    if (isNaN(parsedMean) || parsedMean <= 0) {
      setErrorMsg('Vui lòng nhập giá trị Mean hợp lệ (> 0, cho phép 2 số thập phân).');
      return;
    }
    if (isNaN(parsedSD) || parsedSD <= 0) {
      setErrorMsg('Vui lòng nhập giá trị SD hợp lệ (> 0, cho phép 2 số thập phân).');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Bạn bắt buộc phải ghi rõ lý do hiệu chỉnh Mean & SD.');
      return;
    }

    const finalMean = Number(parsedMean.toFixed(2));
    const finalSD = Number(parsedSD.toFixed(2));
    const finalCV = Number(((finalSD / finalMean) * 100).toFixed(2));

    const auditRecord: MeanSdAuditRecord = {
      id: `msd_audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      lotId: lot.id,
      assayId: lot.assayId,
      assayName: assay?.name || lot.assayId,
      instrumentId: lot.instrumentId,
      lotNumber: lot.lotNumber,
      level: lot.level,
      levelName: lot.levelName,
      timestamp: new Date().toISOString(),
      changedBy: currentUser.name,
      changedByRole: currentUser.roleTitle,
      oldMean: Number(lot.targetMean.toFixed(2)),
      newMean: finalMean,
      oldSD: Number(lot.targetSD.toFixed(2)),
      newSD: finalSD,
      oldCV: Number(oldCV.toFixed(2)),
      newCV: finalCV,
      reason: reason.trim(),
      reasonCategory,
      approvedBy: approvedBy.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const updatedLot: QCLot = {
      ...lot,
      targetMean: finalMean,
      targetSD: finalSD,
      targetCV: finalCV,
      history: [auditRecord, ...(lot.history || [])],
    };

    onSave(auditRecord, updatedLot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Hiệu Chỉnh Mean & SD (Hỗ Trợ 2 Số Thập Phân)
              </h3>
              <p className="text-xs text-slate-300">
                Ghi nhận nhật ký kiểm toán khi thay đổi thông số kiểm chuẩn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thông tin vật liệu QC hiện tại */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <span className="text-slate-600 block text-[11px]">Xét nghiệm:</span>
              <strong className="text-slate-900 text-xs font-semibold">{assay?.name || lot.assayId}</strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[11px]">Thiết bị:</span>
              <strong className="text-slate-900 text-xs font-semibold">{instrument?.name || lot.instrumentId}</strong>
            </div>
            <div>
              <span className="text-slate-600 block text-[11px]">Số Lô (Lot #):</span>
              <span className="font-mono font-bold text-cyan-700">{lot.lotNumber}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[11px]">Mức nồng độ:</span>
              <span className="font-semibold text-slate-800">{lot.levelName}</span>
            </div>
          </div>

          {/* Bảng so sánh Giá trị cũ vs Giá trị mới */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>BẢNG ĐIỀU CHỈNH GIÁ TRỊ KIỂM CHUẨN (2 SỐ THẬP PHÂN)</span>
              <span className="text-[11px] font-normal text-slate-600">Đơn vị: {assay?.unit || 'mg/dL'}</span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cột giá trị hiện tại (Cũ) */}
              <div className="bg-slate-50/80 p-3 rounded-md border border-slate-200/70 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Giá Trị Đang Áp Dụng (Hiện tại)
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Mean cũ:</span>
                  <span className="font-mono font-bold text-slate-800">{Number(lot.targetMean).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">SD cũ (1s):</span>
                  <span className="font-mono font-bold text-slate-800">±{Number(lot.targetSD).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Hệ số biến thiên CV%:</span>
                  <span className="font-mono font-semibold text-slate-700">{oldCV.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-600">Dải kiểm soát ±2s:</span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {(lot.targetMean - 2 * lot.targetSD).toFixed(2)} - {(lot.targetMean + 2 * lot.targetSD).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Cột giá trị mới */}
              <div className="bg-cyan-50/50 p-3 rounded-md border border-cyan-200 space-y-2.5">
                <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider block flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-cyan-600" />
                  Giá Trị Mới Sau Hiệu Chỉnh
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Giá trị Mean mới (Cho phép 2 số thập phân) (*):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMeanStr}
                    onChange={(e) => setNewMeanStr(e.target.value)}
                    placeholder="VD: 5.35"
                    required
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-cyan-300 rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Độ lệch chuẩn SD mới (Cho phép 2 số thập phân) (*):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSDStr}
                    onChange={(e) => setNewSDStr(e.target.value)}
                    placeholder="VD: 0.16"
                    required
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-cyan-300 rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none bg-white text-slate-900"
                  />
                </div>

                <div className="pt-2 border-t border-cyan-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Hệ số CV% mới:</span>
                  <span className="font-mono font-bold text-cyan-800">
                    {calculatedNewCV.toFixed(2)}%
                  </span>
                </div>

                {meanDiffPercent !== 0 && (
                  <div className="text-[11px] text-slate-600 flex justify-between">
                    <span>Độ dịch chuyển Mean:</span>
                    <span className={`font-mono font-bold ${meanDiffPercent > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                      {meanDiffPercent > 0 ? `+${meanDiffPercent.toFixed(2)}%` : `${meanDiffPercent.toFixed(2)}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phần Lưu Vết Bắt Buộc */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-cyan-700" />
              <span>THÔNG TIN LƯU VẾT HỒ SƠ CHẤT LƯỢNG (BẮT BUỘC)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do hiệu chỉnh (*):
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => handleReasonCategoryChange(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none bg-white text-slate-900"
              >
                <option value="CUMULATIVE_MEAN_20">
                  1. Tính lại Mean thực tế sau 20-30 điểm QC đầu kỳ
                </option>
                <option value="NEW_REAGENT_LOT">
                  2. Chuyển đổi Lô hóa chất xét nghiệm mới (New Reagent Lot)
                </option>
                <option value="MAINTENANCE_CALIBRATION">
                  3. Sau bảo dưỡng máy / Hiệu chuẩn lại thiết bị (Calibration)
                </option>
                <option value="MANUFACTURER_RECOMMENDATION">
                  4. Cập nhật theo khuyến cáo từ hãng sản xuất / Thư thông báo Lot QC
                </option>
                <option value="OTHER">
                  5. Lý do khác (Bắt buộc ghi rõ lý do cụ thể)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diễn giải chi tiết lý do hiệu chỉnh (*):
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Ghi rõ cơ sở tính toán hoặc biên bản bảo dưỡng, số lô hóa chất mới..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Người thực hiện hiệu chỉnh:
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${currentUser.name} (${currentUser.roleTitle})`}
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-md text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Người phê duyệt (Trưởng khoa / QLCL):
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="TS. BS. Nguyễn Văn Hùng"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ghi chú kỹ thuật bổ sung (nếu có):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Đã kiểm tra lại 5 mẫu bệnh phẩm trước khi áp dụng"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-md transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Lưu Hiệu Chỉnh & Tạo Lưu Vết
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
