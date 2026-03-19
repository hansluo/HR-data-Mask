import React, { useRef } from 'react';
import { useThread } from '../context/ThreadContext';
import { ThreadSummary } from '../types';

const ThreadList: React.FC = () => {
  const {
    state,
    handleFileUpload,
    handleDeleteThread,
    handleEnterThread,
    handleEnterReshape,
    handleExportMapping,
    handleImportMapping,
  } = useThread();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mappingInputRef = useRef<HTMLInputElement>(null);

  const onNewUpload = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const onImportMapping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const jsonStr = evt.target?.result as string;
      handleImportMapping(jsonStr);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const onDelete = async (id: string, name: string) => {
    if (confirm(`确定删除 Thread「${name}」吗？此操作不可恢复。`)) {
      await handleDeleteThread(id);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 操作入口 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onNewUpload}
          className="px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          新建脱敏
        </button>
        <button
          onClick={() => mappingInputRef.current?.click()}
          className="px-4 py-3 bg-[#1a1f2e] hover:bg-[#232a3b] text-slate-300 font-medium rounded-xl transition-all border border-slate-700 hover:border-slate-500 flex items-center gap-2"
        >
          <i className="fa-solid fa-file-import"></i>
          导入映射文件
        </button>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
        />
        <input
          ref={mappingInputRef}
          type="file"
          className="hidden"
          accept=".json"
          onChange={onImportMapping}
        />
      </div>

      {/* Thread 列表 */}
      {state.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fa-solid fa-circle-notch animate-spin text-2xl text-slate-500"></i>
        </div>
      ) : state.threadList.length === 0 ? (
        <EmptyState onNewUpload={onNewUpload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.threadList.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              formatTime={formatTime}
              onEnter={() => handleEnterThread(thread.id)}
              onReshape={() => handleEnterReshape(thread.id)}
              onExport={() => handleExportMapping(thread.id)}
              onDelete={() => onDelete(thread.id, thread.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===== 子组件 =====

function EmptyState({ onNewUpload }: { onNewUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-[#1a1f2e] rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
        <i className="fa-solid fa-shield-halved text-3xl text-slate-500"></i>
      </div>
      <h3 className="text-xl font-semibold text-slate-400 mb-2">暂无脱敏记录</h3>
      <p className="text-slate-500 mb-6 max-w-md text-sm">
        点击上方「新建脱敏」按钮，上传 Excel 文件开始数据脱敏。
        脱敏映射表将自动保存，支持后续反向重塑。
      </p>
      <button
        onClick={onNewUpload}
        className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium rounded-xl transition-all"
      >
        立即开始
      </button>
    </div>
  );
}

interface ThreadCardProps {
  thread: ThreadSummary;
  formatTime: (ts: number) => string;
  onEnter: () => void;
  onReshape: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const ThreadCard: React.FC<ThreadCardProps> = ({
  thread, formatTime, onEnter, onReshape, onExport, onDelete,
}) => {
  return (
    <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-5 hover:border-[#3b82f6]/50 transition-all group hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-200 truncate" title={thread.name}>
            <i className="fa-solid fa-file-excel text-[#22c55e] mr-2 text-sm"></i>
            {thread.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            <i className="fa-regular fa-clock mr-1"></i>
            {formatTime(thread.createdAt)}
          </p>
        </div>
      </div>

      {/* 统计标签 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded-full text-xs font-medium border border-[#3b82f6]/20">
          <i className="fa-solid fa-columns text-[10px]"></i>
          {thread.maskedColumnCount} 列脱敏
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700/50 text-slate-400 rounded-full text-xs font-medium">
          <i className="fa-solid fa-table-cells text-[10px]"></i>
          {thread.rowCount} 行
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700/50 text-slate-400 rounded-full text-xs font-medium">
          共 {thread.totalColumnCount} 列
        </span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEnter}
          className="flex-1 py-2 bg-[#232a3b] hover:bg-[#3b82f6] text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-eye"></i>
          查看
        </button>
        <button
          onClick={onReshape}
          className="flex-1 py-2 bg-[#232a3b] hover:bg-[#f59e0b] text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-rotate-left"></i>
          反向重塑
        </button>
        <button
          onClick={onExport}
          className="py-2 px-3 bg-[#232a3b] hover:bg-[#22c55e] text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all"
          title="导出映射文件"
        >
          <i className="fa-solid fa-download"></i>
        </button>
        <button
          onClick={onDelete}
          className="py-2 px-3 bg-[#232a3b] hover:bg-[#ef4444] text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all"
          title="删除"
        >
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  );
}

export default ThreadList;
