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

  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [department, setDepartment] = useState<string>('Khoa Hóa Sinh');
  const [model, setModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [status, setStatus] = useState<Instrument['status']>('ONLINE');
  const [connectionType, setConnectionType] = useState<Instrument['connectionType']>('TCP_IP');
  const [port, setPort] = useState<string>('192.168.1.100:5000');
  const [protocol, setProtocol] = useState<Instrument['protocol']>('ASTM_E1381_E1394');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (instrumentToEdit) {
      setId(instrumentToEdit.id || '');
      setName(instrumentToEdit.name || '');
      setCode(instrumentToEdit.code || '');
      setManufacturer(instrumentToEdit.manufacturer || '');
      setDepartment(instrumentToEdit.department || 'Khoa Hóa Sinh');
      setModel(instrumentToEdit.model || '');
      setSerialNumber(instrumentToEdit.serialNumber || '');
      setStatus(instrumentToEdit.status || 'ONLINE');
      setConnectionType(instrumentToEdit.connectionType || 'TCP_IP');
      setPort(instrumentToEdit.port || '192.168.1.100:5000');
      setProtocol(instrumentToEdit.protocol || 'ASTM_E1381_E1394');
    } else {
      setId('');
      setName('');
      setCode('');
      setManufacturer('');
      setDepartment('Khoa Hóa Sinh');
      setModel('');
      setSerialNumber('');
      setStatus('ONLINE');
      setConnectionType('TCP_IP');
      setPort('192.168.1.100:5000');
      setProtocol('ASTM_E1381_E1394');
    }
    setErrorMsg('');
  }, [instrumentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!id.trim()) {
      setErrorMsg('Vui lòng nhập Mã định danh thiết bị (ID).');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên thiết bị.');
      return;
    }

    const cleanId = id.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    const instrumentData: Instrument = {
      id: cleanId,
      name: name.trim(),
      code: code.trim() || cleanId,
      manufacturer: manufacturer.trim() || 'Chưa xác định',
      department: department.trim() || 'Khoa Xét Nghiệm',
      model: model.trim() || name.trim(),
      serialNumber: serialNumber.trim() || 'SN-' + Math.floor(Math.random() * 100000),
      status,
      connectionType,
      port: port.trim(),
      protocol,
      baudRate: connectionType === 'RS232_SERIAL' ? 9600 : undefined,
    };

    onSave(instrumentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isEditing ? 'Chỉnh Sửa Thiết Bị Xét Nghiệm' : 'Khai Báo Thiết Bị Mới'}
              </h3>
              <p className="text-xs text-slate-300">
                Quản lý thông số máy phân tích y khoa ISO 15189
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Thiết Bị (ID) (*):
              </label>
              <input
                type="text"
                value={id}
                disabled={isEditing}
                onChange={(e) => setId(e.target.value)}
                placeholder="VD: AU400, SYSMEX800..."
                className={`w-full px-3 py-1.5 text-xs border rounded-md uppercase font-mono ${
                  isEditing ? 'bg-slate-100 text-slate-500 border-slate-300' : 'border-slate-300 focus:ring-1 focus:ring-cyan-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Quản Lý Tài Sản:
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: AU-400-01"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Máy Phân Tích (*):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Máy Sinh Hóa Tự Động Beckman Coulter AU400"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hãng Sản Xuất:
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Beckman Coulter, Roche, Sysmex..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khoa / Bộ Phận:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white"
              >
                <option value="Khoa Hóa Sinh">Khoa Hóa Sinh</option>
                <option value="Khoa Huyết Học">Khoa Huyết Học</option>
                <option value="Khoa Miễn Dịch">Khoa Miễn Dịch</option>
                <option value="Khoa Vi Sinh">Khoa Vi Sinh</option>
                <option value="Phòng Xét Nghiệm Cấp Cứu">Phòng Xét Nghiệm Cấp Cứu</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model:
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="VD: AU400 Chemistry"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Serial (S/N):
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="VD: AU4-2023-8821"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cổng Kết Nối:
              </label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white"
              >
                <option value="TCP_IP">TCP/IP Mạng LAN</option>
                <option value="RS232_SERIAL">Cổng Nối Tiếp RS-232</option>
                <option value="HL7_INTERFACE">HL7 Giao Diện LIS</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Địa Chỉ / Port:
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="COM1 hoặc 192.168.1.x:port"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Trạng Thái:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 bg-white font-semibold"
              >
                <option value="ONLINE">ONLINE (Hoạt động)</option>
                <option value="STANDBY">STANDBY (Chờ)</option>
                <option value="BUSY">BUSY (Đang chạy)</option>
                <option value="ERROR">ERROR (Bảo trì/Lỗi)</option>
              </select>
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
              {isEditing ? 'Lưu Cập Nhật' : 'Lưu Thiết Bị Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
