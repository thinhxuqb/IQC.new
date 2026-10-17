import React, { useState } from 'react';
import { LabInfo } from '../types/qc';
import { DEFAULT_LAB_INFO } from '../utils/initialData';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  UserCheck, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  FileText,
  Hospital,
  Sparkles
} from 'lucide-react';

interface LabInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  labInfo: LabInfo;
  onSaveLabInfo: (info: LabInfo) => void;
}

export const LabInfoModal: React.FC<LabInfoModalProps> = ({
  isOpen,
  onClose,
  labInfo,
  onSaveLabInfo,
}) => {
  const [formData, setFormData] = useState<LabInfo>({ ...labInfo });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'preview'>('form');

  if (!isOpen) return null;

  const handleChange = (field: keyof LabInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLabInfo(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    setFormData({ ...DEFAULT_LAB_INFO });
    setSavedSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Cấu Hình Thông Tin Phòng Xét Nghiệm</span>
              </h3>
              <p className="text-xs text-slate-300">
                Tùy chỉnh tên bệnh viện, phòng xét nghiệm, địa chỉ, hotline và nhân sự phê duyệt báo cáo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('form')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  activeSubTab === 'form' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chỉnh Sửa
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  activeSubTab === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Xem Trước Tiêu Đề
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved Success Toast inside modal */}
        {savedSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in slide-in-from-top">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã cập nhật và lưu trữ thông tin phòng xét nghiệm thành công! Dữ liệu đã đồng bộ sang biểu mẫu báo cáo.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSubTab === 'form' ? (
            <form id="lab-info-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Đơn Vị & Cơ Sở */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  <Hospital className="w-4 h-4 text-indigo-600" />
                  <span>1. Đơn Vị Chủ Quản & Tên Phòng Xét Nghiệm</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Bệnh Viện / Đơn Vị Chủ Quản <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.hospitalName}
                      onChange={(e) => handleChange('hospitalName', e.target.value)}
                      placeholder="vd: Bệnh Viện Đa Khoa Trung Tâm"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Cơ Sở / Phòng Xét Nghiệm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="vd: Khoa Xét Nghiệm Trung Tâm"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khoa / Bộ Phận Chuyên Môn
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="vd: Khoa Hóa Sinh - Huyết Học - Miễn Dịch"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Phòng Xét Nghiệm (Lab ID / Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.labCode}
                      onChange={(e) => handleChange('labCode', e.target.value)}
                      placeholder="vd: LAB-QC-HCM"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-indigo-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Địa Chỉ & Thông Tin Liên Hệ */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>2. Địa Chỉ Cơ Sở & Thông Tin Liên Hệ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa Chỉ Phòng Xét Nghiệm / Bệnh Viện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="vd: Số 120 Đường Y Học, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Điện Thoại / Đường Dây Nóng <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="vd: 028.3899.6688 - 0912.345.678"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Liên Hệ Khoa Xét Nghiệm
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="vd: xetnghiem@benhvientrungtam.vn"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Website / Cổng Tra Cứu Kết Quả
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="vd: https://benhvientrungtam.vn/khoa-xet-nghiem"
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Nhân Sự Phê Duyệt & Tiêu Chuẩn Ký Duyệt */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>3. Nhân Sự Phụ Trách & Phê Duyệt Hồ Sơ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ Tên Trưởng Khoa / Bác Sĩ Duyệt Chuyên Môn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.headOfDepartment}
                      onChange={(e) => handleChange('headOfDepartment', e.target.value)}
                      placeholder="vd: TS. BS. Nguyễn Văn Hùng"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chức Danh Trưởng Khoa (In trên chữ ký)
                    </label>
                    <input
                      type="text"
                      value={formData.headTitle}
                      onChange={(e) => handleChange('headTitle', e.target.value)}
                      placeholder="vd: Trưởng Khoa Xét Nghiệm / BS Duyệt Chuyên Môn"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phụ Trách Kỹ Thuật / Quản Lý Chất Lượng QC <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.technicalSupervisor}
                      onChange={(e) => handleChange('technicalSupervisor', e.target.value)}
                      placeholder="vd: ThS. Lê Thị Thanh Mai"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chức Danh Quản Lý Chất Lượng
                    </label>
                    <input
                      type="text"
                      value={formData.supervisorTitle}
                      onChange={(e) => handleChange('supervisorTitle', e.target.value)}
                      placeholder="vd: Kỹ Thuật Viên Trưởng / Quản Lý Chất Lượng QC"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Tiêu Chuẩn & Tiêu Ngữ Báo Cáo */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>4. Tiêu Chuẩn Đạt Chuẩn & Tiêu Đề Hồ Sơ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu Chuẩn Công Nhận Chất Lượng
                    </label>
                    <input
                      type="text"
                      value={formData.accreditationStandard}
                      onChange={(e) => handleChange('accreditationStandard', e.target.value)}
                      placeholder="vd: Tiêu Chuẩn Quản Lý Chất Lượng Xét Nghiệm"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiền Tố Mã Biểu Mẫu Báo Cáo QC
                    </label>
                    <input
                      type="text"
                      value={formData.documentCodePrefix}
                      onChange={(e) => handleChange('documentCodePrefix', e.target.value)}
                      placeholder="vd: QC-BM-LAB"
                      className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khẩu Hiệu / Tiêu Ngữ Chất Lượng
                    </label>
                    <input
                      type="text"
                      value={formData.slogan || ''}
                      onChange={(e) => handleChange('slogan', e.target.value)}
                      placeholder="vd: Chính xác · Kịp thời · Chuẩn mực · Tận tâm vì sức khỏe người bệnh"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white italic"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Tab Preview: Xem trước Letterhead */
            <div className="space-y-6">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Dưới đây là hình ảnh xem trước tiêu đề và phần ký duyệt sẽ xuất hiện trên <strong>Báo cáo tổng hợp nội kiểm QC</strong> khi in hoặc xuất PDF.
                </span>
              </div>

              {/* Sample Document Simulation */}
              <div className="bg-white border-2 border-slate-300 p-8 rounded-xl shadow-md space-y-6">
                {/* Header Preview */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                        {formData.hospitalName} · {formData.name}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        {formData.department}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Địa chỉ: {formData.address} · ĐT: {formData.phone}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Mã biểu mẫu: {formData.documentCodePrefix}-GLU-2026 · Mã cơ sở: {formData.labCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block border border-slate-900 text-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-50">
                        {formData.accreditationStandard}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Ngày in: {new Date().toLocaleDateString('vi-VN')}
                      </p>
                      {formData.website && (
                        <p className="text-[10px] text-indigo-700 font-mono">
                          {formData.website}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-6">
                    <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">
                      BÁO CÁO TỔNG HỢP VÀ ĐÁNH GIÁ NỘI KIỂM CHẤT LƯỢNG (IQC)
                    </h2>
                    {formData.slogan && (
                      <p className="text-[11px] italic text-slate-500 mt-0.5">
                        "{formData.slogan}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Sample Content Body Placeholder */}
                <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  (Dữ liệu thống kê nồng độ, biểu đồ Levey-Jennings và vi phạm Westgard sẽ hiển thị tại đây)
                </div>

                {/* Signature Preview */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="space-y-12">
                    <div>
                      <p className="font-bold text-slate-900 uppercase">Kỹ Thuật Viên Thực Hiện</p>
                      <p className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">KTV. Trần Quốc Tuấn</p>
                      <p className="text-[10px] text-slate-500 font-mono">KTV-082</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div>
                      <p className="font-bold text-slate-900 uppercase">Phụ Trách Quản Lý QC</p>
                      <p className="text-[10px] text-slate-500">({formData.supervisorTitle || 'Ký và ghi rõ họ tên'})</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{formData.technicalSupervisor}</p>
                      <p className="text-[10px] text-slate-500 font-mono">QLCL-QC</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div>
                      <p className="font-bold text-slate-900 uppercase">Trưởng Khoa Xét Nghiệm</p>
                      <p className="text-[10px] text-slate-500">({formData.headTitle || 'Phê duyệt & Đóng dấu'})</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{formData.headOfDepartment}</p>
                      <p className="text-[10px] text-slate-500 font-mono">TRUONGKHOA-001</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Mặc Định</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              form="lab-info-form"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin Phòng Xét Nghiệm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
