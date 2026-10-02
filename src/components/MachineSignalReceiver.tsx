import React, { useState, useEffect } from 'react';
import { Instrument, InstrumentId, QCLevel, QCLot, QCResult, TestAssay, UserProfile } from '../types/qc';
import { generateSimulatedSignal, parseIncomingMachineSignal } from '../utils/astmParser';
import { calculateZScore, evaluateWestgard } from '../utils/westgard';
import { 
  Radio, 
  Cpu, 
  Terminal, 
  Play, 
  Pause, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ArrowRight, 
  Server,
  Zap
} from 'lucide-react';

interface MachineSignalReceiverProps {
  instruments: Instrument[];
  assays: TestAssay[];
  lots: QCLot[];
  currentUser: UserProfile;
  onNewQCResult: (result: QCResult) => void;
  onOpenChart: (assayId: string) => void;
  onOpenCapa: (result: QCResult) => void;
}

export const MachineSignalReceiver: React.FC<MachineSignalReceiverProps> = ({
  instruments,
  assays,
  lots,
  currentUser,
  onNewQCResult,
  onOpenChart,
  onOpenCapa,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<InstrumentId>('AU400');
  const [isListening, setIsListening] = useState<boolean>(true);
  const [selectedAssayId, setSelectedAssayId] = useState<string>('AU_GLU');
  const [selectedLevel, setSelectedLevel] = useState<QCLevel>('level1');
  const [testMode, setTestMode] = useState<'normal' | 'trigger_1_3s' | 'trigger_2_2s' | 'random'>('normal');
  const [terminalLogs, setTerminalLogs] = useState<Array<{
    id: string;
    timestamp: string;
    type: 'FRAME' | 'PARSED' | 'ALERT' | 'INFO';
    message: string;
  }>>([
    {
      id: 'log_0',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type: 'INFO',
      message: 'Cổng giao tiếp LIS Driver đã sẵn sàng. Đang lắng nghe trên COM1 (AU400), TCP 5000 (Sysmex 800), Port 2575 (Cobas e411).',
    },
  ]);
  const [lastReceivedResult, setLastReceivedResult] = useState<QCResult | null>(null);

  // Danh mục xét nghiệm thuộc máy đang chọn
  const currentAssays = assays.filter((a) => a.instrumentId === selectedInstId);
  const currentInst = instruments.find((i) => i.id === selectedInstId) || instruments[0];

  // Tự động cập nhật assay đã chọn khi đổi máy
  useEffect(() => {
    if (currentAssays.length > 0 && !currentAssays.some((a) => a.id === selectedAssayId)) {
      setSelectedAssayId(currentAssays[0].id);
    }
  }, [selectedInstId, currentAssays, selectedAssayId]);

  // Ghi nhật ký vào terminal
  const addLog = (type: 'FRAME' | 'PARSED' | 'ALERT' | 'INFO', message: string) => {
    setTerminalLogs((prev) => [
      {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        type,
        message,
      },
      ...prev.slice(0, 40),
    ]);
  };

  // Hàm xử lý khi nhận tín hiệu (thực tế hoặc mô phỏng)
  const processIncomingFrame = (rawFrame: string, instId: InstrumentId) => {
    addLog('FRAME', `[${instId}] Nhận gói tin thô:\n${rawFrame}`);

    const parsed = parseIncomingMachineSignal(rawFrame, instId);
    if (!parsed) {
      addLog('ALERT', `[${instId}] Không thể giải mã gói tin. Vui lòng kiểm tra checksum và chuẩn giao thức ASTM/HL7.`);
      return;
    }

    // Tìm xét nghiệm và lô tương ứng
    const targetAssay = assays.find((a) => a.instrumentId === instId && a.code.toUpperCase() === parsed.assayCode.toUpperCase()) || assays.find(a => a.id === selectedAssayId);
    if (!targetAssay) {
      addLog('ALERT', `[${instId}] Không tìm thấy cấu hình danh mục xét nghiệm cho mã: ${parsed.assayCode}`);
      return;
    }

    const targetLot = lots.find((l) => l.assayId === targetAssay.id && l.level === parsed.level && l.active) || lots.find((l) => l.assayId === targetAssay.id);
    if (!targetLot) {
      addLog('ALERT', `[${instId}] Không có Lô QC hoạt động cho xét nghiệm ${targetAssay.name} mức ${parsed.level}`);
      return;
    }

    // Tính SDI và đánh giá Westgard
    const z = calculateZScore(parsed.value, targetLot.targetMean, targetLot.targetSD);
    // Lấy kết quả lịch sử tạm
    const evalResult = evaluateWestgard(parsed.value, z, targetLot, []);

    const newResult: QCResult = {
      id: `qc_live_${Date.now()}`,
      assayId: targetAssay.id,
      lotId: targetLot.id,
      instrumentId: instId,
      level: parsed.level,
      timestamp: new Date().toISOString(),
      shift: 'SÁNG',
      value: parsed.value,
      zScore: z,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      source: 'MÁY_XÉT_NGHIỆM_LIS',
      rawSignal: rawFrame,
      status: evalResult.status,
      violations: evalResult.violations,
      syncStatus: 'SYNCED',
    };

    onNewQCResult(newResult);
    setLastReceivedResult(newResult);

    if (evalResult.status === 'REJECTED') {
      addLog(
        'ALERT',
        `[CẢNH BÁO NGUY HIỂM] ${targetAssay.name}: ${parsed.value} ${parsed.unit} (SDI: ${z > 0 ? '+' : ''}${z} SD) VI PHẠM TỪ CHỐI ${evalResult.violations.map(v => v.ruleName).join(', ')}!`
      );
    } else if (evalResult.status === 'WARNING') {
      addLog(
        'ALERT',
        `[CẢNH BÁO THEO DÕI] ${targetAssay.name}: ${parsed.value} ${parsed.unit} (SDI: ${z > 0 ? '+' : ''}${z} SD) Cảnh báo 1-2s.`
      );
    } else {
      addLog(
        'PARSED',
        `[ĐẠT KIỂM SOÁT] ${targetAssay.name}: ${parsed.value} ${parsed.unit} (SDI: ${z > 0 ? '+' : ''}${z} SD). Đạt chuẩn ISO 15189.`
      );
    }
  };

  // Nút gửi mô phỏng thủ công
  const handleSendTestTransmission = () => {
    const assay = assays.find((a) => a.id === selectedAssayId) || currentAssays[0];
    const lot = lots.find((l) => l.assayId === assay.id && l.level === selectedLevel) || lots[0];

    let val = lot.targetMean;
    if (testMode === 'normal') {
      // Dao động bình thường trong ±0.8 SD
      const deltaZ = (Math.random() * 1.6 - 0.8);
      val = Number((lot.targetMean + deltaZ * lot.targetSD).toFixed(assay.decimalPlaces));
    } else if (testMode === 'trigger_1_3s') {
      // Cố tình đẩy SDI vượt +3.2SD để kiểm tra cảnh báo Westgard 1-3s
      val = Number((lot.targetMean + 3.25 * lot.targetSD).toFixed(assay.decimalPlaces));
    } else if (testMode === 'trigger_2_2s') {
      // Cố tình đẩy SDI vượt -2.3SD
      val = Number((lot.targetMean - 2.35 * lot.targetSD).toFixed(assay.decimalPlaces));
    } else {
      const deltaZ = (Math.random() * 5.0 - 2.5);
      val = Number((lot.targetMean + deltaZ * lot.targetSD).toFixed(assay.decimalPlaces));
    }

    const frame = generateSimulatedSignal(selectedInstId, assay.code, selectedLevel, val, assay.unit);
    processIncomingFrame(frame, selectedInstId);
  };

  // Chế độ lắng nghe tự động (Auto Listening Generator)
  useEffect(() => {
    if (!isListening) return;

    // Ngẫu nhiên phát tín hiệu từ 1 trong 3 máy mỗi 35 giây khi bật chế độ lắng nghe
    const interval = setInterval(() => {
      const randomInst = instruments[Math.floor(Math.random() * instruments.length)];
      const instAssays = assays.filter((a) => a.instrumentId === randomInst.id);
      if (instAssays.length === 0) return;
      const targetAssay = instAssays[Math.floor(Math.random() * instAssays.length)];
      const targetLot = lots.find((l) => l.assayId === targetAssay.id && l.active) || lots[0];

      // Thỉnh thoảng tạo ca bình thường
      const deltaZ = (Math.random() * 1.8 - 0.9);
      const val = Number((targetLot.targetMean + deltaZ * targetLot.targetSD).toFixed(targetAssay.decimalPlaces));

      const frame = generateSimulatedSignal(randomInst.id, targetAssay.code, targetLot.level, val, targetAssay.unit);
      processIncomingFrame(frame, randomInst.id);
    }, 45000);

    return () => clearInterval(interval);
  }, [isListening, instruments, assays, lots]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Instrument Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {instruments.map((inst) => {
          const isSelected = inst.id === selectedInstId;
          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInstId(inst.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-600 bg-white ring-2 ring-cyan-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    inst.id === 'AU400' ? 'bg-amber-100 text-amber-700' :
                    inst.id === 'SYSMEX800' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{inst.code}</h4>
                    <p className="text-xs text-slate-500 font-mono">{inst.protocol}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {inst.status}
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-700 font-medium">
                {inst.name}
              </div>

              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                <span>Cổng: {inst.port}</span>
                <span>{inst.department}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Split Console: Signal Sender & Raw Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Signal Sender & Control (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Điều Khiển Giao Diện Tín Hiệu: {currentInst.code}
              </h3>
            </div>
            {/* Auto Listen Toggle */}
            <button
              onClick={() => setIsListening(!isListening)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                isListening
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Đang Lắng Nghe (Auto)</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Tạm dừng</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn Xét Nghiệm Gửi Tín Hiệu:
              </label>
              <select
                value={selectedAssayId}
                onChange={(e) => setSelectedAssayId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-cyan-500"
              >
                {currentAssays.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name} ({a.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mức Nồng Độ (QC Level):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLevel('level1')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                    selectedLevel === 'level1'
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Mức 1 (Bình thường)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLevel('level2')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors ${
                    selectedLevel === 'level2'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Mức 2 (Bệnh lý cao)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chế Độ Thử Nghiệm Westgard:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="testMode"
                    value="normal"
                    checked={testMode === 'normal'}
                    onChange={() => setTestMode('normal')}
                    className="text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block">Ca Bình Thường (In-Control)</span>
                    <span className="text-[11px] text-slate-500">Giá trị nằm trong khoảng an toàn ±0.8 SD của Mean.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-lg border border-rose-200 bg-rose-50/30 hover:bg-rose-50/60">
                  <input
                    type="radio"
                    name="testMode"
                    value="trigger_1_3s"
                    checked={testMode === 'trigger_1_3s'}
                    onChange={() => setTestMode('trigger_1_3s')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-semibold text-rose-800 block">Kích Hoạt Lỗi 1-3s (Từ chối / Reject)</span>
                    <span className="text-[11px] text-slate-500">Cố tình phát giá trị lệch {'>'} +3.2SD để kiểm chứng chuông báo và dừng LIS.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-lg border border-amber-200 bg-amber-50/30 hover:bg-amber-50/60">
                  <input
                    type="radio"
                    name="testMode"
                    value="trigger_2_2s"
                    checked={testMode === 'trigger_2_2s'}
                    onChange={() => setTestMode('trigger_2_2s')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-semibold text-amber-800 block">Kích Hoạt Cảnh Báo Lỗi 2-2s / 1-2s</span>
                    <span className="text-[11px] text-slate-500">Cố tình phát giá trị lệch ngoài ±2.3SD.</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleSendTestTransmission}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Phát Tín Hiệu Thử Nghiệm Từ Máy {currentInst.code}</span>
            </button>
          </div>

          {/* Last Received Result Card */}
          {lastReceivedResult && (
            <div className={`mt-4 p-3 rounded-lg border text-xs ${
              lastReceivedResult.status === 'REJECTED'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : lastReceivedResult.status === 'WARNING'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {lastReceivedResult.status === 'REJECTED' ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  <span>Lần chạy gần nhất vừa nạp thành công</span>
                </span>
                <span className="font-mono">{new Date(lastReceivedResult.timestamp).toLocaleTimeString('vi-VN')}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-sm font-bold">{lastReceivedResult.value}</span>
                <span>SDI: {lastReceivedResult.zScore > 0 ? `+${lastReceivedResult.zScore}` : lastReceivedResult.zScore} SD</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <button
                  onClick={() => onOpenChart(lastReceivedResult.assayId)}
                  className="text-[11px] underline font-medium hover:text-slate-900 flex items-center gap-1"
                >
                  <span>Xem trên biểu đồ L-J</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                {lastReceivedResult.status === 'REJECTED' && !lastReceivedResult.capa && (
                  <button
                    onClick={() => onOpenCapa(lastReceivedResult)}
                    className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-300 hover:bg-rose-100"
                  >
                    Lập hồ sơ CAPA ngay
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Terminal Telemetry Stream (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-4 font-mono text-xs flex flex-col h-[520px] shadow-lg">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">
                Nhật Ký Tín Hiệu Thô Cổng LIS (ASTM E1381 / HL7 Receiver)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400">Trạng thái: 9600 8-N-1 STREAM</span>
              <button
                onClick={() => setTerminalLogs([])}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Xóa màn hình
              </button>
            </div>
          </div>

          {/* Terminal Scroll Stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 select-text">
            {terminalLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-12">
                Chưa có tín hiệu mới. Hãy bấm "Phát Tín Hiệu Thử Nghiệm" hoặc chờ máy tự động truyền dữ liệu...
              </div>
            ) : (
              terminalLogs.map((log) => {
                let badgeColor = 'text-slate-400';
                if (log.type === 'ALERT') badgeColor = 'text-rose-400 font-bold';
                if (log.type === 'PARSED') badgeColor = 'text-emerald-400';
                if (log.type === 'FRAME') badgeColor = 'text-cyan-400';

                return (
                  <div key={log.id} className="border-b border-slate-900/80 pb-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>[{log.timestamp}]</span>
                      <span className={`uppercase ${badgeColor}`}>[{log.type}]</span>
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      {log.message}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
