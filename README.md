# IQC by ThinhXu - Hệ Thống Quản Lý Nội Kiểm Xét Nghiệm Y Khoa (ISO 15189)

Ứng dụng quản lý chất lượng nội kiểm (IQC - Internal Quality Control) xét nghiệm y khoa thông minh, biểu đồ Levey-Jennings gộp đa mức nồng độ, bộ máy cảnh báo tự động quy tắc Westgard, kết nối tín hiệu máy phân tích LIS, xuất báo cáo định kỳ A4 chuẩn ISO 15189, phân quyền người dùng và sao lưu dự phòng.

---

## 🌟 Tính Năng Nổi Bật

### 1. Biểu Đồ Levey-Jennings Gộp Chung 1 Trục (Multi-Level Normalization)
- **Chuẩn hóa trục tung Y theo SDI (Z-Score)**:
  - $\text{Mean} (0\text{SD})$
  - $\pm 1\text{SD}$ (Vùng trong kiểm soát)
  - $\pm 2\text{SD}$ (Ngưỡng cảnh báo - Warning Limits)
  - $\pm 3\text{SD}$ (Ngưỡng từ chối - Reject Limits)
- **Biểu diễn riêng biệt từng mức nồng độ trên cùng 1 trục**:
  - **Mức 1 (Bình thường / Level 1)**: Đường xanh Cyan (`#0284c7`), điểm đo tròn (`●`).
  - **Mức 2 (Bệnh lý cao / Level 2)**: Đường tím Indigo (`#7c3aed`), điểm đo hình thoi xoay 45° (`◆`).
  - **Mức 3 (Level 3 nếu có)**: Đường xanh lá Emerald (`#059669`).
- **Phát hiện lỗi liên mức $R\text{-}4s$ tức thì**: Nhận diện ngay khi khoảng cách giữa 2 mức cùng ca vượt $\ge 4\text{SD}$.
- **Tùy chọn khoảng thời gian linh hoạt**: 7 ngày qua, 15 ngày qua, 30 ngày qua, Tháng này, Tháng trước, hoặc Tùy chọn khoảng ngày cụ thể (Từ ngày - Đến ngày).

### 2. Bộ Máy Cảnh Báo Quy Tắc Westgard Tự Động
- Tự động đánh giá theo thời gian thực:
  - **1-2s**: Cảnh báo (Warning) khi 1 điểm vượt ngoài $\pm 2\text{SD}$.
  - **1-3s**: Từ chối (Reject - Lỗi ngẫu nhiên) khi 1 điểm vượt ngoài $\pm 3\text{SD}$.
  - **2-2s**: Từ chối (Reject - Lỗi hệ thống) khi 2 điểm liên tiếp cùng phía vượt ngoài $\pm 2\text{SD}$.
  - **R-4s**: Từ chối (Reject - Lỗi ngẫu nhiên) khi chênh lệch giữa 2 điểm liên tiếp hoặc giữa 2 mức $\ge 4\text{SD}$.
  - **4-1s**: Từ chối (Reject - Lỗi trôi chuẩn) khi 4 điểm liên tiếp vượt $\pm 1\text{SD}$ về cùng một phía.
  - **10-x**: Từ chối (Reject - Dịch chuyển hệ thống / Shift) khi 10 điểm liên tiếp cùng nằm về một phía của Mean.
  - **7-T**: Cảnh báo xu hướng (Trend) khi 7 điểm tăng hoặc giảm liên tục.
- **Hồ sơ xử lý sự cố CAPA**: Phân tích nguyên nhân gốc rễ, hành động khắc phục, kết quả chạy lại kiểm chứng và ký duyệt thẩm định.

### 3. Interface Nhận Tín Hiệu Máy Xét Nghiệm LIS
- **Beckman Coulter AU400**: Chuẩn giao thức ASTM E1381/E1394 (COM1 / RS-232).
- **Sysmex 800 Series (KX/XP)**: Giao thức truyền số liệu huyết học qua TCP/IP Socket (Port 5000).
- **Roche Cobas e411**: Giao thức HL7 v2.5 (Port 2575).
- Màn hình Terminal thời gian thực hiển thị chuỗi tín hiệu thô, tự động bóc tách kết quả nạp vào cơ sở dữ liệu và kích hoạt cảnh báo khi phát hiện lỗi.

### 4. Xuất Báo Cáo Định Kỳ Định Dạng PDF Chuẩn ISO 15189 (Khổ A4)
- Chọn linh hoạt khoảng thời gian xuất báo cáo: Tháng này, Tháng trước, 30 ngày qua, Quý này hoặc Tùy chọn khoảng ngày.
- Bảng thống kê chi tiết: Số lượt chạy, Mean thực tế vs Mục tiêu, SD thực tế, CV% thực tế, SDI, %Bias, Six Sigma Metric ($\sigma$).
- Nhúng biểu đồ Levey-Jennings vector gộp đa mức nồng độ trực tiếp trong tài liệu in.
- Bảng nhật ký xử lý vi phạm Westgard & hồ sơ CAPA trong kỳ.
- Phân vùng 3 chữ ký thẩm định: Kỹ thuật viên, Quản lý chất lượng, Trưởng khoa.

### 5. Phân Quyền Người Dùng (RBAC) & Nhật Ký Kiểm Toán (Audit Trail)
- 4 vai trò y tế tiêu chuẩn: Trưởng khoa xét nghiệm, Quản lý chất lượng QC, Kỹ thuật viên, Chuyên viên kiểm toán ISO.
- Ghi vết bất biến toàn bộ hoạt động trong hệ thống theo yêu cầu bảo mật thông tin ISO 15189.

### 6. Lưu Trữ Ngoại Tuyến (Offline-First) & Sao Lưu Dự Phòng
- Lưu trữ cục bộ bảo đảm công việc không gián đoạn khi mất mạng bệnh viện.
- Tự động nhận diện mạng và đồng bộ lên đám mây khi có kết nối lại.
- Tính năng xuất file sao lưu JSON (Backup) và nạp phục hồi (Restore) có mã hash kiểm tra toàn vẹn.

---

## 🛠️ Cài Đặt & Khởi Chạy Dự Án

### Yêu cầu:
- Node.js 18+ hoặc 20+
- npm hoặc yarn / bun

### Các bước cài đặt:
```bash
# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy môi trường phát triển (Dev server port 3000)
npm run dev

# Xây dựng bản phân phối sản xuất (Production Build)
npm run build
```

---

## 📦 Hướng Dẫn Đẩy Lên GitHub (`thinhxuqb/IQC.new`)

Kho mã nguồn đã được khởi tạo và commit đầy đủ trên nhánh `main`. Để đẩy lên tài khoản GitHub của bạn:

```bash
# Cách 1: Sử dụng GitHub Personal Access Token (PAT)
git push https://<YOUR_GITHUB_TOKEN>@github.com/thinhxuqb/IQC.new.git main

# Cách 2: Sử dụng SSH (nếu đã cấu hình SSH key trên GitHub)
git remote set-url origin git@github.com:thinhxuqb/IQC.new.git
git push -u origin main
```
