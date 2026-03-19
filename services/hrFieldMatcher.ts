import {
  MaskingStrategy,
  SensitivityLevel,
  ColumnConfig,
} from '../types';

// ===== HR 字段识别规则 =====

export interface HRFieldRule {
  category: string;
  keywords: string[];
  strategy: MaskingStrategy;
  params: Record<string, any>;
  sensitivity: SensitivityLevel;
  description: string;
}

/**
 * HR 敏感字段识别规则表
 * 按敏感等级从高到低排列
 * 关键词采用中文包含匹配（支持模糊命中）
 */
export const HR_FIELD_RULES: HRFieldRule[] = [
  // ========== 🔴 极高敏感 ==========
  {
    category: '身份证',
    keywords: [
      '身份证', '身份证号', '身份证号码', '证件号码', '身份证件号',
      '证件号', 'ID号', 'ID号码', '居民身份证',
    ],
    strategy: MaskingStrategy.ID_CARD,
    params: {},
    sensitivity: SensitivityLevel.EXTREME,
    description: '保留前3后4位，中间用星号替代',
  },
  {
    category: '银行卡',
    keywords: [
      '银行卡', '银行卡号', '银行账号', '卡号', '开户账号',
      '银行账户', '收款账号', '付款账号',
    ],
    strategy: MaskingStrategy.BANK_CARD,
    params: {},
    sensitivity: SensitivityLevel.EXTREME,
    description: '保留后4位，其余用星号替代',
  },
  {
    category: '护照',
    keywords: ['护照', '护照号', '护照号码', '旅行证件'],
    strategy: MaskingStrategy.ID_CARD,
    params: {},
    sensitivity: SensitivityLevel.EXTREME,
    description: '保留前3后4位，中间用星号替代',
  },

  // ========== 🟠 高敏感 ==========
  {
    category: '手机号',
    keywords: [
      '手机', '手机号', '手机号码', '移动电话', '联系电话', '联系方式',
      '电话', '电话号码', '紧急联系电话', '紧急联系人电话',
    ],
    strategy: MaskingStrategy.PHONE,
    params: {},
    sensitivity: SensitivityLevel.HIGH,
    description: '保留前3后4位，中间用星号替代',
  },
  {
    category: '邮箱',
    keywords: [
      '邮箱', 'email', '电子邮件', '邮箱地址', '企业邮箱',
      '公司邮箱', '邮箱账号', 'E-mail',
    ],
    strategy: MaskingStrategy.EMAIL,
    params: {},
    sensitivity: SensitivityLevel.HIGH,
    description: '用户名编号化，保留域名',
  },
  {
    category: '家庭住址',
    keywords: [
      '家庭住址', '家庭地址', '现住址', '居住地址', '户籍地址',
      '户口所在地', '通讯地址', '联系地址', '住址',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '地址' },
    sensitivity: SensitivityLevel.HIGH,
    description: '替换为"地址+编号"',
  },
  {
    category: '紧急联系人',
    keywords: [
      '紧急联系人', '紧急联系人姓名', '家庭成员', '配偶姓名',
      '配偶', '亲属姓名',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '联系人' },
    sensitivity: SensitivityLevel.HIGH,
    description: '替换为"联系人+编号"',
  },

  // ========== 🟡 中等敏感 ==========
  {
    category: '姓名',
    keywords: [
      '姓名', '名字', '员工姓名', '中文名', '英文名', '真实姓名',
      '全名', '用户名', '持卡人姓名', '联系人姓名', '直接上级',
      '上级姓名', '导师姓名', '面试官',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '员工' },
    sensitivity: SensitivityLevel.MEDIUM,
    description: '替换为"员工+编号"',
  },
  {
    category: '工号',
    keywords: [
      '工号', '员工工号', '员工编号', '员工号', '工牌号',
      '工卡号', '员工ID', 'staffId', 'staff_id',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '工号' },
    sensitivity: SensitivityLevel.MEDIUM,
    description: '替换为"工号+编号"',
  },
  {
    category: '组织架构',
    keywords: [
      '部门', '部门名称', '所属部门', '组织', '组织名称', '团队',
      '中心', '处室', '科室', '事业群', 'BG', '组', '所属组织',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '部门' },
    sensitivity: SensitivityLevel.MEDIUM,
    description: '替换为"部门+编号"',
  },
  {
    category: '岗位职级',
    keywords: [
      '岗位', '岗位名称', '职位', '职位名称', '职务', '职级',
      '职等', '职级等级', '专业通道', '管理职级',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '岗位' },
    sensitivity: SensitivityLevel.MEDIUM,
    description: '替换为"岗位+编号"',
  },
  {
    category: '微信号',
    keywords: ['微信', '微信号', '企业微信', '企微账号'],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '账号' },
    sensitivity: SensitivityLevel.MEDIUM,
    description: '替换为"账号+编号"',
  },

  // ========== 🟢 低敏感 ==========
  {
    category: '薪资',
    keywords: [
      '薪资', '工资', '月薪', '年薪', '基本工资', '底薪',
      '薪金', '薪酬', '薪资水平', '工资总额', '税前工资',
      '税后工资', '到手工资',
    ],
    strategy: MaskingStrategy.NUMERIC_RANDOM,
    params: { min: 5000, max: 50000 },
    sensitivity: SensitivityLevel.LOW,
    description: '在指定区间内生成随机数',
  },
  {
    category: '奖金',
    keywords: [
      '奖金', '年终奖', '绩效奖金', '项目奖金', '激励奖金',
      '年终奖金', '季度奖金', '奖励金额',
    ],
    strategy: MaskingStrategy.NUMERIC_RANDOM,
    params: { min: 1000, max: 100000 },
    sensitivity: SensitivityLevel.LOW,
    description: '在指定区间内生成随机数',
  },
  {
    category: '津贴补贴',
    keywords: [
      '津贴', '补贴', '交通补贴', '餐补', '住房补贴',
      '通讯补贴', '补助',
    ],
    strategy: MaskingStrategy.NUMERIC_RANDOM,
    params: { min: 100, max: 5000 },
    sensitivity: SensitivityLevel.LOW,
    description: '在指定区间内生成随机数',
  },
  {
    category: '公积金社保',
    keywords: [
      '公积金', '住房公积金', '公积金账号', '社保', '社保账号',
      '养老保险', '医疗保险',
    ],
    strategy: MaskingStrategy.NAME_ORG,
    params: { prefix: '账号' },
    sensitivity: SensitivityLevel.LOW,
    description: '替换为"账号+编号"',
  },
  {
    category: '绩效等级',
    keywords: [
      '绩效', '绩效等级', '绩效考核', '考核等级', '考核结果',
      '绩效结果', '年度绩效', '半年度绩效', '绩效评级',
      '考核评级', '绩效评分',
    ],
    strategy: MaskingStrategy.GRADE_SHUFFLE,
    params: {},
    sensitivity: SensitivityLevel.LOW,
    description: '等级一致性打乱映射',
  },
  {
    category: '九宫格',
    keywords: [
      '九宫格', '人才九宫格', '九宫格位置', '九宫格分布',
      '绩效-潜力', '绩效潜力', '潜力-绩效',
    ],
    strategy: MaskingStrategy.GRADE_SHUFFLE,
    params: {},
    sensitivity: SensitivityLevel.LOW,
    description: '位置一致性打乱映射',
  },
  {
    category: '梯队',
    keywords: [
      '梯队', '人才梯队', '梯队层级', '梯队等级', '继任者',
      '继任计划', '继任梯队', '后备人才',
    ],
    strategy: MaskingStrategy.GRADE_SHUFFLE,
    params: {},
    sensitivity: SensitivityLevel.LOW,
    description: '等级一致性打乱映射',
  },
  {
    category: '潜力',
    keywords: [
      '潜力', '潜力等级', '潜力评估', '高潜', '高潜人才',
    ],
    strategy: MaskingStrategy.GRADE_SHUFFLE,
    params: {},
    sensitivity: SensitivityLevel.LOW,
    description: '等级一致性打乱映射',
  },
  {
    category: '人才标签',
    keywords: [
      '人才标签', '人才类型', '人才分类', '关键人才', '核心人才',
      '骨干员工',
    ],
    strategy: MaskingStrategy.GRADE_SHUFFLE,
    params: {},
    sensitivity: SensitivityLevel.LOW,
    description: '标签一致性打乱映射',
  },
];

// ===== 匹配函数 =====

/**
 * 自动识别 Excel 表头中的 HR 敏感字段
 * 采用中文关键词包含匹配，返回推荐的 ColumnConfig 列表
 */
export function matchHRFields(headers: string[]): ColumnConfig[] {
  return headers.map((header) => {
    const normalizedHeader = (header || '').toString().trim().toLowerCase();

    // 遍历规则表，找到第一个匹配的规则
    for (const rule of HR_FIELD_RULES) {
      for (const keyword of rule.keywords) {
        if (normalizedHeader.includes(keyword.toLowerCase())) {
          const config = SENSITIVITY_DEFAULTS[rule.sensitivity];
          return {
            header: header || '未知列',
            strategy: rule.strategy,
            params: { ...rule.params },
            sensitivity: rule.sensitivity,
            autoDetected: true,
            selected: config.defaultChecked,
            matchedCategory: rule.category,
            strategyDescription: rule.description,
          };
        }
      }
    }

    // 未匹配到任何规则
    return {
      header: header || '未知列',
      strategy: MaskingStrategy.NONE,
      params: {},
      sensitivity: SensitivityLevel.NONE,
      autoDetected: false,
      selected: false,
    };
  });
}

/** 
 * 按敏感等级批量设置勾选状态
 */
export function setSelectionByLevel(
  configs: ColumnConfig[],
  levels: SensitivityLevel[]
): ColumnConfig[] {
  return configs.map((config) => ({
    ...config,
    selected: config.strategy !== MaskingStrategy.NONE && levels.includes(config.sensitivity),
  }));
}

// 默认配置映射
const SENSITIVITY_DEFAULTS: Record<SensitivityLevel, { defaultChecked: boolean }> = {
  [SensitivityLevel.EXTREME]: { defaultChecked: true },
  [SensitivityLevel.HIGH]: { defaultChecked: true },
  [SensitivityLevel.MEDIUM]: { defaultChecked: false },
  [SensitivityLevel.LOW]: { defaultChecked: false },
  [SensitivityLevel.NONE]: { defaultChecked: false },
};
