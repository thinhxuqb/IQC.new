import React, { useState, useEffect } from 'react';
import { Instrument, TestAssay } from '../types/qc';
import { X, TestTube, Check, AlertCircle } from 'lucide-react';

interface AssayModalProps {
  isOpen: boolean;
  onClose: () => void;
  assayToEdit?: TestAssay | null;
  instruments: Instrument[];
  onSave: (assay: TestAssay) => void;
}

export const AssayModal: React.FC<AssayModalProps> = ({
  isOpen,
  onClose,
  assayToEdit,
  instruments,
  onSave,
}) => {
  const isEditing = Boolean(assayToEdit);

  const [instrumentId, setInstrumentId] = useState<string>('AU400');
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('mmol/L');
  const [sampleType, setSampleType] = useState<TestAssay['sampleType']>('SERUM');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  const [cliaTeaPercent, setCliaTeaPercent] = useState<number>(10);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (assayToEdit) {
      setInstrumentId(assayToEdit.instrumentId || instruments[0]?.id || 'AU400');
      setName(assayToEdit.name || '');
      setUnit(assayToEdit.unit || 'mmol/L');
      setSampleType(assayToEdit.sampleType || 'SERUM');
      setDecimalPlaces(assayToEdit.decimalPlaces ?? 2);
      setCliaTeaPercent(assayToEdit.cliaTeaPercent ?? 10);
    } else {
      setInstrumentId(instruments[0]?.id || 'AU400');
      setName('');
      setUnit('mmol/L');
      setSampleType('SERUM');
      setDecimalPlaces(2);
      setCliaTeaPercent(10);
    }
    setErrorMsg('');
  }, [assayToEdit, isOpen, instruments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên xét nghiệm.');
      return;
    }

    // Tự sinh mã định danh và code nội bộ từ tên xét nghiệm
    const cleanWord = name.trim().split(/[\s(/]+/).filter(Boolean)[0] || 'TEST';
    const cleanCode = isEditing && assayToEdit ? assayToEdit.code : cleanWord.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const assayId = isEditing && assayToEdit ? assayToEdit.id : `${instrumentId}_${cleanCode}_${Date.now().toString().slice(-4)}`;

    const assayData: TestAssay = {
      id: assayId,
      instrumentId: instrumentId,
      code: cleanCode,
      name: name.trim(),
      unit: unit.trim(),
      sampleType,
      decimalPlaces: Math.max(0, Math.min(4, decimalPlaces)),
      cliaTeaPercent: Math.max(0.1, cliaTeaPercent),
      method: assayToEdit?.method || '',
    };

    onSave(assayData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <TestTube className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold tracking-wide">
              {isEditing ? 'Chỉnh Sửa Xét Nghiệm' : 'Khai Báo Xét Nghiệm Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800 cursor-pointer"
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
              Thiết Bị Thực Hiện (*):
            </label>
            <select
              value={instrumentId}
              disabled={isEditing}
              onChange={(e) => setInstrumentId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
            >
              {instruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Xét Nghiệm (*):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Glucose, Creatinine, AST, ALT, TSH..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn Vị Đo (Unit) (*):
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: mmol/L, µmol/L, U/L..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại Mẫu Bệnh Phẩm:
              </label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
              >
                <option value="SERUM">Huyết thanh (Serum)</option>
                <option value="PLASMA">Huyết tương (Plasma)</option>
                <option value="WHOLE_BLOOD">Máu toàn phần (Whole Blood)</option>
                <option value="URINE">Nước tiểu (Urine)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Chữ Số Thập Phân:
              </label>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
              >
                <option value={0}>0 chữ số (vd: 125)</option>
                <option value={1}>1 chữ số (vd: 12.5)</option>
                <option value={2}>2 chữ số (vd: 5.25)</option>
                <option value={3}>3 chữ số (vd: 0.125)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sai Số Cho Phép TEa (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="100"
                  value={cliaTeaPercent}
                  onChange={(e) => setCliaTeaPercent(parseFloat(e.target.value) || 10)}
                  placeholder="10.0"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold pr-8"
                  required
                />
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Lưu Xét Nghiệm' : 'Khai Báo Xét Nghiệm'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
