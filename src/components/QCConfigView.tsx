import React, { useState, useMemo } from 'react';
import { 
  Instrument, 
  LabInfo,
  MeanSdAuditRecord, 
  QCLot, 
  QCMaterial, 
  QCMapping, 
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
  CheckCircle2, 
  Trash2, 
  Sliders, 
  Printer, 
  Users, 
  Lock, 
  Network, 
  Building2,
  ShieldAlert
} from 'lucide-react';
import { EditMeanSdModal } from './EditMeanSdModal';
import { InstrumentModal } from './InstrumentModal';
import { AssayModal } from './AssayModal';
import { UserModal } from './UserModal';
import { MaterialModal } from './MaterialModal';
import { MappingModal } from './MappingModal';
import { LabInfoModal } from './LabInfoModal';

interface QCConfigViewProps {
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  materials: QCMaterial[];
  qcMappings: QCMapping[];
  meanSdAuditHistory: MeanSdAuditRecord[];
  currentUser: UserProfile;
  users: UserProfile[];
  labInfo: LabInfo;
  onSaveLabInfo: (info: LabInfo) => void;
  onUpdateLot: (updatedLot: QCLot, auditRecord?: MeanSdAuditRecord) => void;
  onDeleteLot: (lotId: string) => void;
  onSaveAssay: (assay: TestAssay) => void;
  onDeleteAssay: (assayId: string) => void;
  onSaveInstrument: (instrument: Instrument) => void;
  onDeleteInstrument: (instrumentId: string) => void;
  onSaveUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSaveMaterial: (material: QCMaterial) => void;
  onDeleteMaterial: (materialId: string) => void;
  onSaveMapping: (mapping: QCMapping) => void;
  onDeleteMapping: (mappingId: string) => void;
}

export const QCConfigView: React.FC<QCConfigViewProps> = ({
  instruments,
  assays,
  lots,
  materials,
  qcMappings,
  meanSdAuditHistory,
  currentUser,
  users,
  labInfo,
  onSaveLabInfo,
  onUpdateLot,
  onDeleteLot,
  onSaveAssay,
  onDeleteAssay,
  onSaveInstrument,
  onDeleteInstrument,
  onSaveUser,
  onDeleteUser,
  onSaveMaterial,
  onDeleteMaterial,
  onSaveMapping,
  onDeleteMapping,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'mappings' | 'materials' | 'assays' | 'instruments' | 'audit' | 'users' | 'labInfo'>('mappings');

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isLabInfoModalOpen, setIsLabInfoModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<QCMaterial | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false);
  const [editingMapping, setEditingMapping] = useState<QCMapping | null>(null);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);
  const [editingLotForMeanSd, setEditingLotForMeanSd] = useState<QCLot | null>(null);
  const [editingAssay, setEditingAssay] = useState<TestAssay | null>(null);
  const [isAssayModalOpen, setIsAssayModalOpen] = useState<boolean>(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  // Phân quyền nghiêm ngặt theo chuẩn an toàn dữ liệu y khoa
  const isDirector = currentUser.role === 'director';
  const isManager = currentUser.role === 'manager';
  const canManageConfig = isDirector || (isManager && Boolean(currentUser.permissions?.canManageConfig));
  const canEditMeanSD = isDirector || (isManager && Boolean(currentUser.permissions?.canEditMeanSD));
  const canManageUsers = isDirector;
  const canEditLabInfo = isDirector;

  // Filter lists
  const filteredInstruments = useMemo(() => {
    return instruments.filter(i => 
      !searchTerm || 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.port.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instruments, searchTerm]);

  const filteredAssays = useMemo(() => {
    return assays.filter(a => 
      !searchTerm || 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.instrumentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assays, searchTerm]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      !searchTerm || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const filteredMappings = useMemo(() => {
    return qcMappings.filter(m => {
      const assay = assays.find(a => a.id === m.assayId);
      const material = materials.find(mat => mat.id === m.materialId);
      const term = searchTerm.toLowerCase();

      return !searchTerm || 
        m.instrumentId.toLowerCase().includes(term) ||
        (assay && assay.name.toLowerCase().includes(term)) ||
        (material && (material.name.toLowerCase().includes(term) || material.lotNumber.toLowerCase().includes(term)));
    });
  }, [qcMappings, searchTerm, assays, materials]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      !searchTerm || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredAudit = useMemo(() => {
    return meanSdAuditHistory.filter(rec => 
      !searchTerm || 
      rec.assayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      rec.changedBy.toLowerCase().includes(searchTerm.toLowerCase()) || 
      rec.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [meanSdAuditHistory, searchTerm]);

  // Sửa Mean/SD cho level
  const handleOpenEditMeanSdForLevel = (mapping: QCMapping, levelSetting: any) => {
    if (!canEditMeanSD) {
      alert('Phân quyền: Bạn cần quyền Quản lý chất lượng hoặc Trưởng khoa để hiệu chỉnh Mean/SD.');
      return;
    }
    const foundLot = lots.find(l => l.id === levelSetting.lotId) || lots.find(l => l.assayId === mapping.assayId && l.level === levelSetting.level);
    const material = materials.find(m => m.id === mapping.materialId);

    if (foundLot) {
      setEditingLotForMeanSd(foundLot);
    } else {
      const fallbackLot: QCLot = {
        id: levelSetting.lotId || `LOT_${mapping.assayId}_${levelSetting.level}`,
        assayId: mapping.assayId,
        instrumentId: mapping.instrumentId,
        lotNumber: material?.lotNumber || 'QC-LOT',
        level: levelSetting.level,
        levelName: levelSetting.levelName,
        manufacturer: material?.manufacturer || 'Bio-Rad',
        controlName: material?.name || 'QC Control',
        expDate: material?.expDate || '2027-12-31',
        targetMean: levelSetting.targetMean,
        targetSD: levelSetting.targetSD,
        targetCV: levelSetting.targetCV,
        active: levelSetting.active,
        materialId: mapping.materialId,
      };
      setEditingLotForMeanSd(fallbackLot);
    }
  };

  const handleSaveMeanSdResult = (auditRecord: MeanSdAuditRecord, updatedLot: QCLot) => {
    onUpdateLot(updatedLot, auditRecord);
    const updatedMappings = qcMappings.map(m => {
      if (m.assayId === updatedLot.assayId && m.instrumentId === updatedLot.instrumentId) {
        return {
          ...m,
          updatedAt: new Date().toISOString(),
          levelConfigs: m.levelConfigs.map(lvl => {
            if (lvl.level === updatedLot.level) {
              return {
                ...lvl,
                targetMean: updatedLot.targetMean,
                targetSD: updatedLot.targetSD,
                targetCV: updatedLot.targetCV,
              };
            }
            return lvl;
          }),
        };
      }
      return m;
    });
    const currMapping = updatedMappings.find(m => m.assayId === updatedLot.assayId && m.instrumentId === updatedLot.instrumentId);
    if (currMapping) onSaveMapping(currMapping);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Main Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Bước 1: Thiết Bị */}
          <button
            onClick={() => { setActiveTab('instruments'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'instruments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>1. Thiết Bị</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {instruments.length}
            </span>
          </button>

          {/* Bước 2: Xét Nghiệm */}
          <button
            onClick={() => { setActiveTab('assays'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'assays' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TestTube className="w-3.5 h-3.5" />
            <span>2. Xét Nghiệm</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {assays.length}
            </span>
          </button>

          {/* Bước 3: Vật Liệu QC */}
          <button
            onClick={() => { setActiveTab('materials'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'materials' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Vật Liệu QC</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {materials.length}
            </span>
          </button>

          {/* Bước 4: Map Kiểm Chuẩn */}
          <button
            onClick={() => { setActiveTab('mappings'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mappings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>4. Map Kiểm Chuẩn</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {qcMappings.length}
            </span>
          </button>

          {/* Bước 5: Lịch Sửa Cập Nhật Mean/SD */}
          <button
            onClick={() => { setActiveTab('audit'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sửa Cập Nhật Mean/SD</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {meanSdAuditHistory.length}
            </span>
          </button>

          {/* Bước 6: Người Dùng */}
          <button
            onClick={() => { setActiveTab('users'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Người Dùng</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {users.length}
            </span>
          </button>

          {/* Bước 7: Thông Tin Phòng Xét Nghiệm */}
          <button
            onClick={() => { setActiveTab('labInfo'); setSearchTerm(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'labInfo' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Thông Tin Phòng Xét Nghiệm</span>
          </button>
        </div>

        {/* Global Action Button by Active Tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'instruments' && canManageConfig && (
            <button
              onClick={() => { setEditingInstrument(null); setIsInstrumentModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Thiết Bị</span>
            </button>
          )}

          {activeTab === 'assays' && canManageConfig && (
            <button
              onClick={() => { setEditingAssay(null); setIsAssayModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Xét Nghiệm</span>
            </button>
          )}

          {activeTab === 'materials' && canManageConfig && (
            <button
              onClick={() => { setEditingMaterial(null); setIsMaterialModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Vật Liệu QC</span>
            </button>
          )}

          {activeTab === 'mappings' && canManageConfig && (
            <button
              onClick={() => { setEditingMapping(null); setIsMappingModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Map Kiểm Chuẩn Mới</span>
            </button>
          )}

          {activeTab === 'audit' && (
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Lịch Sử Cập Nhật</span>
            </button>
          )}

          {activeTab === 'users' && canManageUsers && (
            <button
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Người Dùng</span>
            </button>
          )}

          {activeTab === 'labInfo' && canEditLabInfo && (
            <button
              onClick={() => setIsLabInfoModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa Thông Tin</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TAB THIẾT BỊ                                          */}
      {/* ======================================================== */}
      {activeTab === 'instruments' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm thiết bị..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng số: <strong className="text-slate-900">{filteredInstruments.length}</strong> máy
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Tên Máy</th>
                  <th className="py-3 px-4">Cổng Kết Nối</th>
                  <th className="py-3 px-4">Địa Chỉ Port</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredInstruments.map((inst, index) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inst.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 text-slate-800 font-medium">
                        {inst.connectionType === 'TCP_IP' ? 'TCP/IP LAN' : inst.connectionType === 'RS232_SERIAL' ? 'RS-232 Serial' : 'HL7 LIS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{inst.port}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inst.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' :
                        inst.status === 'STANDBY' ? 'bg-amber-100 text-amber-800' :
                        inst.status === 'BUSY' ? 'bg-cyan-100 text-cyan-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManageConfig ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingInstrument(inst); setIsInstrumentModalOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa thiết bị [${inst.name}]?`)) {
                                onDeleteInstrument(inst.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TAB XÉT NGHIỆM (BỎ MÃ XN VÀ PHƯƠNG PHÁP)             */}
      {/* ======================================================== */}
      {activeTab === 'assays' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm xét nghiệm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng số: <strong className="text-slate-900">{filteredAssays.length}</strong> chỉ số
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Tên Xét Nghiệm</th>
                  <th className="py-3 px-4">Thiết Bị</th>
                  <th className="py-3 px-4">Đơn Vị</th>
                  <th className="py-3 px-4">Loại Mẫu</th>
                  <th className="py-3 px-4">TEa Cho Phép (%)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredAssays.map((assay, index) => {
                  const inst = instruments.find(i => i.id === assay.instrumentId);
                  return (
                    <tr key={assay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{assay.name}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{inst?.name || assay.instrumentId}</td>
                      <td className="py-3 px-4 font-mono font-medium">{assay.unit}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {assay.sampleType === 'SERUM' ? 'Huyết thanh' : assay.sampleType === 'PLASMA' ? 'Huyết tương' : assay.sampleType === 'WHOLE_BLOOD' ? 'Máu toàn phần' : 'Nước tiểu'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{assay.cliaTeaPercent}%</td>
                      <td className="py-3 px-4 text-right">
                        {canManageConfig ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditingAssay(assay); setIsAssayModalOpen(true); }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa xét nghiệm [${assay.name}]?`)) {
                                  onDeleteAssay(assay.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB VẬT LIỆU QC (BỎ MÃ VẬT LIỆU VÀ NỀN MẪU)           */}
      {/* ======================================================== */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm vật liệu QC, số lô..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng số: <strong className="text-slate-900">{filteredMaterials.length}</strong> vật liệu
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Tên Vật Liệu QC</th>
                  <th className="py-3 px-4">Hãng Sản Xuất</th>
                  <th className="py-3 px-4">Số Lô (Lot Number)</th>
                  <th className="py-3 px-4">Hạn Dùng</th>
                  <th className="py-3 px-4">Mức Nồng Độ</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredMaterials.map((mat, index) => (
                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{mat.name}</td>
                    <td className="py-3 px-4 text-slate-700">{mat.manufacturer}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{mat.lotNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{mat.expDate}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {mat.levels?.map((l, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-mono">
                            {l.level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mat.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {mat.active ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManageConfig ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingMaterial(mat); setIsMaterialModalOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa vật liệu QC [${mat.name}]?`)) {
                                onDeleteMaterial(mat.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB MAP KIỂM CHUẨN                                    */}
      {/* ======================================================== */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mapping theo máy, xét nghiệm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng số: <strong className="text-slate-900">{filteredMappings.length}</strong> cấu hình
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Thiết Bị & Xét Nghiệm</th>
                  <th className="py-3 px-4">Vật Liệu QC & Lô</th>
                  <th className="py-3 px-4">Cài Đặt Mean & SD Từng Mức</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredMappings.map(mapping => {
                  const assay = assays.find(a => a.id === mapping.assayId);
                  const material = materials.find(m => m.id === mapping.materialId);
                  const inst = instruments.find(i => i.id === mapping.instrumentId);

                  return (
                    <tr key={mapping.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{assay?.name || mapping.assayId}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Máy: {inst?.name || mapping.instrumentId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{material?.name || 'Vật liệu QC'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Lô: <strong className="text-slate-700">{material?.lotNumber}</strong>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {mapping.levelConfigs.map(lvl => (
                            <div key={lvl.level} className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="w-14 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-center">
                                {lvl.level}
                              </span>
                              <span>Mean: <strong className="text-slate-900">{lvl.targetMean}</strong></span>
                              <span>± SD: <strong className="text-slate-900">{lvl.targetSD}</strong></span>
                              <span className="text-slate-400">(CV: {lvl.targetCV}%)</span>

                              {canEditMeanSD && (
                                <button
                                  onClick={() => handleOpenEditMeanSdForLevel(mapping, lvl)}
                                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold hover:underline px-1 py-0.5 rounded cursor-pointer flex items-center gap-0.5 ml-1"
                                  title="Lịch sửa cập nhật Mean/SD"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Sửa Mean/SD</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          mapping.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {mapping.active ? 'Áp dụng' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManageConfig ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditingMapping(mapping); setIsMappingModalOpen(true); }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa mapping kiểm chuẩn này?`)) {
                                  onDeleteMapping(mapping.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB LỊCH SỬA CẬP NHẬT MEAN/SD (ĐỔI TỪ LƯU VẾT)        */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm lịch sửa cập nhật..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng số: <strong className="text-slate-900">{filteredAudit.length}</strong> lần cập nhật
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Xét Nghiệm & Lô</th>
                  <th className="py-3 px-4">Người Thực Hiện & Duyệt</th>
                  <th className="py-3 px-4">Mean (Cũ → Mới)</th>
                  <th className="py-3 px-4">SD & CV% (Cũ → Mới)</th>
                  <th className="py-3 px-4">Lý Do Hiệu Chỉnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredAudit.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                      {new Date(rec.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.assayName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        [{rec.instrumentId}] Lô: {rec.lotNumber} · {rec.levelName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rec.changedBy}</div>
                      <div className="text-[11px] text-slate-500">{rec.changedByRole}</div>
                      {rec.approvedBy && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          ✓ Duyệt: {rec.approvedBy}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="line-through text-slate-400">{rec.oldMean}</span> → <strong className="text-emerald-700">{rec.newMean}</strong>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span>{rec.oldSD} → <strong>{rec.newSD}</strong> (CV {rec.newCV}%)</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-0.5">
                        {rec.reasonCategory}
                      </span>
                      <p className="text-xs text-slate-700">{rec.reason}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TAB NGƯỜI DÙNG & PHÂN QUYỀN                           */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng số: <strong className="text-slate-900">{filteredUsers.length}</strong> tài khoản
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Họ Và Tên</th>
                  <th className="py-3 px-4">Tên Đăng Nhập</th>
                  <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">@{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                        u.role === 'director' ? 'bg-indigo-100 text-indigo-900 font-bold' :
                        u.role === 'manager' ? 'bg-cyan-100 text-cyan-900 font-bold' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.roleTitle}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.active ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManageUsers ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa tài khoản [${u.name}]?`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. TAB THÔNG TIN PHÒNG XÉT NGHIỆM                         */}
      {/* ======================================================== */}
      {activeTab === 'labInfo' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-900" />
              <span>Hồ Sơ Pháp Lý Đơn Vị & Phòng Xét Nghiệm</span>
            </div>
            {canEditLabInfo ? (
              <button
                onClick={() => setIsLabInfoModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa Thông Tin</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Tên Đơn Vị / Bệnh Viện:</span>
                <p className="font-bold text-sm text-slate-900">{labInfo.hospitalName || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Phòng Xét Nghiệm:</span>
                <p className="font-bold text-sm text-slate-900">{labInfo.name || 'Trung Tâm Xét Nghiệm'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Trưởng Khoa:</span>
                <p className="font-semibold text-slate-800">{labInfo.headTitle} {labInfo.headOfDepartment}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Phụ Trách QC:</span>
                <p className="font-semibold text-slate-800">{labInfo.supervisorTitle} {labInfo.technicalSupervisor}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Địa Chỉ:</span>
                <p className="text-slate-700">{labInfo.address}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Liên Hệ:</span>
                <p className="text-slate-700">{labInfo.phone} · {labInfo.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modals */}
      <InstrumentModal
        isOpen={isInstrumentModalOpen}
        onClose={() => setIsInstrumentModalOpen(false)}
        instrumentToEdit={editingInstrument}
        onSave={onSaveInstrument}
      />

      <AssayModal
        isOpen={isAssayModalOpen}
        onClose={() => setIsAssayModalOpen(false)}
        assayToEdit={editingAssay}
        instruments={instruments}
        onSave={onSaveAssay}
      />

      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        material={editingMaterial}
        onSave={onSaveMaterial}
      />

      <MappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        mapping={editingMapping}
        instruments={instruments}
        assays={assays}
        materials={materials}
        onSave={onSaveMapping}
      />

      {editingLotForMeanSd && (
        <EditMeanSdModal
          isOpen={true}
          onClose={() => setEditingLotForMeanSd(null)}
          lot={editingLotForMeanSd}
          assay={assays.find(a => a.id === editingLotForMeanSd?.assayId)}
          currentUser={currentUser}
          onSave={handleSaveMeanSdResult}
        />
      )}

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={editingUser}
        onSave={onSaveUser}
      />

      <LabInfoModal
        isOpen={isLabInfoModalOpen}
        onClose={() => setIsLabInfoModalOpen(false)}
        labInfo={labInfo}
        onSaveLabInfo={onSaveLabInfo}
      />
    </div>
  );
};
