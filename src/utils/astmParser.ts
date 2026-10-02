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
  unit: string
): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

  if (instrumentId === 'AU400') {
    // Giao thức chuẩn ASTM E1381/1394 của Beckman Coulter AU400
    return [
      `H|\\^&|||AU400^BeckmanCoulter|||||||P|1|${dateStr}`,
      `P|1||QC-${level.toUpperCase()}|||||||||||||||||||||||`,
      `O|1|QC-SAMPLE-AU400|${level}|^^^${assayCode}|R||${dateStr}||||A`,
      `R|1|^^^${assayCode}|${value}|${unit}||N||F||${dateStr}`,
      `L|1|N`,
    ].join('\r\n');
  }

  if (instrumentId === 'SYSMEX800') {
    // Giao thức Sysmex 800 Series (KX/XP Protocol)
    return [
      `[STX]01SYS800^DATA`,
      `DATE:${dateStr.slice(0, 8)} TIME:${dateStr.slice(8, 14)}`,
      `SAMPLE_TYPE:QC_CONTROL_LEVEL_${level === 'level1' ? '1_NORMAL' : '2_HIGH'}`,
      `TEST:${assayCode}`,
      `RESULT:${value}`,
      `UNIT:${unit}`,
      `FLAG:N`,
      `CHECKSUM:0x${Math.floor(Math.random() * 255).toString(16).toUpperCase()}[ETX]`,
    ].join('\r\n');
  }

  // Cobas e411 Roche Diagnostics (HL7 v2.5 Message)
  return [
    `MSH|^~\\&|Cobas-e411|RocheDiagnostics|LAB-LIS|MEDLAB|${dateStr}||ORU^R01|MSG${Date.now()}|P|2.5`,
    `PID|1||QC-CONTROL-${level.toUpperCase()}||PRECI-CONTROL^ROCHE||||||||||||||`,
    `OBR|1|ORD-${dateStr}|QC-RUN|^^^${assayCode}^${assayCode}|R||${dateStr}||||A`,
    `OBX|1|NM|${assayCode}^${assayCode}|1|${value}|${unit}||N|||F|||${dateStr}`,
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

    // 1. Nhận dạng tín hiệu AU400 (ASTM)
    if (trimmed.includes('AU400') || trimmed.includes('H|\\^&') || targetInstrumentId === 'AU400') {
      const lines = trimmed.split(/[\r\n]+/);
      let val = 0;
      let assay = 'GLU';
      let unit = 'mmol/L';
      let level: QCLevel = 'level1';

      for (const line of lines) {
        if (line.startsWith('P|')) {
          if (line.toLowerCase().includes('level2') || line.toLowerCase().includes('l2') || line.toLowerCase().includes('high')) {
            level = 'level2';
          }
        }
        if (line.startsWith('R|')) {
          // Format: R|1|^^^GLU|5.41|mmol/L||N||F||timestamp
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
          instrumentId: 'AU400',
          assayCode: assay,
          value: val,
          unit,
          level,
          timestamp: now,
          rawSignal: trimmed,
          protocolName: 'ASTM E1381/E1394 (RS-232)',
        };
      }
    }

    // 2. Nhận dạng tín hiệu Sysmex 800
    if (trimmed.includes('SYS800') || trimmed.includes('Sysmex') || targetInstrumentId === 'SYSMEX800') {
      const lines = trimmed.split(/[\r\n]+/);
      let val = 0;
      let assay = 'WBC';
      let unit = '10^9/L';
      let level: QCLevel = 'level1';

      for (const line of lines) {
        if (line.includes('SAMPLE_TYPE:')) {
          if (line.includes('2') || line.includes('HIGH')) level = 'level2';
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
          instrumentId: 'SYSMEX800',
          assayCode: assay,
          value: val,
          unit,
          level,
          timestamp: now,
          rawSignal: trimmed,
          protocolName: 'Sysmex Serial/TCP Telemetry Protocol',
        };
      }
    }

    // 3. Nhận dạng tín hiệu Cobas e411 (HL7)
    if (trimmed.includes('Cobas-e411') || trimmed.includes('MSH|') || targetInstrumentId === 'COBASE411') {
      const lines = trimmed.split(/[\r\n]+/);
      let val = 0;
      let assay = 'TSH';
      let unit = 'µIU/mL';
      let level: QCLevel = 'level1';

      for (const line of lines) {
        if (line.startsWith('PID|')) {
          if (line.toLowerCase().includes('l2') || line.toLowerCase().includes('high') || line.includes('LEVEL2')) {
            level = 'level2';
          }
        }
        if (line.startsWith('OBX|')) {
          // Format: OBX|1|NM|TSH^TSH|1|2.18|uIU/mL||N|||F
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
          instrumentId: 'COBASE411',
          assayCode: assay,
          value: val,
          unit,
          level,
          timestamp: now,
          rawSignal: trimmed,
          protocolName: 'HL7 v2.5 Health Level Seven (TCP/IP Port 2575)',
        };
      }
    }

    return null;
  } catch (e) {
    console.error('Không thể phân tích frame tín hiệu:', e);
    return null;
  }
}
