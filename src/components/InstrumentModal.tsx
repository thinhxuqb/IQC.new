import React, { useState, useEffect } from 'react';
import { Instrument } from '../types/qc';
import { X, Server, Check, AlertCircle } from 'lucide-react';

interface InstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentToEdit?: Instrument | null;
  onSave: (instrument: Instrument) => void;
}

export const InstrumentModal: React.FC<InstrumentModalProps> = ({
  isOpen,
  onClose,
  instrumentToEdit,
  onSave,
}) => {
  const isEditing = Boolean(instrumentToEdit);

  const [name, setName] = useState<string>('');
  const [connectionType, setConnectionType] = useState<Instrument['connectionType']>('TCP_IP');
  const [port, setPort] = useState<string>('192.168.1.100:5000');
  const [status, setStatus] = useState<Instrument['status']>('ONLINE');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (instrumentToEdit) {
      setName(instrumentToEdit.name || '');
      setConnectionType(instrumentToEdit.connectionType || 'TCP_IP');
      setPort(instrumentToEdit.port || '192.168.1.100:5000');
      setStatus(instrumentToEdit.status || 'ONLINE');
    } else {
      setName('');
      setConnectionType('TCP_IP');
      setPort('192.168.1.100:5000');
      setStatus('ONLINE');
    }
    setErrorMsg('');
  }, [instrumentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên máy phân tích.');
      return;
    }

    // Tự sinh ID nếu tạo mới, hoặc giữ ID hiện tại
    const generatedId = isEditing && instrumentToEdit
      ? instrumentToEdit.id
      : 'INST_' + name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15) + '_' + Date.now().toString().slice(-4);

    const instrumentData: Instrument = {
      id: generatedId,
      name: name.trim(),
      code: isEditing && instrumentToEdit ? instrumentToEdit.code : name.trim().split(' ').pop()?.toUpperCase() || 'INST',
      manufacturer: instrumentToEdit?.manufacturer || 'Tiêu chuẩn phòng xét nghiệm',
      department: instrumentToEdit?.department || 'Khoa Xét Nghiệm',
      model: instrumentToEdit?.model || name.trim(),
      serialNumber: instrumentToEdit?.serialNumber || 'SN-' + Date.now().toString().slice(-6),
      status,
      connectionType,
      port: port.trim(),
      protocol: instrumentToEdit?.protocol || 'ASTM_E1381_E1394',
      baudRate: connectionType === 'RS232_SERIAL' ? 9600 : undefined,
    };

    onSave(instrumentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold tracking-wide">
              {isEditing ? 'Chỉnh Sửa Thiết Bị' : 'Khai Báo Thiết Bị Mới'}
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
              Tên Máy (*):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: AU400, Sysmex 800, Cobas e411..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cổng Kết Nối:
            </label>
            <select
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white font-medium"
            >
              <option value="TCP_IP">TCP/IP Mạng LAN</option>
              <option value="RS232_SERIAL">Cổng Nối Tiếp RS-232 (Serial COM)</option>
              <option value="HL7_INTERFACE">HL7 Giao Diện LIS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa Chỉ Port:
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="COM1 hoặc 192.168.1.100:5000"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trạng Thái:
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white font-semibold"
            >
              <option value="ONLINE">ONLINE (Hoạt động)</option>
              <option value="STANDBY">STANDBY (Chờ)</option>
              <option value="BUSY">BUSY (Đang chạy)</option>
              <option value="ERROR">ERROR (Bảo trì/Lỗi)</option>
            </select>
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
              <span>{isEditing ? 'Lưu Cập Nhật' : 'Lưu Thiết Bị'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
