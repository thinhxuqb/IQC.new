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
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('mmol/L');
  const [sampleType, setSampleType] = useState<TestAssay['sampleType']>('SERUM');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  const [cliaTeaPercent, setCliaTeaPercent] = useState<number>(10);
  const [method, setMethod] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (assayToEdit) {
      setInstrumentId(assayToEdit.instrumentId || instruments[0]?.id || 'AU400');
      setCode(assayToEdit.code || '');
      setName(assayToEdit.name || '');
      setUnit(assayToEdit.unit || 'mmol/L');
      setSampleType(assayToEdit.sampleType || 'SERUM');
      setDecimalPlaces(assayToEdit.decimalPlaces ?? 2);
      setCliaTeaPercent(assayToEdit.cliaTeaPercent ?? 10);
      setMethod(assayToEdit.method || '');
    } else {
      setInstrumentId(instruments[0]?.id || 'AU400');
      setCode('');
      setName('');
      setUnit('mmol/L');
      setSampleType('SERUM');
      setDecimalPlaces(2);
      setCliaTeaPercent(10);
      setMethod('');
    }
    setErrorMsg('');
  }, [assayToEdit, isOpen, instruments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập Mã xét nghiệm (Ví dụ: GLU, URE, AST...).');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên đầy đủ của xét nghiệm.');
      return;
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const assayId = isEditing && assayToEdit ? assayToEdit.id : `${instrumentId}_${cleanCode}`;

    const assayData: TestAssay = {
      id: assayId,
      instrumentId: instrumentId,
      code: cleanCode,
      name: name.trim(),
      unit: unit.trim(),
      sampleType,
      decimalPlaces: Math.max(0, Math.min(4, decimalPlaces)),
      cliaTeaPercent: Math.max(0.1, cliaTeaPercent),
      method: method.trim() || 'Phương pháp tự động theo hóa chất chuẩn',
    };

    onSave(assayData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <TestTube className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isEditing ? 'Chỉnh Sửa Thông Tin Xét Nghiệm' : 'Khai Báo Xét Nghiệm Mới'}
              </h3>
              <p className="text-xs text-slate-300">
                Thông số kỹ thuật & Giới hạn sai số TEa% chuẩn ISO 15189
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
              Thiết Bị Thực Hiện (*):
            </label>
            <select
              value={instrumentId}
              disabled={isEditing}
              onChange={(e) => setInstrumentId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white"
            >
              {instruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Xét Nghiệm (Code) (*):
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: GLU, CREA, TSH..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn Vị Đo (Unit) (*):
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="VD: mmol/L, µmol/L, g/L, U/L..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Đầy Đủ Xét Nghiệm (*):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Glucose (Đường máu), Creatinine huyết thanh..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại Mẫu Bệnh Phẩm:
              </label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white"
              >
                <option value="SERUM">Huyết thanh (Serum)</option>
                <option value="PLASMA">Huyết tương (Plasma)</option>
                <option value="WHOLE_BLOOD">Máu toàn phần (Whole Blood)</option>
                <option value="URINE">Nước tiểu (Urine)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Chữ Số Thập Phân:
              </label>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white"
              >
                <option value={0}>0 chữ số (vd: 125)</option>
                <option value={1}>1 chữ số (vd: 12.5)</option>
                <option value={2}>2 chữ số (vd: 5.25)</option>
                <option value={3}>3 chữ số (vd: 0.125)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tổng Sai Số Cho Phép TEa (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="100"
                  value={cliaTeaPercent}
                  onChange={(e) => setCliaTeaPercent(parseFloat(e.target.value) || 10)}
                  placeholder="VD: 10.0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                  required
                />
                <span className="absolute right-3 top-1.5 text-xs text-slate-600">%</span>
              </div>
              <span className="text-[10px] text-slate-600 block mt-0.5">
                Theo CLIA / Ricos / Quyết định 2429
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phương Pháp Xét Nghiệm:
              </label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="VD: Hexokinase, Enzymatic, ECLIA..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>
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
              {isEditing ? 'Lưu Xét Nghiệm' : 'Khai Báo Xét Nghiệm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
