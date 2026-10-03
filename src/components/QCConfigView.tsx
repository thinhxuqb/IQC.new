import React, { useState, useMemo } from 'react';
import { 
  Instrument, 
  MeanSdAuditRecord, 
  QCLevel, 
  QCLot, 
  TestAssay, 
  UserProfile 
} from '../types/qc';
import { 
  Plus, 
  Edit3, 
  History, 
  Server, 
  TestTube, 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Trash2, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Download,
  Printer,
  Users,
  UserCheck,
  Shield,
  KeyRound,
  Lock
} from 'lucide-react';
import { EditMeanSdModal } from './EditMeanSdModal';
import { InstrumentModal } from './InstrumentModal';
import { AssayModal } from './AssayModal';
import { LotModal } from './LotModal';
import { UserModal } from './UserModal';

interface QCConfigViewProps {
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  meanSdAuditHistory: MeanSdAuditRecord[];
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateLot: (updatedLot: QCLot, auditRecord?: MeanSdAuditRecord) => void;
  onDeleteLot: (lotId: string) => void;
  onSaveAssay: (assay: TestAssay) => void;
  onDeleteAssay: (assayId: string) => void;
  onSaveInstrument: (instrument: Instrument) => void;
  onDeleteInstrument: (instrumentId: string) => void;
  onSaveUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export const QCConfigView: React.FC<QCConfigViewProps> = ({
  instruments,
  assays,
  lots,
  meanSdAuditHistory,
  currentUser,
  users,
  onUpdateLot,
  onDeleteLot,
  onSaveAssay,
  onDeleteAssay,
  onSaveInstrument,
  onDeleteInstrument,
  onSaveUser,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<'lots' | 'assays' | 'instruments' | 'audit' | 'users'>('lots');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [selectedAssayFilter, setSelectedAssayFilter] = useState<string>('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');

  // Modal states
  const [editingLotForMeanSd, setEditingLotForMeanSd] = useState<QCLot | null>(null);
  const [editingLotGeneral, setEditingLotGeneral] = useState<QCLot | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState<boolean>(false);

  const [editingAssay, setEditingAssay] = useState<TestAssay | null>(null);
  const [isAssayModalOpen, setIsAssayModalOpen] = useState<boolean>(false);

  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState<boolean>(false);

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  const [selectedLotForHistory, setSelectedLotForHistory] = useState<QCLot | null>(null);

  // Lọc danh sách Lô QC
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const matchInst = selectedInstFilter === 'ALL' || lot.instrumentId === selectedInstFilter;
      const matchAssay = selectedAssayFilter === 'ALL' || lot.assayId === selectedAssayFilter;
      const matchLevel = selectedLevelFilter === 'ALL' || lot.level === selectedLevelFilter;
      const assay = assays.find((a) => a.id === lot.assayId);
      const matchSearch = searchTerm === '' || 
        lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.controlName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assay && assay.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lot.assayId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchInst && matchAssay && matchLevel && matchSearch;
    });
  }, [lots, selectedInstFilter, selectedAssayFilter, selectedLevelFilter, searchTerm, assays]);

  // Lọc danh sách Xét nghiệm
  const filteredAssays = useMemo(() => {
    return assays.filter((assay) => {
      const matchInst = selectedInstFilter === 'ALL' || assay.instrumentId === selectedInstFilter;
      const matchSearch = searchTerm === '' ||
        assay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assay.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assay.method.toLowerCase().includes(searchTerm.toLowerCase());
      return matchInst && matchSearch;
    });
  }, [assays, selectedInstFilter, searchTerm]);

  // Lọc danh sách Người dùng
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = searchTerm === '' ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [users, searchTerm]);

  // Lọc lịch sử Audit Mean/SD
  const filteredAuditHistory = useMemo(() => {
    return meanSdAuditHistory.filter((rec) => {
      const matchInst = selectedInstFilter === 'ALL' || rec.instrumentId === selectedInstFilter;
      const matchAssay = selectedAssayFilter === 'ALL' || rec.assayId === selectedAssayFilter;
      const matchSearch = searchTerm === '' ||
        rec.assayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.changedBy.toLowerCase().includes(searchTerm.toLowerCase());
      return matchInst && matchAssay && matchSearch;
    });
  }, [meanSdAuditHistory, selectedInstFilter, selectedAssayFilter, searchTerm]);

  // Handler khi lưu sửa Mean/SD có lưu vết
  const handleSaveMeanSd = (auditRecord: MeanSdAuditRecord, updatedLot: QCLot) => {
    onUpdateLot(updatedLot, auditRecord);
    setEditingLotForMeanSd(null);
  };

  const getLevelBadge = (level: QCLevel) => {
    switch (level) {
      case 'level1':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Level 1 (Thấp)</span>;
      case 'level2':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Level 2 (Bình thường)</span>;
      case 'level3':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Level 3 (Cao)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-bold shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Khai Báo & Quản Lý Cấu Hình QC</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  ISO 15189
                </span>
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Thiết bị, Xét nghiệm, Vật liệu QC & Quản lý lưu vết hiệu chỉnh Mean, SD
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'lots' && (
            <button
              onClick={() => {
                setEditingLotGeneral(null);
                setIsLotModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Khai Báo Vật Liệu QC Mới
            </button>
          )}

          {activeTab === 'assays' && (
            <button
              onClick={() => {
                setEditingAssay(null);
                setIsAssayModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Thêm Xét Nghiệm Mới
            </button>
          )}

          {activeTab === 'instruments' && (
            <button
              onClick={() => {
                setEditingInstrument(null);
                setIsInstrumentModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Khai Báo Thiết Bị Mới
            </button>
          )}

          {activeTab === 'audit' && (
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              In Sổ Lưu Vết Mean/SD
            </button>
          )}

          {activeTab === 'users' && (
            <button
              onClick={() => {
                setEditingUser(null);
                setIsUserModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Khai Báo Người Dùng Mới
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('lots')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'lots'
              ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Vật Liệu QC & Mức Nồng Độ (Mean/SD)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {lots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assays')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'assays'
              ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>Danh Mục Xét Nghiệm</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {assays.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('instruments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'instruments'
              ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Danh Mục Thiết Bị</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {instruments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sổ Lưu Vết Sửa Mean/SD (Audit Trail)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-100 text-cyan-800 font-mono">
            {meanSdAuditHistory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-cyan-700 text-cyan-800 bg-cyan-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Người Dùng & Phân Quyền</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {users.length}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'lots'
                  ? 'Tìm theo số Lô, tên QC, xét nghiệm...'
                  : activeTab === 'assays'
                  ? 'Tìm theo tên, mã xét nghiệm...'
                  : activeTab === 'instruments'
                  ? 'Tìm theo tên máy, model, serial...'
                  : 'Tìm kiếm lưu vết theo tên xét nghiệm, người sửa, lý do...'
              }
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Lọc Thiết bị */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 text-[11px] whitespace-nowrap">Thiết bị:</span>
            <select
              value={selectedInstFilter}
              onChange={(e) => setSelectedInstFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">Tất cả thiết bị</option>
              {instruments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.id})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Xét nghiệm (khi ở tab Lots hoặc Audit) */}
          {(activeTab === 'lots' || activeTab === 'audit') && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 text-[11px] whitespace-nowrap">Xét nghiệm:</span>
              <select
                value={selectedAssayFilter}
                onChange={(e) => setSelectedAssayFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[180px] truncate"
              >
                <option value="ALL">Tất cả xét nghiệm</option>
                {assays.map((assay) => (
                  <option key={assay.id} value={assay.id}>
                    {assay.code} - {assay.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lọc Level (khi ở tab Lots) */}
          {activeTab === 'lots' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 text-[11px] whitespace-nowrap">Mức nồng độ:</span>
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ALL">Tất cả mức</option>
                <option value="level1">Level 1 (Thấp/Bình thường)</option>
                <option value="level2">Level 2 (Cao/Bệnh lý)</option>
                <option value="level3">Level 3 (Rất cao)</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-600">
          Hiển thị{' '}
          <strong>
            {activeTab === 'lots'
              ? filteredLots.length
              : activeTab === 'assays'
              ? filteredAssays.length
              : activeTab === 'instruments'
              ? instruments.length
              : filteredAuditHistory.length}
          </strong>{' '}
          bản ghi
        </div>
      </div>

      {/* TAB 1: VẬT LIỆU QC, MỨC NỒNG ĐỘ & SỬA MEAN/SD CÓ LƯU VẾT */}
      {activeTab === 'lots' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Xét Nghiệm & Thiết Bị</th>
                  <th className="py-3 px-4">Vật Liệu QC & Số Lô</th>
                  <th className="py-3 px-4">Mức Nồng Độ</th>
                  <th className="py-3 px-4 text-center">Mean Hiện Tại</th>
                  <th className="py-3 px-4 text-center">SD (1s)</th>
                  <th className="py-3 px-4 text-center">CV%</th>
                  <th className="py-3 px-4 text-center">Dải Kiểm Soát (±2s)</th>
                  <th className="py-3 px-4 text-center">Hạn Dùng</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-600">
                      Không tìm thấy Lô vật liệu QC nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredLots.map((lot) => {
                    const assay = assays.find((a) => a.id === lot.assayId);
                    const inst = instruments.find((i) => i.id === lot.instrumentId);
                    const lotAuditCount = meanSdAuditHistory.filter((h) => h.lotId === lot.id).length;
                    const isExpiringSoon = new Date(lot.expDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

                    return (
                      <tr key={lot.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {assay?.name || lot.assayId}
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-cyan-700 font-semibold">{assay?.code}</span>
                            <span>•</span>
                            <span>{inst?.name || lot.instrumentId}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{lot.controlName}</div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                              Lot #{lot.lotNumber}
                            </span>
                            <span>{lot.manufacturer}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {getLevelBadge(lot.level)}
                          <div className="text-[10px] text-slate-600 mt-1">{lot.levelName}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 rounded bg-slate-100">
                            {lot.targetMean} {assay?.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            ±{lot.targetSD}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                            {(lot.targetCV || (lot.targetMean > 0 ? (lot.targetSD / lot.targetMean) * 100 : 0)).toFixed(2)}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                          {(lot.targetMean - 2 * lot.targetSD).toFixed(assay?.decimalPlaces || 2)} - {(lot.targetMean + 2 * lot.targetSD).toFixed(assay?.decimalPlaces || 2)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`text-[11px] font-mono ${isExpiringSoon ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                            {lot.expDate}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {lot.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              Tạm dừng
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* NÚT SỬA MEAN & SD CÓ LƯU VẾT - TÍNH NĂNG CHỦ ĐẠO ISO 15189 */}
                            <button
                              onClick={() => setEditingLotForMeanSd(lot)}
                              title="Hiệu chỉnh Mean & SD có lưu vết (ISO 15189)"
                              className="px-2.5 py-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa Mean/SD</span>
                            </button>

                            {/* Nút xem lịch sử lưu vết của riêng Lô này */}
                            <button
                              onClick={() => {
                                setSelectedInstFilter(lot.instrumentId);
                                setSelectedAssayFilter(lot.assayId);
                                setSearchTerm(lot.lotNumber);
                                setActiveTab('audit');
                              }}
                              title={`Xem lịch sử lưu vết (${lotAuditCount} lần sửa)`}
                              className="p-1 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-md transition-colors relative"
                            >
                              <History className="w-4 h-4" />
                              {lotAuditCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-700 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                                  {lotAuditCount}
                                </span>
                              )}
                            </button>

                            {/* Nút sửa thông tin chung của Lô */}
                            <button
                              onClick={() => {
                                setEditingLotGeneral(lot);
                                setIsLotModalOpen(true);
                              }}
                              title="Sửa thông tin Lô QC"
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>

                            {/* Nút xóa Lô */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn xóa Lô QC ${lot.lotNumber} (${lot.levelName})?`)) {
                                  onDeleteLot(lot.id);
                                }
                              }}
                              title="Xóa Lô QC"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DANH MỤC XÉT NGHIỆM */}
      {activeTab === 'assays' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã & Tên Xét Nghiệm</th>
                  <th className="py-3 px-4">Thiết Bị Thực Hiện</th>
                  <th className="py-3 px-4 text-center">Đơn Vị Đo</th>
                  <th className="py-3 px-4 text-center">Loại Mẫu</th>
                  <th className="py-3 px-4 text-center">Số Chữ Số TP</th>
                  <th className="py-3 px-4 text-center">Tổng Sai Số TEa (%)</th>
                  <th className="py-3 px-4">Phương Pháp Đo</th>
                  <th className="py-3 px-4 text-center">Số Lô QC</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssays.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-600">
                      Không tìm thấy xét nghiệm nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredAssays.map((assay) => {
                    const inst = instruments.find((i) => i.id === assay.instrumentId);
                    const assayLots = lots.filter((l) => l.assayId === assay.id);

                    return (
                      <tr key={assay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 text-xs">
                              {assay.code}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">{assay.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{inst?.name || assay.instrumentId}</span>
                          <span className="text-[11px] text-slate-600 block">{inst?.department}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {assay.unit}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            {assay.sampleType}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-700">
                          {assay.decimalPlaces}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ±{assay.cliaTeaPercent}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-700 text-[11px]">
                          {assay.method}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                            {assayLots.length} Lô
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingAssay(assay);
                                setIsAssayModalOpen(true);
                              }}
                              title="Sửa xét nghiệm"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xác nhận xóa xét nghiệm ${assay.name} (${assay.code})?`)) {
                                  onDeleteAssay(assay.id);
                                }
                              }}
                              title="Xóa xét nghiệm"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DANH MỤC THIẾT BỊ XÉT NGHIỆM */}
      {activeTab === 'instruments' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã & Tên Thiết Bị</th>
                  <th className="py-3 px-4">Hãng Sản Xuất & Model</th>
                  <th className="py-3 px-4">Khoa / Phòng Máy</th>
                  <th className="py-3 px-4">Số Serial (S/N)</th>
                  <th className="py-3 px-4">Cổng Kết Nối & Port</th>
                  <th className="py-3 px-4">Giao Thức LIS</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Số XN Cấu Hình</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instruments.map((inst) => {
                  const instAssays = assays.filter((a) => a.instrumentId === inst.id);

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{inst.name}</div>
                        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                            {inst.id}
                          </span>
                          <span>Mã: {inst.code}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inst.manufacturer}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{inst.model}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {inst.department}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">
                        {inst.serialNumber}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 text-[11px] block">
                          {inst.connectionType}
                        </span>
                        <span className="font-mono text-[11px] text-slate-600">{inst.port}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {inst.protocol}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {inst.status === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ONLINE
                          </span>
                        ) : inst.status === 'STANDBY' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            STANDBY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {inst.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                          {instAssays.length} XN
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingInstrument(inst);
                              setIsInstrumentModalOpen(true);
                            }}
                            title="Sửa thông tin thiết bị"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Xác nhận xóa thiết bị ${inst.name} (${inst.id})?`)) {
                                onDeleteInstrument(inst.id);
                              }
                            }}
                            title="Xóa thiết bị"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SỔ LƯU VẾT HIỆU CHỈNH MEAN & SD (ISO 15189 AUDIT TRAIL) */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <strong className="text-cyan-900 font-bold block mb-0.5">
                Nhật Ký Kiểm Toán Hiệu Chỉnh Mean & SD Chuẩn ISO 15189 (Mục 7.3.7 & 8.5)
              </strong>
              Toàn bộ các lần thay đổi giá trị trung bình (Mean) và độ lệch chuẩn (SD) đều được ghi nhận tự động có mốc thời gian, người thực hiện, lý do lâm sàng và người phê duyệt để phục vụ thanh tra, thẩm định chất lượng phòng xét nghiệm y khoa.
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Thời Gian & Người Sửa</th>
                    <th className="py-3 px-4">Xét Nghiệm & Lô QC</th>
                    <th className="py-3 px-4">Mức Nồng Độ</th>
                    <th className="py-3 px-4 text-center">Mean Cũ → Mới</th>
                    <th className="py-3 px-4 text-center">SD Cũ → Mới</th>
                    <th className="py-3 px-4 text-center">CV% Cũ → Mới</th>
                    <th className="py-3 px-4">Lý Do Hiệu Chỉnh (Bắt buộc)</th>
                    <th className="py-3 px-4">Người Phê Duyệt</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-600">
                        Chưa có bản ghi lưu vết thay đổi Mean/SD nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditHistory.map((rec) => {
                      const meanDelta = rec.oldMean > 0 
                        ? ((rec.newMean - rec.oldMean) / rec.oldMean) * 100 
                        : 0;

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-900 font-semibold text-xs">
                              {new Date(rec.timestamp).toLocaleString('vi-VN')}
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {rec.changedBy}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {rec.changedByRole}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">{rec.assayName}</div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-1 py-0.2 rounded border border-cyan-200">
                                Lot #{rec.lotNumber}
                              </span>
                              <span>{rec.instrumentId}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {getLevelBadge(rec.level)}
                            <div className="text-[10px] text-slate-600 mt-1">{rec.levelName}</div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="font-mono text-xs flex items-center justify-center gap-1.5">
                              <span className="text-slate-600 line-through">{rec.oldMean}</span>
                              <ArrowRight className="w-3 h-3 text-cyan-600" />
                              <span className="font-bold text-slate-900 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                {rec.newMean}
                              </span>
                            </div>
                            {meanDelta !== 0 && (
                              <span className={`text-[10px] font-mono font-semibold block mt-0.5 ${meanDelta > 0 ? 'text-amber-700' : 'text-blue-700'}`}>
                                {meanDelta > 0 ? `+${meanDelta.toFixed(1)}%` : `${meanDelta.toFixed(1)}%`}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="font-mono text-xs flex items-center justify-center gap-1.5">
                              <span className="text-slate-600 line-through">±{rec.oldSD}</span>
                              <ArrowRight className="w-3 h-3 text-cyan-600" />
                              <span className="font-bold text-slate-900">±{rec.newSD}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="font-mono text-xs flex items-center justify-center gap-1.5">
                              <span className="text-slate-600 line-through">{rec.oldCV}%</span>
                              <ArrowRight className="w-3 h-3 text-cyan-600" />
                              <span className="font-bold text-cyan-800">{rec.newCV}%</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-xs font-semibold text-slate-800">{rec.reason}</p>
                            <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                              {rec.reasonCategory === 'CUMULATIVE_MEAN_20'
                                ? '20 điểm tích lũy'
                                : rec.reasonCategory === 'NEW_REAGENT_LOT'
                                ? 'Đổi lô hóa chất'
                                : rec.reasonCategory === 'MAINTENANCE_CALIBRATION'
                                ? 'Sau bảo dưỡng/chuẩn máy'
                                : rec.reasonCategory === 'MANUFACTURER_RECOMMENDATION'
                                ? 'Khuyến cáo NSX'
                                : 'Lý do khác'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 text-xs">
                              {rec.approvedBy || 'Chưa duyệt'}
                            </div>
                            <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã phê duyệt
                            </span>
                          </td>

                          <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs">
                            {rec.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KHAI BÁO & QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nhân Viên & Mã Số</th>
                  <th className="py-3 px-4">Tên Đăng Nhập & Mật Khẩu</th>
                  <th className="py-3 px-4">Chức Danh / Khoa Phòng</th>
                  <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                  <th className="py-3 px-4">Quyền Hạn Được Cấp (Permissions)</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Không tìm thấy người dùng nào phù hợp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">Mã: {u.code}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 inline-block text-xs">
                          @{u.username}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Mật khẩu: <span className="font-bold text-slate-700">{u.password || '123'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium text-xs">{u.roleTitle}</div>
                        <div className="text-[11px] text-slate-500">{u.department}</div>
                      </td>

                      <td className="py-3 px-4">
                        {u.role === 'director' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Trưởng khoa
                          </span>
                        ) : u.role === 'manager' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            Quản lý CL
                          </span>
                        ) : u.role === 'technician' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Kỹ thuật viên
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Auditor
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {u.permissions?.canInputQC && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                              Nhập QC
                            </span>
                          )}
                          {u.permissions?.canEditMeanSD && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
                              Sửa Mean/SD
                            </span>
                          )}
                          {u.permissions?.canApproveCapa && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              Duyệt CAPA
                            </span>
                          )}
                          {u.permissions?.canManageConfig && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Cấu hình QC
                            </span>
                          )}
                          {u.permissions?.canManageUsers && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                              Quản lý User
                            </span>
                          )}
                          {u.permissions?.canExportReports && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600">
                              Báo cáo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setIsUserModalOpen(true);
                            }}
                            title="Chỉnh sửa & Cấp quyền"
                            className="px-2.5 py-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Cấp Quyền</span>
                          </button>
                          {users.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Xác nhận xóa tài khoản ${u.name} (@${u.username})?`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              title="Xóa tài khoản"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Modal Sửa Mean & SD Có Lưu Vết */}
      {editingLotForMeanSd && (
        <EditMeanSdModal
          isOpen={Boolean(editingLotForMeanSd)}
          onClose={() => setEditingLotForMeanSd(null)}
          lot={editingLotForMeanSd}
          assay={assays.find((a) => a.id === editingLotForMeanSd.assayId)}
          instrument={instruments.find((i) => i.id === editingLotForMeanSd.instrumentId)}
          currentUser={currentUser}
          onSave={handleSaveMeanSd}
        />
      )}

      {/* 2. Modal Khai Báo / Sửa Lô QC Chung */}
      {isLotModalOpen && (
        <LotModal
          isOpen={isLotModalOpen}
          onClose={() => {
            setIsLotModalOpen(false);
            setEditingLotGeneral(null);
          }}
          lotToEdit={editingLotGeneral}
          assays={assays}
          instruments={instruments}
          onSave={(lot) => {
            onUpdateLot(lot);
            setIsLotModalOpen(false);
            setEditingLotGeneral(null);
          }}
        />
      )}

      {/* 3. Modal Khai Báo / Sửa Xét Nghiệm */}
      {isAssayModalOpen && (
        <AssayModal
          isOpen={isAssayModalOpen}
          onClose={() => {
            setIsAssayModalOpen(false);
            setEditingAssay(null);
          }}
          assayToEdit={editingAssay}
          instruments={instruments}
          onSave={(assay) => {
            onSaveAssay(assay);
            setIsAssayModalOpen(false);
            setEditingAssay(null);
          }}
        />
      )}

      {/* 4. Modal Khai Báo / Sửa Thiết Bị */}
      {isInstrumentModalOpen && (
        <InstrumentModal
          isOpen={isInstrumentModalOpen}
          onClose={() => {
            setIsInstrumentModalOpen(false);
            setEditingInstrument(null);
          }}
          instrumentToEdit={editingInstrument}
          onSave={(inst) => {
            onSaveInstrument(inst);
            setIsInstrumentModalOpen(false);
            setEditingInstrument(null);
          }}
        />
      )}

      {/* 5. Modal Khai Báo / Sửa & Cấp Quyền Người Dùng */}
      {isUserModalOpen && (
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setEditingUser(null);
          }}
          userToEdit={editingUser}
          onSave={(usr) => {
            onSaveUser(usr);
            setIsUserModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};
