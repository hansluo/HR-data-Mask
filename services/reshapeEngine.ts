import { ColumnMapping } from '../types';

/**
 * 反向重塑引擎
 * 
 * 将脱敏后被外部使用过的 Excel（可能新增了列）导入，
 * 通过 Thread 中保存的反向映射表，将脱敏值还原为原始真实值，
 * 同时保留新增的非脱敏列。
 */

export interface ReshapeResult {
  headers: string[];
  rows: any[][];
  restoredCols: number[];   // 被成功还原的列索引
  newCols: number[];         // 新增列的索引
  stats: {
    restoredCount: number;
    newCount: number;
  };
}

/**
 * 执行反向重塑
 * 
 * @param newHeaders - 导入的新 Excel 表头
 * @param newRows - 导入的新 Excel 数据行
 * @param mappings - Thread 中保存的列映射表（含反向映射）
 * @param originalHeaders - Thread 中的原始表头
 */
export function reshapeData(
  newHeaders: string[],
  newRows: any[][],
  mappings: ColumnMapping[],
  originalHeaders: string[]
): ReshapeResult {
  // 构建反向映射 Map（按列名索引）
  const reverseMaps = new Map<string, Map<string, string>>();
  const mappingByHeader = new Map<string, ColumnMapping>();

  for (const mapping of mappings) {
    const reverseMap = new Map<string, string>(mapping.reverse);
    reverseMaps.set(mapping.header, reverseMap);
    mappingByHeader.set(mapping.header, mapping);
  }

  // 识别新旧列
  const restoredCols: number[] = [];
  const newCols: number[] = [];
  const originalHeaderSet = new Set(originalHeaders);

  newHeaders.forEach((header, idx) => {
    if (reverseMaps.has(header)) {
      // 这是脱敏列，可以还原
      restoredCols.push(idx);
    } else if (!originalHeaderSet.has(header)) {
      // 这是新增列（既不在映射表中，也不在原始表头中）
      newCols.push(idx);
    }
    // 其他情况：原始表头中存在但未脱敏的列，原样保留
  });

  // 执行反向还原
  const reshapedRows = newRows.map((row) => {
    return newHeaders.map((header, colIdx) => {
      const cell = row[colIdx];
      if (cell === null || cell === undefined) return cell;

      const reverseMap = reverseMaps.get(header);
      if (reverseMap) {
        const strVal = cell.toString().trim();
        const original = reverseMap.get(strVal);
        if (original !== undefined) {
          // 尝试还原为数字（如果原始值是数字）
          const numOriginal = parseFloat(original);
          if (!isNaN(numOriginal) && original.trim() === numOriginal.toString()) {
            return numOriginal;
          }
          return original;
        }
        // 找不到映射，保持原值（可能是新增的数据行）
        return cell;
      }

      // 非脱敏列，原样保留
      return cell;
    });
  });

  return {
    headers: newHeaders,
    rows: reshapedRows,
    restoredCols,
    newCols,
    stats: {
      restoredCount: restoredCols.length,
      newCount: newCols.length,
    },
  };
}
