import React, { useState, useEffect } from 'react';
import { Instrument, QCLevel, QCLot, TestAssay } from '../types/qc';
import { X, Layers, Check, AlertCircle, Calendar, Hash } from 'lucide-react';

interface LotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotToEdit?: QCLot | null;
  assays: TestAssay[];
  instruments: Instrument[];
  onSave: (lot: QCLot) => void;
}

export const LotModal: React.FC<LotModalProps> = ({
  isOpen,
  onClose,
  lotToEdit,
  assays,
  instruments,
  onSave,
}) => {
  const isEditing = Boolean(lotToEdit);

  const [selectedAssayId, setSelectedAssayId] = useState<string>(
    lotToEdit?.assayId || assays[0]?.id || ''
  );
  const [controlName, setControlName] = useState<string>(
    lotToEdit?.controlName || 'Lyphochek Assayed Chemistry Control'
  );
  const [manufacturer, setManufacturer] = useState<string>(
    lotToEdit?.manufacturer || 'Bio-Rad Laboratories'
  );
  const [lotNumber, setLotNumber] = useState<string>(lotToEdit?.lotNumber || '');
  const [level, setLevel] = useState<QCLevel>(lotToEdit?.level || 'level1');
  const [levelName, setLevelName] = useState<string>(
    lotToEdit?.levelName || 'Level 1 (Bình thường)'
  );
  const [expDate, setExpDate] = useState<string>(
    lotToEdit?.expDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [targetMeanStr, setTargetMeanStr] = useState<string>(
    lotToEdit?.targetMean ? Number(lotToEdit.targetMean).toFixed(2) : ''
  );
  const [targetSDStr, setTargetSDStr] = useState<string>(
    lotToEdit?.targetSD ? Number(lotToEdit.targetSD).toFixed(2) : ''
  );
  const [active, setActive] = useState<boolean>(lotToEdit ? lotToEdit.active : true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedAssay = assays.find((a) => a.id === selectedAssayId) || assays[0];
  const instrument = instruments.find((i) => i.id === selectedAssay?.instrumentId);

  const targetMean = parseFloat(targetMeanStr) || 0;
  const targetSD = parseFloat(targetSDStr) || 0;

  // Cập nhật tên mức nồng độ tự động khi đổi level
  const handleLevelChange = (newLevel: QCLevel) => {
    setLevel(newLevel);
    if (!isEditing || levelName.startsWith('Level')) {
      if (newLevel === 'level1') setLevelName('Level 1 (Bình thường)');
      else if (newLevel === 'level2') setLevelName('Level 2 (Bệnh lý cao)');
      else setLevelName('Level 3 (Bệnh lý rất cao)');
    }
  };

  const calculatedCV = targetMean > 0 && targetSD > 0 ? (targetSD / targetMean) * 100 : 0;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!lotNumber.trim()) {
      setErrorMsg('Vui lòng nhập Số Lô (Lot Number).');
      return;
    }
    if (targetMean <= 0 || isNaN(targetMean)) {
      setErrorMsg('Vui lòng nhập giá trị Mean ấn định (> 0, cho phép 2 số thập phân).');
      return;
    }
    if (targetSD <= 0 || isNaN(targetSD)) {
      setErrorMsg('Vui lòng nhập giá trị SD ấn định (> 0, cho phép 2 số thập phân).');
      return;
    }

    const lotId = isEditing && lotToEdit 
      ? lotToEdit.id 
      : `${selectedAssay.id}_${level.toUpperCase()}_${lotNumber.trim()}`;

    const newLot: QCLot = {
      id: lotId,
      assayId: selectedAssay.id,
      instrumentId: selectedAssay.instrumentId,
      lotNumber: lotNumber.trim(),
      level,
      levelName: levelName.trim(),
      manufacturer: manufacturer.trim() || 'Chưa rõ',
      controlName: controlName.trim() || 'Vật liệu kiểm tra chất lượng',
      expDate,
      targetMean: Number(targetMean.toFixed(2)),
      targetSD: Number(targetSD.toFixed(2)),
      targetCV: Number(calculatedCV.toFixed(2)),
      active,
      history: lotToEdit?.history || [],
    };

    onSave(newLot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isEditing ? 'Chỉnh Sửa Vật Liệu QC / Lô' : 'Khai Báo Vật Liệu QC & Mức Nồng Độ'}
              </h3>
              <p className="text-xs text-slate-300">
                Thiết lập thông số kiểm chuẩn Mean, SD, CV% (Hỗ trợ 2 số thập phân)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xét Nghiệm Áp Dụng (*):
            </label>
            <select
              value={selectedAssayId}
              disabled={isEditing}
              onChange={(e) => setSelectedAssayId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white"
            >
              {assays.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code}) - {a.instrumentId}
                </option>
              ))}
            </select>
            {instrument && (
              <span className="text-[11px] text-slate-600 block mt-1">
                Máy phân tích: <strong>{instrument.name}</strong> ({instrument.department})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Thương Mại Vật Liệu QC:
              </label>
              <input
                type="text"
                value={controlName}
                onChange={(e) => setControlName(e.target.value)}
                placeholder="VD: Lyphochek Assayed Control..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hãng Sản Xuất QC:
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Bio-Rad, Randox, Roche..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Lô (Lot Number) (*):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="VD: 45211, 88201..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                  required
                />
                <Hash className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn Sử Dụng (Exp Date) (*):
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono"
                  required
                />
                <Calendar className="w-3.5 h-3.5 text-slate-600 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mức Nồng Độ (Level) (*):
              </label>
              <select
                value={level}
                disabled={isEditing}
                onChange={(e) => handleLevelChange(e.target.value as QCLevel)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white font-semibold"
              >
                <option value="level1">Mức 1 - Level 1 (Nồng độ thấp / Bình thường)</option>
                <option value="level2">Mức 2 - Level 2 (Nồng độ cao / Bệnh lý)</option>
                <option value="level3">Mức 3 - Level 3 (Nồng độ rất cao / Nghiêm trọng)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Hiển Thị Mức Nồng Độ:
              </label>
              <input
                type="text"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                placeholder="VD: Level 1 (Bình thường)"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Thiết lập Target Mean & SD */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Giá Trị Ấn Định Ban Đầu (Mean, SD, CV%)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Giá Trị Mean (Cho phép 2 số thập phân) (*):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetMeanStr}
                  onChange={(e) => setTargetMeanStr(e.target.value)}
                  placeholder="VD: 5.25"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Độ Lệch Chuẩn SD (Cho phép 2 số thập phân) (*):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetSDStr}
                  onChange={(e) => setTargetSDStr(e.target.value)}
                  placeholder="VD: 0.17"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-600">Hệ số biến thiên CV% tự động:</span>
              <span className="font-mono font-bold text-cyan-800">
                {calculatedCV.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="lot_active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded text-cyan-700 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="lot_active" className="text-xs text-slate-700 font-medium cursor-pointer">
              Kích hoạt Lô QC này đang chạy thực tế trong phòng xét nghiệm
            </label>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Lưu Thông Tin Lô' : 'Khai Báo Lô Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
