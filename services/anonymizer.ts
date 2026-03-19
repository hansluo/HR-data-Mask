import { ColumnConfig, MaskingStrategy, ColumnMapping, MaskingResult } from '../types';

/**
 * 脱敏引擎 - 纯本地处理，支持 7 种脱敏策略
 * 所有策略维护一致性双向映射表（正向：原始→脱敏，反向：脱敏→原始）
 */

// ===== 各策略实现 =====

/** NAME_ORG: 人名/组织 → 前缀+编号（一致性映射） */
function maskNameOrg(
  value: string,
  params: { prefix?: string },
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>,
  counter: { value: number }
): string {
  const strVal = value.toString().trim();
  if (!strVal) return value;

  if (forwardMap.has(strVal)) {
    return forwardMap.get(strVal)!;
  }

  const prefix = params.prefix || '模拟';
  const masked = `${prefix}${counter.value++}`;
  forwardMap.set(strVal, masked);
  reverseMap.set(masked, strVal);
  return masked;
}

/** ID_CARD: 身份证 → 保留前3后4，中间用星号 */
function maskIdCard(
  value: string,
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>
): string {
  const strVal = value.toString().trim();
  if (!strVal) return value;

  if (forwardMap.has(strVal)) {
    return forwardMap.get(strVal)!;
  }

  let masked: string;
  if (strVal.length <= 7) {
    masked = strVal.charAt(0) + '*'.repeat(strVal.length - 2) + strVal.slice(-1);
  } else {
    const starCount = strVal.length - 7;
    masked = strVal.slice(0, 3) + '*'.repeat(starCount) + strVal.slice(-4);
  }

  forwardMap.set(strVal, masked);
  reverseMap.set(masked, strVal);
  return masked;
}

/** BANK_CARD: 银行卡 → 保留后4位，其余用星号 */
function maskBankCard(
  value: string,
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>
): string {
  const strVal = value.toString().trim();
  if (!strVal) return value;

  if (forwardMap.has(strVal)) {
    return forwardMap.get(strVal)!;
  }

  let masked: string;
  if (strVal.length <= 4) {
    masked = '*'.repeat(strVal.length);
  } else {
    masked = '*'.repeat(strVal.length - 4) + strVal.slice(-4);
  }

  forwardMap.set(strVal, masked);
  reverseMap.set(masked, strVal);
  return masked;
}

/** PHONE: 手机号 → 保留前3后4，中间用星号 */
function maskPhone(
  value: string,
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>
): string {
  const strVal = value.toString().trim();
  if (!strVal) return value;

  if (forwardMap.has(strVal)) {
    return forwardMap.get(strVal)!;
  }

  let masked: string;
  if (strVal.length <= 7) {
    masked = strVal.charAt(0) + '*'.repeat(strVal.length - 2) + strVal.slice(-1);
  } else {
    const starCount = strVal.length - 7;
    masked = strVal.slice(0, 3) + '*'.repeat(starCount) + strVal.slice(-4);
  }

  forwardMap.set(strVal, masked);
  reverseMap.set(masked, strVal);
  return masked;
}

/** EMAIL: 邮箱 → 用户名编号化 + 保留域名 */
function maskEmail(
  value: string,
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>,
  counter: { value: number }
): string {
  const strVal = value.toString().trim();
  if (!strVal) return value;

  if (forwardMap.has(strVal)) {
    return forwardMap.get(strVal)!;
  }

  const atIndex = strVal.indexOf('@');
  let masked: string;
  if (atIndex > 0) {
    const domain = strVal.slice(atIndex);
    masked = `user${counter.value++}${domain}`;
  } else {
    masked = `user${counter.value++}`;
  }

  forwardMap.set(strVal, masked);
  reverseMap.set(masked, strVal);
  return masked;
}

/** NUMERIC_RANDOM: 数值 → 区间随机数（一致性映射） */
function maskNumericRandom(
  value: any,
  params: { min?: number; max?: number },
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>
): any {
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return value;

  const strKey = value.toString();
  if (forwardMap.has(strKey)) {
    return parseFloat(forwardMap.get(strKey)!);
  }

  const min = params.min ?? 0;
  const max = params.max ?? 100;

  const result = min + Math.random() * (max - min);

  // 保持原数字精度
  const originalStr = value.toString();
  const decimalParts = originalStr.split('.');
  const precision = decimalParts.length > 1 ? decimalParts[1].length : 0;

  const masked = result.toFixed(precision);
  forwardMap.set(strKey, masked);
  reverseMap.set(masked, strKey);
  return parseFloat(masked);
}

/** GRADE_SHUFFLE: 等级 → 一致性打乱映射 */
function maskGradeShuffle(
  value: string,
  forwardMap: Map<string, string>,
  reverseMap: Map<string, string>,
  gradePool: { values: string[]; shuffled: string[] | null }
): string {
  const strVal = value.toString().trim();
  if (!strVal) return value;

  if (forwardMap.has(strVal)) {
    return forwardMap.get(strVal)!;
  }

  // 收集阶段：记录新的等级值到 pool
  if (!gradePool.values.includes(strVal)) {
    gradePool.values.push(strVal);
  }

  // 如果 shuffled 还没生成，先暂存原值
  // 会在 finalize 阶段统一打乱
  forwardMap.set(strVal, strVal); // 占位
  return strVal; // 占位返回，finalize 阶段会重新处理
}

/** 
 * 打乱等级映射 - 在所有值收集完后执行
 * 使用 Fisher-Yates 算法
 */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // 确保不会出现 a→a 的情况（至少尝试）
  let retries = 0;
  while (retries < 10 && shuffled.some((v, i) => v === arr[i])) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    retries++;
  }
  return shuffled;
}

// ===== 主处理入口 =====

/**
 * 处理数据并返回脱敏结果 + 双向映射表
 */
export function processDataWithMappings(
  rows: any[][],
  configs: ColumnConfig[]
): MaskingResult {
  // 为每列初始化映射表和计数器
  const forwardMaps: Map<string, string>[] = configs.map(() => new Map());
  const reverseMaps: Map<string, string>[] = configs.map(() => new Map());
  const nameCounters: { value: number }[] = configs.map(() => ({ value: 1 }));
  const emailCounters: { value: number }[] = configs.map(() => ({ value: 1 }));
  const gradePools: { values: string[]; shuffled: string[] | null }[] = 
    configs.map(() => ({ values: [], shuffled: null }));

  // 第一遍：收集所有等级值（GRADE_SHUFFLE 策略需要）
  const gradeColumns = configs
    .map((c, i) => ({ config: c, index: i }))
    .filter(({ config }) => config.selected && config.strategy === MaskingStrategy.GRADE_SHUFFLE);

  if (gradeColumns.length > 0) {
    for (const row of rows) {
      for (const { index } of gradeColumns) {
        const cell = row[index];
        if (cell !== null && cell !== undefined) {
          const strVal = cell.toString().trim();
          if (strVal && !gradePools[index].values.includes(strVal)) {
            gradePools[index].values.push(strVal);
          }
        }
      }
    }
    // 生成打乱映射
    for (const { index } of gradeColumns) {
      const pool = gradePools[index];
      if (pool.values.length > 1) {
        pool.shuffled = shuffleArray(pool.values);
        for (let i = 0; i < pool.values.length; i++) {
          forwardMaps[index].set(pool.values[i], pool.shuffled[i]);
          reverseMaps[index].set(pool.shuffled[i], pool.values[i]);
        }
      } else if (pool.values.length === 1) {
        // 只有一种值，无法打乱
        forwardMaps[index].set(pool.values[0], pool.values[0]);
        reverseMaps[index].set(pool.values[0], pool.values[0]);
      }
    }
  }

  // 第二遍：执行脱敏
  const maskedRows = rows.map((row) => {
    return row.map((cell, colIdx) => {
      const config = configs[colIdx];
      if (!config || !config.selected || config.strategy === MaskingStrategy.NONE) {
        return cell;
      }
      if (cell === null || cell === undefined) {
        return cell;
      }

      switch (config.strategy) {
        case MaskingStrategy.NAME_ORG:
          return maskNameOrg(
            cell.toString(), config.params,
            forwardMaps[colIdx], reverseMaps[colIdx], nameCounters[colIdx]
          );

        case MaskingStrategy.ID_CARD:
          return maskIdCard(cell.toString(), forwardMaps[colIdx], reverseMaps[colIdx]);

        case MaskingStrategy.BANK_CARD:
          return maskBankCard(cell.toString(), forwardMaps[colIdx], reverseMaps[colIdx]);

        case MaskingStrategy.PHONE:
          return maskPhone(cell.toString(), forwardMaps[colIdx], reverseMaps[colIdx]);

        case MaskingStrategy.EMAIL:
          return maskEmail(
            cell.toString(),
            forwardMaps[colIdx], reverseMaps[colIdx], emailCounters[colIdx]
          );

        case MaskingStrategy.NUMERIC_RANDOM:
          return maskNumericRandom(
            cell, config.params,
            forwardMaps[colIdx], reverseMaps[colIdx]
          );

        case MaskingStrategy.GRADE_SHUFFLE: {
          const strVal = cell.toString().trim();
          if (!strVal) return cell;
          return forwardMaps[colIdx].get(strVal) ?? cell;
        }

        default:
          return cell;
      }
    });
  });

  // 构造 ColumnMapping 数组
  const mappings: ColumnMapping[] = configs
    .map((config, index) => {
      if (!config.selected || config.strategy === MaskingStrategy.NONE) return null;
      if (forwardMaps[index].size === 0) return null;

      return {
        columnIndex: index,
        header: config.header,
        strategy: config.strategy,
        forward: Array.from(forwardMaps[index].entries()),
        reverse: Array.from(reverseMaps[index].entries()),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null) as ColumnMapping[];

  return { maskedRows, mappings };
}

/**
 * 简化版处理（仅返回脱敏后数据，兼容预览场景）
 */
export function processDataLocal(rows: any[][], configs: ColumnConfig[]): any[][] {
  const { maskedRows } = processDataWithMappings(rows, configs);
  return maskedRows;
}
