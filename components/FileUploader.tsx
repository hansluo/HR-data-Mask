import React, { useState, useRef, useCallback } from 'react';
import { useThread } from '../context/ThreadContext';

const FileUploader: React.FC = () => {
  const { handleFileUpload } = useThread();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCountRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center min-h-[400px]
          rounded-2xl border-2 border-dashed p-12 text-center
          transition-all duration-300 cursor-pointer group
          ${isDragging
            ? 'border-[#3b82f6] bg-[#3b82f6]/5 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
            : 'border-slate-700 bg-[#1a1f2e]/50 hover:border-slate-500 hover:bg-[#1a1f2e]/80'
          }
        `}
      >
        {/* 拖放动画指示 */}
        {isDragging && (
          <div className="absolute inset-4 border-2 border-[#3b82f6]/30 rounded-xl animate-pulse pointer-events-none" />
        )}

        <div className={`
          w-20 h-20 rounded-2xl flex items-center justify-center mb-6
          transition-all duration-300
          ${isDragging
            ? 'bg-[#3b82f6]/20 scale-110'
            : 'bg-[#232a3b] group-hover:bg-[#2a3347]'
          }
        `}>
          <i className={`
            fa-solid fa-cloud-arrow-up text-3xl transition-all duration-300
            ${isDragging ? 'text-[#3b82f6] animate-bounce' : 'text-slate-400 group-hover:text-[#3b82f6]'}
          `}></i>
        </div>

        <h2 className="text-xl font-bold text-slate-200 mb-2">
          {isDragging ? '释放文件开始脱敏' : '上传 Excel 文件'}
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-md">
          将文件拖放到此处，或点击选择文件。支持 .xlsx, .xls, .csv 格式。
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="px-8 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer"
        >
          <i className="fa-solid fa-folder-open mr-2"></i>
          选择文件
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
        />

        {/* 功能亮点 */}
        <div className="mt-10 grid grid-cols-3 gap-6 w-full max-w-lg">
          <FeatureChip icon="fa-solid fa-brain" label="HR 智能识别" />
          <FeatureChip icon="fa-solid fa-bolt" label="一键脱敏" />
          <FeatureChip icon="fa-solid fa-rotate-left" label="反向重塑" />
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-600 mt-4">
        <i className="fa-solid fa-lock mr-1 text-[#22c55e]"></i>
        所有数据处理完全在本地浏览器完成，不上传任何服务器
      </p>
    </div>
  );
};

function FeatureChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 bg-[#232a3b] rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#3b82f6] transition-colors">
        <i className={icon}></i>
      </div>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

export default FileUploader;
