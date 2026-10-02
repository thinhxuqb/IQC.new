import React, { useState } from 'react';
import { Instrument, QCLevel, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { calculateZScore, evaluateWestgard } from '../utils/westgard';
import { PlusCircle, X, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  currentUser: UserProfile;
  historicalResults: QCResult[];
  onAddResult: (result: QCResult) => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  isOpen,
  onClose,
  instruments,
  assays,
  lots,
  currentUser,
  historicalResults,
  onAddResult,
}) => {
  if (!isOpen) return null;

  const [selectedInstId, setSelectedInstId] = useState<string>('AU400');
  const [selectedAssayId, setSelectedAssayId] = useState<string>('AU_GLU');
  const [selectedLevel, setSelectedLevel] = useState<QCLevel>('level1');
  const [shift, setShift] = useState<'SÁNG' | 'CHIỀU' | 'ĐÊM'>('SÁNG');
  const [valueInput, setValueInput] = useState<string>('');
  const [timestampInput, setTimestampInput] = useState<string>(
    new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  );

  const availableAssays = assays.filter((a) => a.instrumentId === selectedInstId);
  const currentAssay = assays.find((a) => a.id === selectedAssayId) || availableAssays[0];
  const currentLot = lots.find((l) => l.assayId === currentAssay?.id && l.level === selectedLevel && l.active) || lots[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valueInput);
    if (isNaN(val) || !currentAssay || !currentLot) return;

    const z = calculateZScore(val, currentLot.targetMean, currentLot.targetSD);
    const histForLot = historicalResults
      .filter((r) => r.lotId === currentLot.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const evalResult = evaluateWestgard(val, z, currentLot, histForLot);

    const newResult: QCResult = {
      id: `qc_man_${Date.now()}`,
      assayId: currentAssay.id,
      lotId: currentLot.id,
      instrumentId: currentLot.instrumentId,
      level: selectedLevel,
      timestamp: new Date(timestampInput).toISOString(),
      shift,
      value: val,
      zScore: z,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      source: 'NHẬP_TAY',
      status: evalResult.status,
      violations: evalResult.violations,
      syncStatus: 'SYNCED',
    };

    onAddResult(newResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">
              Nhập Kết Quả Nội Kiểm Thủ Công
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Máy phân tích:</label>
              <select
                value={selectedInstId}
                onChange={(e) => {
                  setSelectedInstId(e.target.value);
                  const newAssays = assays.filter((a) => a.instrumentId === e.target.value);
                  if (newAssays.length > 0) setSelectedAssayId(newAssays[0].id);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>{i.code} - {i.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Xét nghiệm:</label>
              <select
                value={selectedAssayId}
                onChange={(e) => setSelectedAssayId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                {availableAssays.map((a) => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.unit})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức nồng độ (Level):</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as QCLevel)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="level1">Mức 1 (Bình thường)</option>
                <option value="level2">Mức 2 (Bệnh lý cao)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ca trực:</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="SÁNG">Ca Sáng (07h00 - 15h00)</option>
                <option value="CHIỀU">Ca Chiều (15h00 - 22h00)</option>
                <option value="ĐÊM">Ca Đêm (22h00 - 07h00)</option>
              </select>
            </div>
          </div>

          {currentLot && (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600 flex justify-between">
              <span>Lô: <strong>{currentLot.lotNumber}</strong></span>
              <span>Target Mean: <strong>{currentLot.targetMean}</strong></span>
              <span>Target SD: <strong>±{currentLot.targetSD}</strong></span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Kết Quả Đo ({currentAssay?.unit}):
            </label>
            <input
              type="number"
              step="any"
              required
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder={`vd: ${currentLot?.targetMean || '5.35'}`}
              className="w-full text-base font-bold font-mono p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-cyan-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thời gian chạy:</label>
              <input
                type="datetime-local"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người thực hiện:</label>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700 font-medium">
                {currentUser.name}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
            >
              Lưu Kết Quả
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
