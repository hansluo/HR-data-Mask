import React, { useMemo } from 'react';
import { useThread } from '../context/ThreadContext';
import {
  ColumnConfig, MaskingStrategy, SensitivityLevel,
  STRATEGY_LABELS, SENSITIVITY_CONFIG,
} from '../types';

const ConfigPanel: React.FC = () => {
  const { state, dispatch, handleSmartMask, handleQuickSelect, handleExport } = useThread();
  const { configs, isProcessing } = state;

  // 按敏感等级分组
  const grouped = useMemo(() => {
    const groups: Record<SensitivityLevel, { configs: ColumnConfig[]; indices: number[] }> = {
      [SensitivityLevel.EXTREME]: { configs: [], indices: [] },
      [SensitivityLevel.HIGH]: { configs: [], indices: [] },
      [SensitivityLevel.MEDIUM]: { configs: [], indices: [] },
      [SensitivityLevel.LOW]: { configs: [], indices: [] },
      [SensitivityLevel.NONE]: { configs: [], indices: [] },
    };
    configs.forEach((c, i) => {
      const level = c.sensitivity || SensitivityLevel.NONE;
      groups[level].configs.push(c);
      groups[level].indices.push(i);
    });
    return groups;
  }, [configs]);

  // 统计
  const selectedCount = configs.filter(c => c.selected).length;
  const totalCount = configs.length;

  const handleToggle = (originalIndex: number) => {
    const config = configs[originalIndex];
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { index: originalIndex, config: { ...config, selected: !config.selected } },
    });
  };

  const handleStrategyChange = (originalIndex: number, strategy: MaskingStrategy) => {
    const config = configs[originalIndex];
    let params = config.params;
    if (strategy === MaskingStrategy.NAME_ORG) {
      params = { ...params, prefix: params.prefix || '模拟' };
    } else if (strategy === MaskingStrategy.NUMERIC_RANDOM) {
      params = { ...params, min: params.min ?? 0, max: params.max ?? 100 };
    }
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { index: originalIndex, config: { ...config, strategy, params } },
    });
  };

  const handleParamChange = (originalIndex: number, key: string, value: any) => {
    const config = configs[originalIndex];
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { index: originalIndex, config: { ...config, params: { ...config.params, [key]: value } } },
    });
  };

  const handleToggleGroup = (level: SensitivityLevel, checked: boolean) => {
    const group = grouped[level];
    group.indices.forEach(idx => {
      const config = configs[idx];
      if (config.selected !== checked) {
        dispatch({
          type: 'UPDATE_CONFIG',
          payload: { index: idx, config: { ...config, selected: checked } },
        });
      }
    });
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-1 custom-scrollbar">
      {/* 一键智能脱敏按钮 */}
      <button
        onClick={handleSmartMask}
        className="w-full py-3 bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
      >
        <i className="fa-solid fa-bolt"></i>
        一键智能识别
      </button>

      {/* 快速选择区域 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">快速选择</span>
          <span className="text-[11px] text-slate-500">
            已选 <span className="text-[#3b82f6] font-bold">{selectedCount}</span>/{totalCount} 列
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickBtn
            label="极高+高"
            onClick={() => handleQuickSelect([SensitivityLevel.EXTREME, SensitivityLevel.HIGH])}
            color="#ef4444"
          />
          <QuickBtn
            label="全部脱敏"
            onClick={() => handleQuickSelect([
              SensitivityLevel.EXTREME, SensitivityLevel.HIGH,
              SensitivityLevel.MEDIUM, SensitivityLevel.LOW,
            ])}
            color="#3b82f6"
          />
          <QuickBtn
            label="全部取消"
            onClick={() => handleQuickSelect([])}
            color="#64748b"
          />
        </div>
      </div>

      {/* 按敏感等级分组 */}
      {Object.entries(SENSITIVITY_CONFIG).map(([level, cfg]) => {
        const group = grouped[level as SensitivityLevel];
        if (group.configs.length === 0) return null;

        const allChecked = group.configs.every(c => c.selected);
        const someChecked = group.configs.some(c => c.selected);

        return (
          <SensitivityGroup
            key={level}
            level={level as SensitivityLevel}
            label={cfg.label}
            description={cfg.description}
            color={cfg.color}
            bgColor={cfg.bgColor}
            borderColor={cfg.borderColor}
            configs={group.configs}
            indices={group.indices}
            allChecked={allChecked}
            someChecked={someChecked}
            onToggleGroup={(checked) => handleToggleGroup(level as SensitivityLevel, checked)}
            onToggle={handleToggle}
            onStrategyChange={handleStrategyChange}
            onParamChange={handleParamChange}
          />
        );
      })}
    </div>
  );
};

// ===== 子组件 =====

function QuickBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer border"
      style={{
        color,
        borderColor: `${color}33`,
        backgroundColor: `${color}10`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${color}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${color}10`;
      }}
    >
      {label}
    </button>
  );
}

interface SensitivityGroupProps {
  level: SensitivityLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  configs: ColumnConfig[];
  indices: number[];
  allChecked: boolean;
  someChecked: boolean;
  onToggleGroup: (checked: boolean) => void;
  onToggle: (index: number) => void;
  onStrategyChange: (index: number, strategy: MaskingStrategy) => void;
  onParamChange: (index: number, key: string, value: any) => void;
}

const SensitivityGroup: React.FC<SensitivityGroupProps> = ({
  level, label, description, color, bgColor, borderColor,
  configs, indices, allChecked, someChecked,
  onToggleGroup, onToggle, onStrategyChange, onParamChange,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor, backgroundColor: '#1a1f2e' }}
    >
      {/* 分组头部 */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ backgroundColor: bgColor }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {/* 全选 checkbox */}
        <label
          className="cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
            onChange={(e) => onToggleGroup(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-current cursor-pointer"
            style={{ accentColor: color }}
          />
        </label>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color }}>{label}</span>
            <span className="text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
              {configs.length} 列
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{description}</p>
        </div>

        <i className={`fa-solid fa-chevron-down text-xs text-slate-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}></i>
      </div>

      {/* 列配置列表 */}
      {!collapsed && (
        <div className="divide-y divide-slate-800/30">
          {configs.map((config, groupIdx) => (
            <ColumnConfigRow
              key={indices[groupIdx]}
              config={config}
              originalIndex={indices[groupIdx]}
              color={color}
              onToggle={onToggle}
              onStrategyChange={onStrategyChange}
              onParamChange={onParamChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ColumnConfigRowProps {
  config: ColumnConfig;
  originalIndex: number;
  color: string;
  onToggle: (index: number) => void;
  onStrategyChange: (index: number, strategy: MaskingStrategy) => void;
  onParamChange: (index: number, key: string, value: any) => void;
}

const ColumnConfigRow: React.FC<ColumnConfigRowProps> = ({
  config, originalIndex, color, onToggle, onStrategyChange, onParamChange,
}) => {
  return (
    <div className={`px-4 py-3 transition-all ${config.selected ? 'bg-slate-800/20' : 'opacity-50'}`}>
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={config.selected}
          onChange={() => onToggle(originalIndex)}
          className="w-3.5 h-3.5 rounded cursor-pointer flex-shrink-0"
          style={{ accentColor: color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300 truncate" title={config.header}>
              {config.header}
            </span>
            {config.autoDetected && (
              <span className="text-[9px] text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded border border-[#f59e0b]/20 flex-shrink-0">
                <i className="fa-solid fa-bolt text-[7px] mr-0.5"></i>
                自动识别
              </span>
            )}
          </div>
          {config.matchedCategory && (
            <span className="text-[10px] text-slate-500">{config.matchedCategory}</span>
          )}
        </div>

        {/* 策略选择 */}
        <select
          value={config.strategy}
          onChange={(e) => onStrategyChange(originalIndex, e.target.value as MaskingStrategy)}
          disabled={!config.selected}
          className="text-[11px] bg-[#0f1419] border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-[#3b82f6] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
        >
          {Object.entries(STRATEGY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* 策略参数 */}
      {config.selected && config.strategy === MaskingStrategy.NAME_ORG && (
        <div className="mt-2 ml-6 flex items-center gap-2">
          <label className="text-[10px] text-slate-500 font-medium">前缀:</label>
          <input
            type="text"
            value={config.params?.prefix || ''}
            onChange={(e) => onParamChange(originalIndex, 'prefix', e.target.value)}
            placeholder="如: 员工"
            className="flex-1 text-xs px-2 py-1 bg-[#0f1419] border border-slate-700 text-slate-300 rounded-lg outline-none focus:border-[#3b82f6]"
          />
        </div>
      )}

      {config.selected && config.strategy === MaskingStrategy.NUMERIC_RANDOM && (
        <div className="mt-2 ml-6 flex items-center gap-2">
          <label className="text-[10px] text-slate-500 font-medium whitespace-nowrap">范围:</label>
          <input
            type="number"
            value={config.params?.min ?? 0}
            onChange={(e) => onParamChange(originalIndex, 'min', parseFloat(e.target.value))}
            className="w-20 text-xs px-2 py-1 bg-[#0f1419] border border-slate-700 text-slate-300 rounded-lg outline-none focus:border-[#3b82f6]"
          />
          <span className="text-slate-600 text-xs">~</span>
          <input
            type="number"
            value={config.params?.max ?? 100}
            onChange={(e) => onParamChange(originalIndex, 'max', parseFloat(e.target.value))}
            className="w-20 text-xs px-2 py-1 bg-[#0f1419] border border-slate-700 text-slate-300 rounded-lg outline-none focus:border-[#3b82f6]"
          />
        </div>
      )}

      {/* 策略效果描述 */}
      {config.selected && config.strategyDescription && (
        <p className="mt-1.5 ml-6 text-[10px] text-slate-600 italic">
          {config.strategyDescription}
        </p>
      )}
    </div>
  );
}

export default ConfigPanel;
