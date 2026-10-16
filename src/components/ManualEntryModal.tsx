import React, { useState, useMemo, useEffect } from 'react';
import { Instrument, QCLevel, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { calculateZScore, evaluateWestgard } from '../utils/westgard';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Table, 
  Save, 
  Calendar, 
  Clock, 
  Server
} from 'lucide-react';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  currentUser: UserProfile;
  historicalResults: QCResult[];
  onAddResult: (result: QCResult) => void;
  onAddResults?: (results: QCResult[]) => void;
}

interface WorksheetRowValue {
  [level: string]: string; // 'level1' -> '5.35', 'level2' -> '14.85'
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
  onAddResults,
}) => {
  // Chế độ nhập: 'worksheet' (Bảng nhập đồng thời) hoặc 'single' (Nhập đơn lẻ 1 xét nghiệm)
  const [entryMode, setEntryMode] = useState<'worksheet' | 'single'>('worksheet');

  // Bộ lọc máy & thời gian dùng chung
  const [selectedInstId, setSelectedInstId] = useState<string>(() => instruments[0]?.id || 'AU400');
  const [shift, setShift] = useState<'SÁNG' | 'CHIỀU' | 'ĐÊM'>('SÁNG');
  const [timestampInput, setTimestampInput] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Dữ liệu nhập cho chế độ Worksheet: Record<assayId, { level1: string, level2: string, level3: string }>
  const [worksheetValues, setWorksheetValues] = useState<Record<string, WorksheetRowValue>>({});

  // Dữ liệu nhập cho chế độ Đơn Lẻ
  const [singleAssayId, setSingleAssayId] = useState<string>('');
  const [singleLevel, setSingleLevel] = useState<QCLevel>('level1');
  const [singleValue, setSingleValue] = useState<string>('');
  const [singleError, setSingleError] = useState<string>('');
  const [worksheetError, setWorksheetError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Các xét nghiệm thuộc máy đang chọn
  const instrumentAssays = useMemo(() => {
    const filtered = assays.filter(a => a.instrumentId === selectedInstId);
    return filtered.length > 0 ? filtered : assays;
  }, [assays, selectedInstId]);

  // Đồng bộ singleAssayId khi đổi máy
  useEffect(() => {
    if (instrumentAssays.length > 0) {
      if (!singleAssayId || !instrumentAssays.some(a => a.id === singleAssayId)) {
        setSingleAssayId(instrumentAssays[0].id);
      }
    }
  }, [instrumentAssays, singleAssayId]);

  // Reset form mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setWorksheetValues({});
      setSingleValue('');
      setSingleError('');
      setWorksheetError('');
      setSuccessMsg('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setTimestampInput(now.toISOString().slice(0, 16));
      if (instruments.length > 0 && !instruments.some(i => i.id === selectedInstId)) {
        setSelectedInstId(instruments[0].id);
      }
    }
  }, [isOpen, instruments]);

  // Xác định các mức nồng độ có sẵn cho máy đang chọn
  const instrumentLots = useMemo(() => {
    return lots.filter(l => l.instrumentId === selectedInstId);
  }, [lots, selectedInstId]);

  const availableLevels = useMemo(() => {
    const set = new Set<QCLevel>();
    instrumentLots.forEach(l => set.add(l.level));
    if (set.size === 0) {
      return ['level1', 'level2'] as QCLevel[];
    }
    return Array.from(set).sort();
  }, [instrumentLots]);

  if (!isOpen) return null;

  // Thay đổi giá trị 1 ô trong bảng Worksheet
  const handleWorksheetCellChange = (assayId: string, level: string, val: string) => {
    setWorksheetValues(prev => ({
      ...prev,
      [assayId]: {
        ...(prev[assayId] || {}),
        [level]: val,
      },
    }));
  };

  // Đếm số lượng giá trị hợp lệ đã nhập trong bảng Worksheet
  const enteredCount = Object.values(worksheetValues).reduce((count, row) => {
    return count + Object.values(row).filter(v => v !== '' && !isNaN(parseFloat(v))).length;
  }, 0);

  // Helper tính timestamp an toàn
  const getSafeTimestamp = () => {
    try {
      const d = timestampInput ? new Date(timestampInput) : new Date();
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {
      // fallback
    }
    return new Date().toISOString();
  };

  // Helper tìm hoặc sinh lô hợp lệ
  const resolveLotForAssayLevel = (targetAssay: TestAssay, targetLevel: QCLevel): QCLot => {
    let lot = lots.find(l => l.assayId === targetAssay.id && l.level === targetLevel && (l.active !== false));
    if (!lot) {
      lot = lots.find(l => l.assayId === targetAssay.id && l.level === targetLevel);
    }
    if (!lot) {
      // Fallback lot an toàn để không bao giờ bị chặn nhập liệu
      const fallbackMean = 10;
      const fallbackSD = 0.5;
      lot = {
        id: `LOT_${targetAssay.id}_${targetLevel}`,
        assayId: targetAssay.id,
        instrumentId: targetAssay.instrumentId,
        lotNumber: 'QC-STD',
        level: targetLevel,
        levelName: targetLevel === 'level1' ? 'Mức 1' : targetLevel === 'level2' ? 'Mức 2' : 'Mức 3',
        manufacturer: 'Chuẩn Nội Kiểm',
        controlName: 'QC Control',
        expDate: '2028-12-31',
        targetMean: fallbackMean,
        targetSD: fallbackSD,
        targetCV: 5.0,
        active: true,
      };
    }
    return lot;
  };

  // Lưu hàng loạt từ bảng Worksheet
  const handleSaveBatchWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    setWorksheetError('');
    const newResults: QCResult[] = [];
    const dateIso = getSafeTimestamp();

    instrumentAssays.forEach(assay => {
      const rowVals = worksheetValues[assay.id] || {};

      Object.entries(rowVals).forEach(([levelKey, valStr]) => {
        if (!valStr || valStr.trim() === '') return;
        const val = parseFloat(valStr.replace(',', '.'));
        if (isNaN(val)) return;

        const lot = resolveLotForAssayLevel(assay, levelKey as QCLevel);
        const sd = lot.targetSD > 0 ? lot.targetSD : 0.1;
        const z = calculateZScore(val, lot.targetMean, sd);
        const histForLot = historicalResults
          .filter(r => r.lotId === lot.id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const evalResult = evaluateWestgard(val, z, lot, histForLot);

        newResults.push({
          id: `qc_man_${Date.now()}_${assay.id}_${levelKey}_${Math.floor(Math.random() * 1000)}`,
          assayId: assay.id,
          lotId: lot.id,
          instrumentId: lot.instrumentId || assay.instrumentId,
          level: lot.level,
          timestamp: dateIso,
          shift,
          value: Math.round(val * 100) / 100,
          zScore: Math.round(z * 100) / 100,
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          source: 'NHẬP_TAY',
          status: evalResult.status,
          violations: evalResult.violations,
          syncStatus: 'SYNCED',
        });
      });
    });

    if (newResults.length === 0) {
      setWorksheetError('Vui lòng nhập ít nhất một giá trị nồng độ đo được vào bảng!');
      return;
    }

    if (onAddResults) {
      onAddResults(newResults);
    } else {
      newResults.forEach(r => onAddResult(r));
    }

    setSuccessMsg(`Đã lưu thành công ${newResults.length} kết quả nội kiểm.`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Lưu đơn lẻ
  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError('');

    if (!singleValue || singleValue.trim() === '') {
      setSingleError('Vui lòng nhập giá trị nồng độ đo được.');
      return;
    }

    const val = parseFloat(singleValue.replace(',', '.'));
    if (isNaN(val)) {
      setSingleError('Vui lòng nhập số hợp lệ (cho phép 2 số thập phân).');
      return;
    }

    const activeAid = singleAssayId || instrumentAssays[0]?.id || assays[0]?.id;
    const targetAssay = assays.find(a => a.id === activeAid);
    if (!targetAssay) {
      setSingleError('Vui lòng chọn một xét nghiệm.');
      return;
    }

    const lot = resolveLotForAssayLevel(targetAssay, singleLevel);
    const sd = lot.targetSD > 0 ? lot.targetSD : 0.1;
    const z = calculateZScore(val, lot.targetMean, sd);
    const histForLot = historicalResults
      .filter(r => r.lotId === lot.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const evalResult = evaluateWestgard(val, z, lot, histForLot);

    const newRes: QCResult = {
      id: `qc_man_${Date.now()}`,
      assayId: targetAssay.id,
      lotId: lot.id,
      instrumentId: lot.instrumentId || targetAssay.instrumentId,
      level: singleLevel,
      timestamp: getSafeTimestamp(),
      shift,
      value: Math.round(val * 100) / 100,
      zScore: Math.round(z * 100) / 100,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      source: 'NHẬP_TAY',
      status: evalResult.status,
      violations: evalResult.violations,
      syncStatus: 'SYNCED',
    };

    onAddResult(newRes);
    setSuccessMsg(`Đã lưu thành công kết quả ${targetAssay.name} = ${newRes.value}`);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col ${
        entryMode === 'worksheet' ? 'max-w-4xl max-h-[92vh]' : 'max-w-lg'
      }`}>
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Nhập Thủ Công Kết Quả Nội Kiểm (QC Manual Entry)
              </h3>
              <p className="text-xs text-slate-300">
                Hỗ trợ nhập 2 số thập phân, tự động tính Z-score và đối chiếu Westgard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setEntryMode('worksheet')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  entryMode === 'worksheet' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bảng Nhiều Chỉ Số
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  entryMode === 'single' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nhập Đơn Lẻ
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo thành công */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Global Metadata Controls (Máy, Ca, Thời gian) */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Thiết Bị Xét Nghiệm:</span>
            </label>
            <select
              value={selectedInstId}
              onChange={e => setSelectedInstId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  [{inst.id}] {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Ca Làm Việc:</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-white p-0.5 border border-slate-300 rounded-lg">
              {(['SÁNG', 'CHIỀU', 'ĐÊM'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShift(s)}
                  className={`py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                    shift === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Thời Gian Chạy Đo:</span>
            </label>
            <input
              type="datetime-local"
              value={timestampInput}
              onChange={e => setTimestampInput(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODE 1: BẢNG NHẬP NHIỀU XÉT NGHIỆM (WORKSHEET)            */}
        {/* ========================================================= */}
        {entryMode === 'worksheet' && (
          <form onSubmit={handleSaveBatchWorksheet} noValidate className="flex-1 flex flex-col overflow-hidden">
            {worksheetError && (
              <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{worksheetError}</span>
              </div>
            )}

            {/* Scrollable Worksheet Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600 bg-slate-50 sticky top-0 z-10">
                    <th className="py-2.5 px-3">Mã Xét Nghiệm</th>
                    <th className="py-2.5 px-3">Tên Chỉ Số & Đơn Vị</th>
                    <th className="py-2.5 px-3 text-center">Mức 1 (Level 1)</th>
                    <th className="py-2.5 px-3 text-center">Mức 2 (Level 2)</th>
                    {availableLevels.includes('level3') && (
                      <th className="py-2.5 px-3 text-center">Mức 3 (Level 3)</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {instrumentAssays.map(assay => {
                    const l1 = resolveLotForAssayLevel(assay, 'level1');
                    const l2 = resolveLotForAssayLevel(assay, 'level2');
                    const l3 = resolveLotForAssayLevel(assay, 'level3');

                    const v1 = worksheetValues[assay.id]?.['level1'] || '';
                    const v2 = worksheetValues[assay.id]?.['level2'] || '';
                    const v3 = worksheetValues[assay.id]?.['level3'] || '';

                    const num1 = parseFloat(v1);
                    const z1 = l1 && !isNaN(num1) ? calculateZScore(num1, l1.targetMean, l1.targetSD) : null;

                    const num2 = parseFloat(v2);
                    const z2 = l2 && !isNaN(num2) ? calculateZScore(num2, l2.targetMean, l2.targetSD) : null;

                    const num3 = parseFloat(v3);
                    const z3 = l3 && !isNaN(num3) ? calculateZScore(num3, l3.targetMean, l3.targetSD) : null;

                    return (
                      <tr key={assay.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {assay.code}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{assay.name}</div>
                          <span className="text-[10px] text-slate-500 font-medium">Đơn vị: {assay.unit}</span>
                        </td>

                        {/* Mức 1 */}
                        <td className="py-3 px-3">
                          <div className="space-y-1 max-w-[170px] mx-auto">
                            <input
                              type="number"
                              step="0.01"
                              placeholder={Number(l1.targetMean).toFixed(2)}
                              value={v1}
                              onChange={e => handleWorksheetCellChange(assay.id, 'level1', e.target.value)}
                              className={`w-full text-xs font-mono font-bold px-2.5 py-1.5 border rounded-lg outline-none transition-all ${
                                z1 !== null && Math.abs(z1) >= 3
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                                  : z1 !== null && Math.abs(z1) >= 2
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500'
                                  : 'border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500'
                              }`}
                            />
                            <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                              <span>{Number(l1.targetMean).toFixed(2)} ±{Number(l1.targetSD).toFixed(2)}</span>
                              {z1 !== null && (
                                <span className={`font-bold ${
                                  Math.abs(z1) >= 3 ? 'text-rose-600' : Math.abs(z1) >= 2 ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {z1 > 0 ? `+${z1.toFixed(2)}s` : `${z1.toFixed(2)}s`}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mức 2 */}
                        <td className="py-3 px-3">
                          <div className="space-y-1 max-w-[170px] mx-auto">
                            <input
                              type="number"
                              step="0.01"
                              placeholder={Number(l2.targetMean).toFixed(2)}
                              value={v2}
                              onChange={e => handleWorksheetCellChange(assay.id, 'level2', e.target.value)}
                              className={`w-full text-xs font-mono font-bold px-2.5 py-1.5 border rounded-lg outline-none transition-all ${
                                z2 !== null && Math.abs(z2) >= 3
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                                  : z2 !== null && Math.abs(z2) >= 2
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500'
                                  : 'border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500'
                              }`}
                            />
                            <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                              <span>{Number(l2.targetMean).toFixed(2)} ±{Number(l2.targetSD).toFixed(2)}</span>
                              {z2 !== null && (
                                <span className={`font-bold ${
                                  Math.abs(z2) >= 3 ? 'text-rose-600' : Math.abs(z2) >= 2 ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {z2 > 0 ? `+${z2.toFixed(2)}s` : `${z2.toFixed(2)}s`}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mức 3 (nếu có) */}
                        {availableLevels.includes('level3') && (
                          <td className="py-3 px-3">
                            <div className="space-y-1 max-w-[170px] mx-auto">
                              <input
                                type="number"
                                step="0.01"
                                placeholder={Number(l3.targetMean).toFixed(2)}
                                value={v3}
                                onChange={e => handleWorksheetCellChange(assay.id, 'level3', e.target.value)}
                                className={`w-full text-xs font-mono font-bold px-2.5 py-1.5 border rounded-lg outline-none transition-all ${
                                  z3 !== null && Math.abs(z3) >= 3
                                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                                    : z3 !== null && Math.abs(z3) >= 2
                                    ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500'
                                    : 'border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500'
                                }`}
                              />
                              <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                                <span>{Number(l3.targetMean).toFixed(2)} ±{Number(l3.targetSD).toFixed(2)}</span>
                                {z3 !== null && (
                                  <span className={`font-bold ${
                                    Math.abs(z3) >= 3 ? 'text-rose-600' : Math.abs(z3) >= 2 ? 'text-amber-600' : 'text-emerald-600'
                                  }`}>
                                    {z3 > 0 ? `+${z3.toFixed(2)}s` : `${z3.toFixed(2)}s`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setWorksheetValues({})}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Xóa Trắng Bảng
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={enteredCount === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Tất Cả Kết Quả QC ({enteredCount})</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 2: NHẬP ĐƠN LẺ (SINGLE ENTRY)                        */}
        {/* ========================================================= */}
        {entryMode === 'single' && (
          <form onSubmit={handleSaveSingle} noValidate className="p-6 space-y-4">
            {singleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Xét Nghiệm Cần Nhập
              </label>
              <select
                value={singleAssayId || instrumentAssays[0]?.id || ''}
                onChange={e => setSingleAssayId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
              >
                {instrumentAssays.map(assay => (
                  <option key={assay.id} value={assay.id}>
                    [{assay.instrumentId}] {assay.code} - {assay.name} ({assay.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mức Nồng Độ (QC Level)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['level1', 'level2', 'level3'] as QCLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSingleLevel(lvl)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      singleLevel === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl === 'level1' ? 'Mức 1' : lvl === 'level2' ? 'Mức 2' : 'Mức 3'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Giá Trị Nồng Độ Đo Được (Cho phép 2 số thập phân)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="VD: 5.35 hoặc 14.80..."
                value={singleValue}
                onChange={e => setSingleValue(e.target.value)}
                className="w-full text-base font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Kết Quả</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
