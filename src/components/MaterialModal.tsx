import React, { useState, useEffect } from 'react';
import { QCMaterial, QCLevel, QCMaterialLevel } from '../types/qc';
import { X, Layers, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: QCMaterial) => void;
  material: QCMaterial | null;
}

const COMMON_MANUFACTURERS = [
  'Bio-Rad Laboratories Inc. (USA)',
  'Roche Diagnostics (Switzerland)',
  'Sysmex Corporation (Japan)',
  'Randox Laboratories (UK)',
  'Siemens Healthineers (Germany)',
  'Beckman Coulter Inc. (USA)',
  'Abbott Diagnostics (USA)',
  'Techno-path Clinical Diagnostics',
  'SERO AS (Norway)',
];

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  material,
}) => {
  const [formData, setFormData] = useState<Partial<QCMaterial>>({
    name: '',
    code: '',
    manufacturer: COMMON_MANUFACTURERS[0],
    lotNumber: '',
    expDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    matrix: 'SERUM',
    storageCondition: '2 - 8°C (Tránh ánh sáng trực tiếp)',
    active: true,
    notes: '',
    levels: [
      { level: 'level1', levelName: 'Mức 1 (Bình thường)', lotSubNumber: '' },
      { level: 'level2', levelName: 'Mức 2 (Bệnh lý cao)', lotSubNumber: '' },
    ],
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (material) {
      setFormData({
        ...material,
        levels: material.levels && material.levels.length > 0 ? material.levels : [
          { level: 'level1', levelName: 'Mức 1 (Bình thường)', lotSubNumber: '' },
          { level: 'level2', levelName: 'Mức 2 (Bệnh lý cao)', lotSubNumber: '' },
        ],
      });
    } else {
      setFormData({
        name: '',
        code: `QC-MAT-${Date.now().toString().slice(-4)}`,
        manufacturer: COMMON_MANUFACTURERS[0],
        lotNumber: '',
        expDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        matrix: 'SERUM',
        storageCondition: '2 - 8°C (Tránh ánh sáng trực tiếp)',
        active: true,
        notes: '',
        levels: [
          { level: 'level1', levelName: 'Mức 1 (Bình thường)', lotSubNumber: '' },
          { level: 'level2', levelName: 'Mức 2 (Bệnh lý cao)', lotSubNumber: '' },
        ],
      });
    }
    setError(null);
  }, [material, isOpen]);

  if (!isOpen) return null;

  const handleLevelChange = (index: number, field: keyof QCMaterialLevel, val: string) => {
    const updated = [...(formData.levels || [])];
    updated[index] = { ...updated[index], [field]: val };
    setFormData(prev => ({ ...prev, levels: updated }));
  };

  const handleAddLevel = () => {
    const current = formData.levels || [];
    if (current.length >= 3) return;
    const nextLevel: QCLevel = current.length === 2 ? 'level3' : (current.length === 1 ? 'level2' : 'level1');
    const nextName = nextLevel === 'level3' ? 'Mức 3 (Bệnh lý rất cao)' : (nextLevel === 'level2' ? 'Mức 2 (Bệnh lý)' : 'Mức 1 (Bình thường)');
    setFormData(prev => ({
      ...prev,
      levels: [...current, { level: nextLevel, levelName: nextName, lotSubNumber: '' }],
    }));
  };

  const handleRemoveLevel = (index: number) => {
    const current = formData.levels || [];
    if (current.length <= 1) {
      setError('Vật liệu QC phải có ít nhất 1 mức nồng độ!');
      return;
    }
    setFormData(prev => ({
      ...prev,
      levels: current.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Vui lòng nhập tên Vật liệu QC / Huyết thanh kiểm tra.');
      return;
    }
    if (!formData.lotNumber?.trim()) {
      setError('Vui lòng nhập Số Lô (Lot Number) của nhà sản xuất.');
      return;
    }
    if (!formData.expDate) {
      setError('Vui lòng nhập hạn dùng của Lô vật liệu QC.');
      return;
    }
    if (!formData.levels || formData.levels.length === 0) {
      setError('Vui lòng cấu hình ít nhất 1 mức nồng độ cho vật liệu QC này.');
      return;
    }

    const newMaterial: QCMaterial = {
      id: material ? material.id : `MAT_${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code?.trim() || `QC-MAT-${Date.now().toString().slice(-4)}`,
      manufacturer: formData.manufacturer || COMMON_MANUFACTURERS[0],
      lotNumber: formData.lotNumber.trim().toUpperCase(),
      expDate: formData.expDate,
      matrix: formData.matrix || 'SERUM',
      storageCondition: formData.storageCondition?.trim() || '2 - 8°C',
      levels: formData.levels,
      active: formData.active ?? true,
      notes: formData.notes?.trim() || '',
    };

    onSave(newMaterial);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {material ? 'Chỉnh Sửa Vật Liệu QC' : 'Khai Báo Vật Liệu QC Mới'}
              </h3>
              <p className="text-xs text-slate-300">
                1 Vật liệu QC (Huyết thanh kiểm tra) có thể dùng cho nhiều xét nghiệm
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tên Vật Liệu QC <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Lyphochek Assayed Chemistry Control"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mã Vật Liệu
              </label>
              <input
                type="text"
                placeholder="VD: QC-CHEM-BIO"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Hãng Sản Xuất <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="mfg-list"
                required
                placeholder="Chọn hoặc nhập tên hãng"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <datalist id="mfg-list">
                {COMMON_MANUFACTURERS.map((m, idx) => (
                  <option key={idx} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Số Lô (Lot Number) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: BIO-2401 hoặc 45120"
                value={formData.lotNumber}
                onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Hạn Dùng (Exp Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expDate}
                onChange={e => setFormData({ ...formData, expDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nền Mẫu (Matrix)
              </label>
              <select
                value={formData.matrix}
                onChange={e => setFormData({ ...formData, matrix: e.target.value as any })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
              >
                <option value="SERUM">Huyết thanh (Serum)</option>
                <option value="PLASMA">Huyết tương (Plasma)</option>
                <option value="WHOLE_BLOOD">Máu toàn phần (Whole Blood)</option>
                <option value="URINE">Nước tiểu (Urine)</option>
                <option value="CSF">Dịch não tủy (CSF)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Điều Kiện Bảo Quản
              </label>
              <input
                type="text"
                placeholder="VD: 2 - 8°C"
                value={formData.storageCondition}
                onChange={e => setFormData({ ...formData, storageCondition: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Cấu hình các Mức nồng độ của Vật liệu QC */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Các Mức Nồng Độ Có Sẵn ({formData.levels?.length || 0})</span>
              </span>
              {(formData.levels?.length || 0) < 3 && (
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Mức (Level)</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {formData.levels?.map((lvl, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="w-16 text-[11px] font-mono font-bold text-teal-800 bg-teal-100 px-2 py-1 rounded text-center">
                    {lvl.level}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Tên mức (vd: Mức 1 - Bình thường)"
                    value={lvl.levelName}
                    onChange={e => handleLevelChange(index, 'levelName', e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Mã phụ / Lô mức (tùy chọn)"
                    value={lvl.lotSubNumber || ''}
                    onChange={e => handleLevelChange(index, 'lotSubNumber', e.target.value)}
                    className="w-36 text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none font-mono text-[11px]"
                  />
                  {(formData.levels?.length || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLevel(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Xóa mức này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ghi Chú Ứng Dụng (Các xét nghiệm khuyến nghị)
            </label>
            <textarea
              rows={2}
              placeholder="VD: Dùng chung cho Glucose, Urea, Creatinine, AST, ALT trên AU400..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mat_active"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded border-slate-300"
            />
            <label htmlFor="mat_active" className="text-xs font-medium text-slate-700 cursor-pointer">
              Đang hoạt động (Kích hoạt áp dụng trong phòng lab)
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
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{material ? 'Lưu Thay Đổi' : 'Thêm Vật Liệu QC'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
