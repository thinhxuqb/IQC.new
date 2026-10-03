import React, { useState, useMemo } from 'react';
import { 
  Instrument, 
  LabInfo,
  MeanSdAuditRecord, 
  QCLevel, 
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
  Lock,
  Network,
  Building2,
  Hospital,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award
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
  // Tabs: Bước 1: Thiết Bị -> Bước 2: Xét Nghiệm -> Bước 3: Vật Liệu QC -> Bước 4: Map Kiểm Chuẩn -> Bước 5: Lưu Vết -> Bước 6: Người Dùng -> Bước 7: Phòng Xét Nghiệm
  const [activeTab, setActiveTab] = useState<'mappings' | 'materials' | 'assays' | 'instruments' | 'audit' | 'users' | 'labInfo'>('mappings');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('ALL');
  const [selectedAssayFilter, setSelectedAssayFilter] = useState<string>('ALL');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');

  // Modal states
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

  // Lọc danh sách Mapping kiểm chuẩn
  const filteredMappings = useMemo(() => {
    return qcMappings.filter(m => {
      const matchInst = selectedInstFilter === 'ALL' || m.instrumentId === selectedInstFilter;
      const matchAssay = selectedAssayFilter === 'ALL' || m.assayId === selectedAssayFilter;
      const matchMat = selectedMaterialFilter === 'ALL' || m.materialId === selectedMaterialFilter;
      
      const assay = assays.find(a => a.id === m.assayId);
      const material = materials.find(mat => mat.id === m.materialId);
      const term = searchTerm.toLowerCase();

      const matchSearch = !searchTerm || 
        m.instrumentId.toLowerCase().includes(term) ||
        (assay && (assay.name.toLowerCase().includes(term) || assay.code.toLowerCase().includes(term))) ||
        (material && (material.name.toLowerCase().includes(term) || material.lotNumber.toLowerCase().includes(term)));

      return matchInst && matchAssay && matchMat && matchSearch;
    });
  }, [qcMappings, selectedInstFilter, selectedAssayFilter, selectedMaterialFilter, searchTerm, assays, materials]);

  // Lọc danh sách Vật liệu QC
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const term = searchTerm.toLowerCase();
      return !searchTerm ||
        m.name.toLowerCase().includes(term) ||
        m.lotNumber.toLowerCase().includes(term) ||
        m.manufacturer.toLowerCase().includes(term) ||
        m.code.toLowerCase().includes(term);
    });
  }, [materials, searchTerm]);

  // Lọc danh sách Xét nghiệm
  const filteredAssays = useMemo(() => {
    return assays.filter(a => {
      const matchInst = selectedInstFilter === 'ALL' || a.instrumentId === selectedInstFilter;
      const matchSearch = !searchTerm ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.method.toLowerCase().includes(searchTerm.toLowerCase());
      return matchInst && matchSearch;
    });
  }, [assays, selectedInstFilter, searchTerm]);

  // Lọc danh sách Thiết bị
  const filteredInstruments = useMemo(() => {
    return instruments.filter(i => {
      return !searchTerm ||
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.department.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [instruments, searchTerm]);

  // Lọc danh sách Người dùng
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      return !searchTerm ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.roleTitle.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [users, searchTerm]);

  // Mở modal sửa Mean/SD cho 1 level trong mapping
  const handleOpenEditMeanSdForLevel = (mapping: QCMapping, levelSetting: any) => {
    // Tìm hoặc tạo đối tượng QCLot đại diện cho level này
    const foundLot = lots.find(l => l.id === levelSetting.lotId) || lots.find(l => l.assayId === mapping.assayId && l.level === levelSetting.level);
    const material = materials.find(m => m.id === mapping.materialId);

    if (foundLot) {
      setEditingLotForMeanSd(foundLot);
    } else {
      // Tạo lot ảo tương thích
      const virtualLot: QCLot = {
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
      setEditingLotForMeanSd(virtualLot);
    }
  };

  // Lưu sửa Mean/SD từ EditMeanSdModal
  const handleSaveMeanSdResult = (auditRecord: MeanSdAuditRecord, updatedLot: QCLot) => {
    onUpdateLot(updatedLot, auditRecord);

    // Cập nhật lại trong qcMappings
    const updatedMappings = qcMappings.map(m => {
      if (m.assayId === updatedLot.assayId && m.instrumentId === updatedLot.instrumentId) {
        const updatedLevels = m.levelConfigs.map(lvl => {
          if (lvl.level === updatedLot.level) {
            return {
              ...lvl,
              targetMean: updatedLot.targetMean,
              targetSD: updatedLot.targetSD,
              targetCV: updatedLot.targetCV,
            };
          }
          return lvl;
        });
        return { ...m, levelConfigs: updatedLevels, updatedAt: new Date().toISOString() };
      }
      return m;
    });

    const targetMapping = updatedMappings.find(m => m.assayId === updatedLot.assayId && m.instrumentId === updatedLot.instrumentId);
    if (targetMapping) {
      onSaveMapping(targetMapping);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-700" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Quản Trị Danh Mục & Map Kiểm Chuẩn ISO 15189
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Quy trình chuẩn hóa 4 bước độc lập: <strong>1. Thiết Bị</strong> $\rightarrow$ <strong>2. Xét Nghiệm</strong> $\rightarrow$ <strong>3. Vật Liệu QC</strong> (1 vật liệu dùng chung nhiều xét nghiệm) $\rightarrow$ <strong>4. Map Kiểm Chuẩn</strong> & cài đặt Mean/SD từng mức có lưu vết ISO 15189.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'mappings' && (
            <button
              onClick={() => {
                setEditingMapping(null);
                setIsMappingModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Network className="w-4 h-4" />
              <span>Map Kiểm Chuẩn Mới</span>
            </button>
          )}

          {activeTab === 'materials' && (
            <button
              onClick={() => {
                setEditingMaterial(null);
                setIsMaterialModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Khai Báo Vật Liệu QC Mới</span>
            </button>
          )}

          {activeTab === 'assays' && (
            <button
              onClick={() => {
                setEditingAssay(null);
                setIsAssayModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Xét Nghiệm Mới</span>
            </button>
          )}

          {activeTab === 'instruments' && (
            <button
              onClick={() => {
                setEditingInstrument(null);
                setIsInstrumentModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Khai Báo Thiết Bị Mới</span>
            </button>
          )}

          {activeTab === 'audit' && (
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Sổ Lưu Vết Mean/SD</span>
            </button>
          )}

          {activeTab === 'users' && (
            <button
              onClick={() => {
                setEditingUser(null);
                setIsUserModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Khai Báo Người Dùng Mới</span>
            </button>
          )}

          {activeTab === 'labInfo' && (
            <button
              onClick={() => setIsLabInfoModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sửa Thông Tin Phòng Xét Nghiệm</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {/* Bước 1: Thiết Bị */}
        <button
          onClick={() => setActiveTab('instruments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'instruments'
              ? 'border-indigo-700 text-indigo-900 bg-indigo-50/60 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Server className="w-4 h-4 text-slate-600" />
          <span>1. Thiết Bị</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {instruments.length}
          </span>
        </button>

        {/* Bước 2: Xét Nghiệm */}
        <button
          onClick={() => setActiveTab('assays')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'assays'
              ? 'border-indigo-700 text-indigo-900 bg-indigo-50/60 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <TestTube className="w-4 h-4 text-slate-600" />
          <span>2. Xét Nghiệm</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {assays.length}
          </span>
        </button>

        {/* Bước 3: Vật Liệu QC (Độc lập, 1 vật liệu dùng nhiều xét nghiệm) */}
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'materials'
              ? 'border-teal-600 text-teal-900 bg-teal-50/70 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-600" />
          <span>3. Vật Liệu QC (Mẫu Kiểm Chuẩn)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
            {materials.length}
          </span>
        </button>

        {/* Bước 4: Map Kiểm Chuẩn & Mean/SD */}
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'mappings'
              ? 'border-indigo-700 text-indigo-900 bg-indigo-50/80 rounded-t-lg shadow-inner'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Network className="w-4 h-4 text-indigo-600" />
          <span className="font-extrabold">4. Map Kiểm Chuẩn & Giá Trị Từng Mức</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-bold">
            {qcMappings.length}
          </span>
        </button>

        {/* Sổ lưu vết */}
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-700 text-indigo-900 bg-indigo-50/60 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <History className="w-4 h-4 text-amber-600" />
          <span>Lưu Vết Mean/SD (ISO 15189)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
            {meanSdAuditHistory.length}
          </span>
        </button>

        {/* Quản lý người dùng */}
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-700 text-indigo-900 bg-indigo-50/60 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Người Dùng & Phân Quyền</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {users.length}
          </span>
        </button>

        {/* Thông tin phòng xét nghiệm */}
        <button
          onClick={() => setActiveTab('labInfo')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'labInfo'
              ? 'border-indigo-700 text-indigo-900 bg-indigo-50/80 rounded-t-lg shadow-inner'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Thông Tin Phòng Xét Nghiệm</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
            ISO
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 4: MAP KIỂM CHUẨN (DEFAULT TAB)                      */}
      {/* ======================================================== */}
      {activeTab === 'mappings' && (
        <div className="space-y-4">
          {/* Explanation Banner */}
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Network className="w-4 h-4" />
              </div>
              <div className="text-xs text-indigo-950">
                <h4 className="font-bold text-sm">
                  Ghép Nối Thiết Bị × Xét Nghiệm × Vật Liệu QC & Cài Đặt Mean/SD Từng Mức
                </h4>
                <p className="text-slate-600 mt-0.5">
                  1 Vật liệu QC (ví dụ Lô Bio-Rad Lyphochek Chemistry) được map cho nhiều xét nghiệm (Glucose, Urea, Creatinine, Men gan...). Tại mỗi xét nghiệm, bạn cài đặt Mean và SD mục tiêu cho từng mức nồng độ. Sửa Mean/SD có lưu vết ISO 15189 bắt buộc nhập lý do và người duyệt.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMapping(null);
                setIsMappingModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Map Mới</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo xét nghiệm, máy, số lô vật liệu..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Máy:</span>
              <select
                value={selectedInstFilter}
                onChange={e => setSelectedInstFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả thiết bị ({instruments.length})</option>
                {instruments.map(inst => (
                  <option key={inst.id} value={inst.id}>[{inst.id}] {inst.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Vật Liệu QC:</span>
              <select
                value={selectedMaterialFilter}
                onChange={e => setSelectedMaterialFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả vật liệu QC ({materials.length})</option>
                {materials.map(mat => (
                  <option key={mat.id} value={mat.id}>{mat.name} (Lô: {mat.lotNumber})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mappings Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thiết Bị & Xét Nghiệm</th>
                    <th className="py-3 px-4">Vật Liệu QC (Huyết Thanh Dùng Chung)</th>
                    <th className="py-3 px-4">Cài Đặt Giá Trị Từng Mức (Mean / SD / CV%)</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredMappings.map(mapping => {
                    const assay = assays.find(a => a.id === mapping.assayId);
                    const material = materials.find(m => m.id === mapping.materialId);

                    return (
                      <tr key={mapping.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-white">
                              {mapping.instrumentId}
                            </span>
                            <div className="font-bold text-slate-900 text-xs">
                              {assay ? `${assay.code} - ${assay.name}` : mapping.assayId}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Đơn vị: <strong>{assay?.unit || 'N/A'}</strong> | TEa: <strong>{assay?.cliaTeaPercent || 10}%</strong>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {material ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span>{material.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono">
                                Lô: <strong className="text-slate-900">{material.lotNumber}</strong> · Hạn: {material.expDate}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {material.manufacturer}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-600 italic">Chưa liên kết vật liệu</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 min-w-[280px]">
                            {mapping.levelConfigs.map((lvl, idx) => (
                              <div
                                key={idx}
                                className={`p-1.5 rounded-lg border flex items-center justify-between gap-2 ${
                                  lvl.active
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-slate-100/60 border-slate-200 opacity-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                                    {lvl.level}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-800">
                                    {lvl.levelName}:
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-900">
                                    Mean = {lvl.targetMean}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-600">
                                    ± {lvl.targetSD}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold px-1 rounded bg-slate-200 text-slate-700">
                                    CV {lvl.targetCV}%
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleOpenEditMeanSdForLevel(mapping, lvl)}
                                  className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold hover:underline px-1.5 py-0.5 rounded hover:bg-indigo-50 cursor-pointer flex items-center gap-1"
                                  title="Sửa Mean & SD có lưu vết ISO 15189"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Sửa Mean/SD</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {mapping.active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Áp dụng
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Tạm dừng
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingMapping(mapping);
                                setIsMappingModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa cấu hình Mapping"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa mapping kiểm chuẩn cho xét nghiệm [${mapping.assayId}] trên máy [${mapping.instrumentId}]?`)) {
                                  onDeleteMapping(mapping.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Xóa cấu hình mapping"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMappings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Không tìm thấy cấu hình Map kiểm chuẩn nào phù hợp. Bấm &quot;Map Mới&quot; để thiết lập.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: VẬT LIỆU QC (TÁCH RIÊNG ĐỘC LẬP)                   */}
      {/* ======================================================== */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs text-teal-950">
                <h4 className="font-bold text-sm">
                  Danh Mục Vật Liệu QC (Huyết Thanh / Mẫu Kiểm Chuẩn)
                </h4>
                <p className="text-teal-800 mt-0.5">
                  Khai báo thông tin nhà sản xuất, số Lô, hạn dùng và các mức nồng độ. <strong>Một vật liệu QC có thể dùng cho nhiều xét nghiệm khác nhau</strong> mà không cần phải khai báo lại từng xét nghiệm.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setIsMaterialModalOpen(true);
              }}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Vật Liệu QC</span>
            </button>
          </div>

          {/* Materials Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map(mat => {
              // Tìm các xét nghiệm đang sử dụng vật liệu này
              const mappedAssays = qcMappings.filter(m => m.materialId === mat.id);

              return (
                <div key={mat.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                          QC
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs line-clamp-1" title={mat.name}>
                            {mat.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">
                            {mat.code || mat.id}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mat.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {mat.active ? 'Đang dùng' : 'Tạm dừng'}
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hãng sản xuất:</span>
                        <strong className="text-slate-800 text-right line-clamp-1">{mat.manufacturer}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Số Lô (Lot No):</span>
                        <strong className="text-slate-900 font-mono">{mat.lotNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hạn dùng (Exp):</span>
                        <strong className="text-rose-700 font-mono">{mat.expDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nền mẫu:</span>
                        <span className="font-semibold text-slate-700">{mat.matrix}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bảo quản:</span>
                        <span className="text-slate-700 text-[11px]">{mat.storageCondition}</span>
                      </div>
                    </div>

                    {/* Mức nồng độ */}
                    <div className="mt-2.5">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Các mức nồng độ ({mat.levels?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {mat.levels?.map((lvl, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-medium">
                            {lvl.levelName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Danh sách xét nghiệm đang dùng */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Xét nghiệm đang map ({mappedAssays.length}):
                      </span>
                      {mappedAssays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {mappedAssays.map((m, idx) => {
                            const a = assays.find(x => x.id === m.assayId);
                            return (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-mono font-semibold">
                                {m.instrumentId}: {a?.code || m.assayId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa map xét nghiệm nào</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingMaterial(mat);
                        setIsMaterialModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh Sửa</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa vật liệu QC [${mat.name}]?`)) {
                          onDeleteMaterial(mat.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Xóa vật liệu QC"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DANH MỤC XÉT NGHIỆM                                */}
      {/* ======================================================== */}
      {activeTab === 'assays' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên xét nghiệm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingAssay(null);
                setIsAssayModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Xét Nghiệm</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã Xét Nghiệm</th>
                  <th className="py-3 px-4">Tên Chỉ Số Xét Nghiệm</th>
                  <th className="py-3 px-4">Thiết Bị</th>
                  <th className="py-3 px-4">Đơn Vị Đo</th>
                  <th className="py-3 px-4">Phương Pháp</th>
                  <th className="py-3 px-4">TEa Cho Phép (%)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredAssays.map(assay => (
                  <tr key={assay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{assay.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{assay.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                        {assay.instrumentId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{assay.unit}</td>
                    <td className="py-3 px-4 text-slate-500">{assay.method}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{assay.cliaTeaPercent}%</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingAssay(assay);
                            setIsAssayModalOpen(true);
                          }}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: DANH MỤC THIẾT BỊ                                  */}
      {/* ======================================================== */}
      {activeTab === 'instruments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredInstruments.map(inst => (
              <div key={inst.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-mono font-bold flex items-center justify-center text-xs">
                      {inst.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{inst.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{inst.code}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {inst.status}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hãng SX:</span>
                    <strong className="text-slate-800">{inst.manufacturer}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khoa phòng:</span>
                    <span className="text-slate-700">{inst.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kết nối:</span>
                    <span className="font-mono text-[11px] text-slate-800">{inst.connectionType} ({inst.port})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giao thức:</span>
                    <span className="font-mono text-[11px] text-indigo-700">{inst.protocol}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setEditingInstrument(inst);
                      setIsInstrumentModalOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa thiết bị [${inst.name}]?`)) {
                        onDeleteInstrument(inst.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: LƯU VẾT MEAN/SD (ISO 15189)                        */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <History className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <h4 className="font-bold text-sm">
                Sổ Lưu Vết Lịch Sử Thay Đổi Mean & SD (Audit Trail - ISO 15189 Mục 7.3.7)
              </h4>
              <p className="mt-0.5 text-slate-600">
                Toàn bộ các lần thay đổi giá trị Mean và SD mục tiêu đều được hệ thống ghi nhận tự động bất biến, kèm danh mục nguyên nhân, người thay đổi và người phê duyệt chuyên môn.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Xét Nghiệm & Lô</th>
                  <th className="py-3 px-4">Người Thực Hiện & Duyệt</th>
                  <th className="py-3 px-4">Giá Trị Cũ $\rightarrow$ Mới</th>
                  <th className="py-3 px-4">Lý Do / Căn Cứ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {meanSdAuditHistory.map(rec => (
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
                          ✓ Duyệt bởi: {rec.approvedBy}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs">
                        Mean: <span className="line-through text-slate-400">{rec.oldMean}</span> $\rightarrow$ <strong className="text-emerald-700">{rec.newMean}</strong>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        SD: {rec.oldSD} $\rightarrow$ <strong>{rec.newSD}</strong> (CV {rec.newCV}%)
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 mb-1">
                        {rec.reasonCategory}
                      </span>
                      <p className="text-xs text-slate-700 line-clamp-2">{rec.reason}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: NGƯỜI DÙNG & PHÂN QUYỀN                           */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {u.name.split(' ').pop()?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{u.name}</h4>
                      <span className="text-[11px] font-mono text-slate-500">@{u.username}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {u.active ? 'Hoạt động' : 'Khóa'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chức vụ / Vai trò:</span>
                    <strong className="text-slate-800">{u.roleTitle}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã NV:</span>
                    <span className="font-mono text-slate-700">{u.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khoa phòng:</span>
                    <span className="text-slate-700">{u.department}</span>
                  </div>
                </div>

                {/* Quyền hạn */}
                <div className="text-[10px] space-y-1 pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-600 block">Quyền được cấp:</span>
                  <div className="flex flex-wrap gap-1">
                    {u.permissions?.canInputQC && <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">Nhập QC</span>}
                    {u.permissions?.canEditMeanSD && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">Sửa Mean/SD</span>}
                    {u.permissions?.canApproveCapa && <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">Duyệt CAPA</span>}
                    {u.permissions?.canManageConfig && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Cấu hình</span>}
                    {u.permissions?.canExportReports && <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">Xuất BC</span>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setIsUserModalOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Phân Quyền</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa tài khoản [${u.name}]?`)) {
                        onDeleteUser(u.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: THÔNG TIN PHÒNG XÉT NGHIỆM (LAB INFO)              */}
      {/* ======================================================== */}
      {activeTab === 'labInfo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold">
                    {labInfo.hospitalName} · {labInfo.name}
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {labInfo.accreditationStandard}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Mã cơ sở: <span className="font-mono font-bold text-white">{labInfo.labCode}</span> · {labInfo.department}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{labInfo.address}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLabInfoModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all shrink-0 cursor-pointer self-start md:self-auto"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Thông Tin</span>
            </button>
          </div>

          {/* 4 Detail Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Cơ Sở & Đơn Vị */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-indigo-600" />
                  <span>Đơn Vị & Cơ Sở Xét Nghiệm</span>
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {labInfo.labCode}
                </span>
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Đơn vị chủ quản / Bệnh viện:</span>
                  <span className="font-bold text-slate-900 text-sm">{labInfo.hospitalName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tên phòng xét nghiệm:</span>
                  <span className="font-semibold text-slate-800">{labInfo.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Khoa / Phân khoa chuyên môn:</span>
                  <span className="text-slate-700">{labInfo.department}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Địa Chỉ & Liên Hệ */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Địa Chỉ Cơ Sở & Kênh Liên Hệ</span>
                </h4>
                <Phone className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Địa chỉ trụ sở khoa:</span>
                  <span className="text-slate-800 font-medium">{labInfo.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại / Hotline:</span>
                    <span className="font-mono font-bold text-indigo-950">{labInfo.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email liên hệ:</span>
                    <span className="font-mono text-slate-700">{labInfo.email || 'Chưa cấu hình'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Website tra cứu:</span>
                  <span className="font-mono text-indigo-600 truncate block">
                    {labInfo.website || 'Chưa cấu hình'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Nhân Sự Phê Duyệt ISO 15189 */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>Lãnh Đạo & Nhân Sự Phê Duyệt Hồ Sơ</span>
                </h4>
                <Award className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xs space-y-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Trưởng Khoa Xét Nghiệm</span>
                  <span className="font-bold text-slate-900 text-sm block">{labInfo.headOfDepartment}</span>
                  <span className="text-[11px] text-slate-500">{labInfo.headTitle}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Phụ Trách Kỹ Thuật & QLCL QC</span>
                  <span className="font-bold text-slate-900 text-sm block">{labInfo.technicalSupervisor}</span>
                  <span className="text-[11px] text-slate-500">{labInfo.supervisorTitle}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Tiêu Chuẩn & Mẫu Báo Cáo */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Tiêu Chuẩn & Biểu Mẫu Báo Cáo QC</span>
                </h4>
                <FileText className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Tiêu chuẩn quản lý chất lượng:</span>
                  <span className="font-bold text-slate-900">{labInfo.accreditationStandard}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tiền tố mã biểu mẫu hồ sơ:</span>
                  <span className="font-mono font-bold text-indigo-700">{labInfo.documentCodePrefix}</span>
                </div>
                {labInfo.slogan && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Khẩu hiệu / Tiêu chí chất lượng:</span>
                    <span className="italic text-slate-700">"{labInfo.slogan}"</span>
                  </div>
                )}
                {labInfo.notes && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ghi chú chất lượng:</span>
                    <span className="text-slate-600">{labInfo.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simulation Preview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Xem Trước Mẫu Tiêu Đề Báo Cáo In / Xuất PDF (ISO 15189)
                </h4>
              </div>
              <button
                onClick={() => setIsLabInfoModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa Tiêu Đề Này</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4 font-sans">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {labInfo.hospitalName} · {labInfo.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {labInfo.department}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Đ/C: {labInfo.address} · Hotline: {labInfo.phone}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Mã biểu mẫu: {labInfo.documentCodePrefix}-GLU-2026 · Mã CS: {labInfo.labCode}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block border border-slate-900 text-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white">
                    {labInfo.accreditationStandard}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="text-center pt-2">
                <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">
                  BÁO CÁO TỔNG HỢP VÀ ĐÁNH GIÁ NỘI KIỂM CHẤT LƯỢNG (IQC)
                </h3>
                {labInfo.slogan && (
                  <p className="text-[11px] italic text-slate-500 mt-0.5">
                    "{labInfo.slogan}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[11px]">
                <div className="space-y-8">
                  <div>
                    <p className="font-bold text-slate-800 uppercase">Kỹ Thuật Viên</p>
                    <p className="text-[10px] text-slate-500">(Ký & ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">KTV. Trần Quốc Tuấn</p>
                    <p className="text-[10px] text-slate-500 font-mono">KTV-082</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="font-bold text-slate-800 uppercase">Phụ Trách Quản Lý QC</p>
                    <p className="text-[10px] text-slate-500">({labInfo.supervisorTitle || 'Ký & ghi rõ họ tên'})</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{labInfo.technicalSupervisor}</p>
                    <p className="text-[10px] text-slate-500 font-mono">QLCL-ISO15189</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="font-bold text-slate-800 uppercase">Trưởng Khoa Xét Nghiệm</p>
                    <p className="text-[10px] text-slate-500">({labInfo.headTitle || 'Phê duyệt & Đóng dấu'})</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{labInfo.headOfDepartment}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{labInfo.labCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}
      {/* Modal Vật Liệu QC */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSave={onSaveMaterial}
        material={editingMaterial}
      />

      {/* Modal Map Kiểm Chuẩn */}
      <MappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        onSave={onSaveMapping}
        mapping={editingMapping}
        instruments={instruments}
        assays={assays}
        materials={materials}
      />

      {/* Modal Sửa Mean/SD ISO 15189 */}
      {editingLotForMeanSd && (
        <EditMeanSdModal
          isOpen={true}
          onClose={() => setEditingLotForMeanSd(null)}
          lot={editingLotForMeanSd}
          currentUser={currentUser}
          onSave={handleSaveMeanSdResult}
        />
      )}

      {/* Modal Xét Nghiệm */}
      <AssayModal
        isOpen={isAssayModalOpen}
        onClose={() => setIsAssayModalOpen(false)}
        onSave={onSaveAssay}
        assayToEdit={editingAssay}
        instruments={instruments}
      />

      {/* Modal Thiết Bị */}
      <InstrumentModal
        isOpen={isInstrumentModalOpen}
        onClose={() => setIsInstrumentModalOpen(false)}
        onSave={onSaveInstrument}
        instrumentToEdit={editingInstrument}
      />

      {/* Modal Người Dùng */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={onSaveUser}
        userToEdit={editingUser}
      />

      {/* Modal Chỉnh Sửa Thông Tin Phòng Xét Nghiệm */}
      <LabInfoModal
        isOpen={isLabInfoModalOpen}
        onClose={() => setIsLabInfoModalOpen(false)}
        labInfo={labInfo}
        onSaveLabInfo={onSaveLabInfo}
      />
    </div>
  );
};
