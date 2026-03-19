// ===== 脱敏策略枚举 =====
export enum MaskingStrategy {
  NONE = 'NONE',
  NAME_ORG = 'NAME_ORG',           // 人名/组织 → 前缀+编号（一致性映射）
  NUMERIC_RANDOM = 'NUMERIC_RANDOM', // 数值 → 区间随机数
  ID_CARD = 'ID_CARD',             // 身份证 → 前3后4掩码
  BANK_CARD = 'BANK_CARD',         // 银行卡 → 后4位保留
  PHONE = 'PHONE',                 // 手机号 → 前3后4掩码
  GRADE_SHUFFLE = 'GRADE_SHUFFLE', // 等级 → 一致性打乱映射
  EMAIL = 'EMAIL',                 // 邮箱 → 用户名编号+保留域名
}

// ===== 敏感等级枚举 =====
export enum SensitivityLevel {
  EXTREME = 'EXTREME',    // 🔴 极高敏感 - 身份证/银行卡/护照
  HIGH = 'HIGH',          // 🟠 高敏感 - 手机号/邮箱/住址
  MEDIUM = 'MEDIUM',      // 🟡 中等敏感 - 姓名/工号/组织
  LOW = 'LOW',            // 🟢 低敏感 - 薪资/绩效/九宫格
  NONE = 'NONE',          // ⚪ 非敏感 - 无风险
}

// ===== 脱敏策略标签（中文显示用） =====
export const STRATEGY_LABELS: Record<MaskingStrategy, string> = {
  [MaskingStrategy.NONE]: '不处理',
  [MaskingStrategy.NAME_ORG]: '编号替换',
  [MaskingStrategy.NUMERIC_RANDOM]: '数值随机',
  [MaskingStrategy.ID_CARD]: '证件掩码',
  [MaskingStrategy.BANK_CARD]: '银行卡掩码',
  [MaskingStrategy.PHONE]: '手机号掩码',
  [MaskingStrategy.GRADE_SHUFFLE]: '等级打乱',
  [MaskingStrategy.EMAIL]: '邮箱脱敏',
};

// ===== 敏感等级配置 =====
export const SENSITIVITY_CONFIG: Record<SensitivityLevel, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultChecked: boolean;
  description: string;
}> = {
  [SensitivityLevel.EXTREME]: {
    label: '极高敏感',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    defaultChecked: true,
    description: '直接导致身份盗用、金融欺诈 — 《个保法》第28条',
  },
  [SensitivityLevel.HIGH]: {
    label: '高敏感',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    defaultChecked: true,
    description: '可被用于精准诈骗、骚扰 — 《个保法》第28条',
  },
  [SensitivityLevel.MEDIUM]: {
    label: '中等敏感',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    defaultChecked: false,
    description: '可关联定位具体人员',
  },
  [SensitivityLevel.LOW]: {
    label: '低敏感',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    defaultChecked: false,
    description: '需结合其他信息才能定位人员',
  },
  [SensitivityLevel.NONE]: {
    label: '非敏感',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    defaultChecked: false,
    description: '无直接风险',
  },
};

// ===== 列配置 =====
export interface ColumnConfig {
  header: string;
  strategy: MaskingStrategy;
  params: {
    prefix?: string;
    min?: number;
    max?: number;
  };
  sensitivity: SensitivityLevel;
  autoDetected: boolean;        // 是否由自动识别
  selected: boolean;            // 用户是否勾选脱敏
  matchedCategory?: string;     // 匹配到的 HR 字段类别
  strategyDescription?: string; // 策略效果描述
}

// ===== Excel 数据 =====
export interface SheetData {
  name: string;
  headers: string[];
  rows: any[][];
}

// ===== 列映射（用于 Thread 持久化） =====
export interface ColumnMapping {
  columnIndex: number;
  header: string;
  strategy: MaskingStrategy;
  forward: Array<[string, string]>;  // 原始值→脱敏值
  reverse: Array<[string, string]>;  // 脱敏值→原始值
}

// ===== Thread（脱敏会话） =====
export interface Thread {
  id: string;
  name: string;
  createdAt: number;
  originalHeaders: string[];
  maskedHeaders: string[];
  originalData: any[][];
  maskedData: any[][];
  configs: ColumnConfig[];
  mappings: ColumnMapping[];
  rowCount: number;
}

// ===== Thread 列表摘要（IndexedDB 列表展示用） =====
export interface ThreadSummary {
  id: string;
  name: string;
  createdAt: number;
  rowCount: number;
  maskedColumnCount: number;
  totalColumnCount: number;
}

// ===== 脱敏处理结果 =====
export interface MaskingResult {
  maskedRows: any[][];
  mappings: ColumnMapping[];
}

// ===== 视图模式 =====
export type ViewMode = 'list' | 'workspace' | 'reshape';
