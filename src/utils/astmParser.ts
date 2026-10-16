/**
 * Giao thức phân tích & bộ giả lập nhận tín hiệu máy xét nghiệm LIS
 * Hỗ trợ AU400 (ASTM E1381/E1394), Sysmex 800 (Serial Protocol), Cobas e411 (HL7 v2.5)
 */

import { InstrumentId, QCLevel } from '../types/qc';

export interface ParsedSignalResult {
  instrumentId: InstrumentId;
  assayCode: string;
  value: number;
  unit: string;
  level: QCLevel;
  timestamp: string;
  rawSignal: string;
  protocolName: string;
}

/**
 * Sinh chuỗi tín hiệu thô mô phỏng từ máy xét nghiệm
 */
export function generateSimulatedSignal(
  instrumentId: InstrumentId,
  assayCode: string,
  level: QCLevel,
  value: number,
  unit: string,
  protocol?: string
): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  if (protocol === 'SYSMEX_CUSTOM' || instrumentId === 'SYSMEX800') {
    return [
      `[STX]01${instrumentId}^DATA`,
      `DATE:${dateStr.slice(0, 8)} TIME:${dateStr.slice(8, 14)}`,
      `SAMPLE_TYPE:QC_CONTROL_LEVEL_${level === 'level1' ? '1_NORMAL' : '2_HIGH'}`,
      `TEST:${assayCode}`,
      `RESULT:${value}`,
      `UNIT:${unit}`,
      `FLAG:N`,
      `CHECKSUM:0x${Math.floor(Math.random() * 255).toString(16).toUpperCase()}[ETX]`,
    ].join('\r\n');
  }

  if (protocol === 'HL7_V25' || instrumentId === 'COBASE411') {
    return [
      `MSH|^~\\&|${instrumentId}|Analyzer|LAB-LIS|MEDLAB|${dateStr}||ORU^R01|MSG${Date.now()}|P|2.5`,
      `PID|1||QC-CONTROL-${level.toUpperCase()}||PRECI-CONTROL||||||||||||||`,
      `OBR|1|ORD-${dateStr}|QC-RUN|^^^${assayCode}^${assayCode}|R||${dateStr}||||A`,
      `OBX|1|NM|${assayCode}^${assayCode}|1|${value}|${unit}||N|||F|||${dateStr}`,
    ].join('\r\n');
  }

  // Mặc định chuẩn ASTM E1381/1394 cho mọi thiết bị khai báo
  return [
    `H|\\^&|||${instrumentId}^Analyzer|||||||P|1|${dateStr}`,
    `P|1||QC-${level.toUpperCase()}|||||||||||||||||||||||`,
    `O|1|QC-SAMPLE-${instrumentId}|${level}|^^^${assayCode}|R||${dateStr}||||A`,
    `R|1|^^^${assayCode}|${value}|${unit}||N||F||${dateStr}`,
    `L|1|N`,
  ].join('\r\n');
}

/**
 * Trình phân tích tín hiệu thô từ cổng truyền thông LIS của máy
 */
export function parseIncomingMachineSignal(
  raw: string,
  targetInstrumentId: InstrumentId
): ParsedSignalResult | null {
  try {
    const trimmed = raw.trim();
    const now = new Date().toISOString();

    // 1. Nhận dạng tín hiệu chuẩn ASTM (H|\^& ... R|1|^^^CODE|VAL|UNIT)
    if (trimmed.includes('H|\\^&') || trimmed.includes('\nR|') || trimmed.includes('\rR|')) {
      const lines = trimmed.split(/[\r\n]+/);
      let val = 0;
      let assay = 'GLU';
      let unit = 'mmol/L';
      let level: QCLevel = 'level1';

      for (const line of lines) {
        if (line.startsWith('P|') || line.startsWith('O|')) {
          if (line.toLowerCase().includes('level2') || line.toLowerCase().includes('l2') || line.toLowerCase().includes('high')) {
            level = 'level2';
          } else if (line.toLowerCase().includes('level3') || line.toLowerCase().includes('l3')) {
            level = 'level3';
          }
        }
        if (line.startsWith('R|')) {
          const parts = line.split('|');
          if (parts.length >= 5) {
            assay = parts[2].replace(/\^/g, '').trim() || 'GLU';
            val = parseFloat(parts[3]) || 0;
            unit = parts[4] || 'mmol/L';
          }
        }
      }

      if (val > 0) {
        return {
          instrumentId: targetInstrumentId,
          assayCode: assay,
          value: val,
          unit,
          level,
          timestamp: now,
          rawSignal: trimmed,
          protocolName: 'ASTM E1381/E1394',
        };
      }
    }

    // 2. Nhận dạng tín hiệu Sysmex / Serial Custom (TEST: ... RESULT: ...)
    if (trimmed.includes('TEST:') && trimmed.includes('RESULT:')) {
      const lines = trimmed.split(/[\r\n]+/);
      let val = 0;
      let assay = 'WBC';
      let unit = '10^9/L';
      let level: QCLevel = 'level1';

      for (const line of lines) {
        if (line.includes('SAMPLE_TYPE:')) {
          if (line.includes('2') || line.includes('HIGH')) level = 'level2';
          if (line.includes('3')) level = 'level3';
        }
        if (line.startsWith('TEST:')) {
          assay = line.split(':')[1]?.trim() || 'WBC';
        }
        if (line.startsWith('RESULT:')) {
          val = parseFloat(line.split(':')[1]?.trim()) || 0;
        }
        if (line.startsWith('UNIT:')) {
          unit = line.split(':')[1]?.trim() || '';
        }
      }

      if (val > 0) {
        return {
          instrumentId: targetInstrumentId,
          assayCode: assay,
          value: val,
          unit,
          level,
          timestamp: now,
          rawSignal: trimmed,
          protocolName: 'Serial/TCP Telemetry Protocol',
        };
      }
    }

    // 3. Nhận dạng tín hiệu HL7 v2.5 (MSH| ... OBX|)
    if (trimmed.includes('MSH|') || trimmed.includes('OBX|')) {
      const lines = trimmed.split(/[\r\n]+/);
      let val = 0;
      let assay = 'TSH';
      let unit = 'µIU/mL';
      let level: QCLevel = 'level1';

      for (const line of lines) {
        if (line.startsWith('PID|')) {
          if (line.toLowerCase().includes('l2') || line.toLowerCase().includes('high') || line.includes('LEVEL2')) {
            level = 'level2';
          } else if (line.toLowerCase().includes('l3') || line.includes('LEVEL3')) {
            level = 'level3';
          }
        }
        if (line.startsWith('OBX|')) {
          const parts = line.split('|');
          if (parts.length >= 7) {
            assay = parts[3].split('^')[0].trim() || 'TSH';
            val = parseFloat(parts[5]) || 0;
            unit = parts[6] || 'µIU/mL';
          }
        }
      }

      if (val > 0) {
        return {
          instrumentId: targetInstrumentId,
          assayCode: assay,
          value: val,
          unit,
          level,
          timestamp: now,
          rawSignal: trimmed,
          protocolName: 'HL7 v2.5 Interface',
        };
      }
    }

    return null;
  } catch (e) {
    console.error('Không thể phân tích frame tín hiệu:', e);
    return null;
  }
}
