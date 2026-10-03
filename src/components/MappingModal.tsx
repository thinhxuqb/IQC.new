import React, { useState, useEffect } from 'react';
import { Instrument, QCMaterial, QCMapping, QCLevelSetting, TestAssay } from '../types/qc';
import { X, Network, Save, AlertCircle, Sparkles, Layers, Sliders } from 'lucide-react';

interface MappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: QCMapping) => void;
  mapping: QCMapping | null;
  instruments: Instrument[];
  assays: TestAssay[];
  materials: QCMaterial[];
}

export const MappingModal: React.FC<MappingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mapping,
  instruments,
  assays,
  materials,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [selectedAssayId, setSelectedAssayId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [levelConfigs, setLevelConfigs] = useState<QCLevelSetting[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lọc xét nghiệm theo máy đã chọn
  const availableAssays = assays.filter(a => !selectedInstId || a.instrumentId === selectedInstId);

  // Lấy thông tin vật liệu đang chọn
  const currentMaterial = materials.find(m => m.id === selectedMaterialId);

  useEffect(() => {
    if (mapping) {
      setSelectedInstId(mapping.instrumentId);
      setSelectedAssayId(mapping.assayId);
      setSelectedMaterialId(mapping.materialId);
      setLevelConfigs(mapping.levelConfigs);
      setNotes(mapping.notes || '');
      setActive(mapping.active ?? true);
    } else {
      const defaultInst = instruments[0]?.id || '';
      setSelectedInstId(defaultInst);
      const firstAssay = assays.find(a => a.instrumentId === defaultInst) || assays[0];
      setSelectedAssayId(firstAssay?.id || '');
      const firstMat = materials[0];
      setSelectedMaterialId(firstMat?.id || '');
      setNotes('');
      setActive(true);

      // Tự động khởi tạo cấu hình các mức theo vật liệu đầu tiên
      if (firstMat) {
        const configs: QCLevelSetting[] = firstMat.levels.map(lvl => ({
          level: lvl.level,
          levelName: lvl.levelName,
          targetMean: 0,
          targetSD: 0,
          targetCV: 0,
          active: true,
          lotId: `LOT_${firstAssay?.id || 'TEST'}_${lvl.level}`,
        }));
        setLevelConfigs(configs);
      }
    }
    setError(null);
  }, [mapping, isOpen]);

  // Khi người dùng đổi vật liệu QC đã chọn trong form tạo mới
  const handleMaterialChange = (newMatId: string) => {
    setSelectedMaterialId(newMatId);
    const mat = materials.find(m => m.id === newMatId);
    if (!mat) return;

    // Giữ lại các giá trị Mean/SD cũ nếu trùng level, hoặc tạo mới
    const configs: QCLevelSetting[] = mat.levels.map(lvl => {
      const existing = levelConfigs.find(c => c.level === lvl.level);
      return {
        level: lvl.level,
        levelName: lvl.levelName,
        targetMean: existing ? existing.targetMean : 0,
        targetSD: existing ? existing.targetSD : 0,
        targetCV: existing ? existing.targetCV : 0,
        active: existing ? existing.active : true,
        lotId: existing ? existing.lotId : `LOT_${selectedAssayId}_${lvl.level}`,
      };
    });
    setLevelConfigs(configs);
  };

  const handleLevelValueChange = (index: number, field: 'targetMean' | 'targetSD', val: number) => {
    const updated = [...levelConfigs];
    const item = { ...updated[index], [field]: val };
    
    // Tự động tính CV% = (SD / Mean) * 100
    if (field === 'targetMean') {
      item.targetMean = val;
      item.targetCV = val > 0 && item.targetSD > 0 ? Number(((item.targetSD / val) * 100).toFixed(2)) : 0;
    } else if (field === 'targetSD') {
      item.targetSD = val;
      item.targetCV = item.targetMean > 0 && val > 0 ? Number(((val / item.targetMean) * 100).toFixed(2)) : 0;
    }

    updated[index] = item;
    setLevelConfigs(updated);
  };

  const handleToggleLevelActive = (index: number, val: boolean) => {
    const updated = [...levelConfigs];
    updated[index] = { ...updated[index], active: val };
    setLevelConfigs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      setError('Vui lòng chọn Thiết bị phân tích.');
      return;
    }
    if (!selectedAssayId) {
      setError('Vui lòng chọn Xét nghiệm.');
      return;
    }
    if (!selectedMaterialId) {
      setError('Vui lòng chọn Vật liệu QC (Huyết thanh kiểm chuẩn).');
      return;
    }

    const hasInvalid = levelConfigs.some(c => c.active && (c.targetMean <= 0 || c.targetSD <= 0));
    if (hasInvalid) {
      setError('Mean mục tiêu và SD mục tiêu của các mức đang kích hoạt phải lớn hơn 0.');
      return;
    }

    const savedMapping: QCMapping = {
      id: mapping ? mapping.id : `MAP_${selectedInstId}_${selectedAssayId}_${selectedMaterialId}_${Date.now()}`,
      instrumentId: selectedInstId,
      assayId: selectedAssayId,
      materialId: selectedMaterialId,
      levelConfigs,
      active,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedMapping);
    onClose();
  };

  if (!isOpen) return null;

  const currentAssay = assays.find(a => a.id === selectedAssayId);
  const currentInst = instruments.find(i => i.id === selectedInstId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {mapping ? 'Chỉnh Sửa Map Kiểm Chuẩn' : 'Thiết Lập / Map Kiểm Chuẩn Mới'}
              </h3>
              <p className="text-xs text-slate-300">
                Ghép nối Thiết bị × Xét nghiệm × Vật liệu QC & Cài đặt giá trị từng mức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bước 1 & Bước 2: Chọn Thiết Bị & Xét Nghiệm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bước 1: Chọn Thiết Bị Phân Tích <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedInstId}
                disabled={Boolean(mapping)}
                onChange={e => {
                  const inst = e.target.value;
                  setSelectedInstId(inst);
                  const matchingAssay = assays.find(a => a.instrumentId === inst);
                  if (matchingAssay) setSelectedAssayId(matchingAssay.id);
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium disabled:bg-slate-100"
              >
                {instruments.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    [{inst.id}] {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bước 2: Chọn Xét Nghiệm <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedAssayId}
                disabled={Boolean(mapping)}
                onChange={e => setSelectedAssayId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium disabled:bg-slate-100"
              >
                {availableAssays.map(assay => (
                  <option key={assay.id} value={assay.id}>
                    {assay.code} - {assay.name} ({assay.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bước 3: Chọn Vật Liệu QC */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-indigo-950 uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-700" />
                <span>Bước 3: Chọn Vật Liệu QC (Huyết Thanh Kiểm Chuẩn) *</span>
              </span>
              <span className="text-[11px] text-indigo-700 normal-case font-normal">
                1 vật liệu có thể gán cho nhiều xét nghiệm
              </span>
            </label>
            <select
              value={selectedMaterialId}
              disabled={Boolean(mapping)}
              onChange={e => handleMaterialChange(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold text-slate-800 disabled:bg-slate-100"
            >
              {materials.map(mat => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} — Lô: {mat.lotNumber} ({mat.manufacturer} · Hạn: {mat.expDate})
                </option>
              ))}
            </select>
            {currentMaterial && (
              <div className="text-[11px] text-indigo-900 bg-white/90 p-2 rounded-lg border border-indigo-100 flex items-center justify-between">
                <span>Hãng: <strong>{currentMaterial.manufacturer}</strong> | Số Lô: <strong>{currentMaterial.lotNumber}</strong> | Hạn: <strong>{currentMaterial.expDate}</strong></span>
                <span className="text-indigo-700 font-medium">Gồm {currentMaterial.levels?.length || 0} mức nồng độ</span>
              </div>
            )}
          </div>

          {/* Bước 4: Cài Đặt Giá Trị Từng Mức (Target Mean & Target SD) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Bước 4: Cài Đặt Giá Trị Cho Từng Mức ({currentAssay?.unit || ''})</span>
              </label>
              <span className="text-[11px] text-slate-500">
                CV% = (SD / Mean) × 100% tự động tính toán
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {levelConfigs.map((lvl, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition-all ${
                    lvl.active
                      ? 'bg-slate-50 border-slate-300 shadow-2xs'
                      : 'bg-slate-100/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                        {lvl.level}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {lvl.levelName}
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lvl.active}
                        onChange={e => handleToggleLevelActive(index, e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <span>Áp dụng</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Mean Mục Tiêu (X̄)
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={!lvl.active}
                        value={lvl.targetMean || ''}
                        onChange={e => handleLevelValueChange(index, 'targetMean', parseFloat(e.target.value) || 0)}
                        placeholder="VD: 5.35"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Độ Lệch Chuẩn (SD)
                      </label>
                      <input
                        type="number"
                        step="any"
                        disabled={!lvl.active}
                        value={lvl.targetSD || ''}
                        onChange={e => handleLevelValueChange(index, 'targetSD', parseFloat(e.target.value) || 0)}
                        placeholder="VD: 0.16"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Hệ Số CV% (Tự tính)
                      </label>
                      <div className="w-full text-xs px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-indigo-900">
                        {lvl.targetCV ? `${lvl.targetCV}%` : '0.00%'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ghi Chú Map / Nguồn Thẩm Định (ISO 15189)
            </label>
            <textarea
              rows={2}
              placeholder="VD: Giá trị Mean/SD được thẩm định theo kết quả 20 ngày tích lũy đầu kỳ hoặc theo insert của hãng Bio-Rad..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="map_active"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300"
            />
            <label htmlFor="map_active" className="text-xs font-medium text-slate-700 cursor-pointer">
              Kích hoạt áp dụng cặp kiểm chuẩn này cho việc chạy QC hàng ngày
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{mapping ? 'Lưu Cập Nhật Mapping' : 'Hoàn Tất Ghép Nối (Map QC)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
