import React, { useState, useRef, useCallback } from 'react';
import { useThread } from '../context/ThreadContext';

const ReshapePanel: React.FC = () => {
  const { state, handleBackToList } = useThread();
  const { currentThread } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reshapedData, setReshapedData] = useState<{
    headers: string[];
    rows: any[][];
    restoredCols: number[];
    newCols: number[];
    stats: { restoredCount: number; newCount: number };
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const dragCountRef = useRef(0);

  if (!currentThread) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-400">未选中任何 Thread</p>
        <button
          onClick={handleBackToList}
          className="mt-4 px-4 py-2 bg-[#3b82f6] text-white rounded-lg cursor-pointer"
        >
          返回列表
        </button>
      </div>
    );
  }

  const maskedColHeaders = currentThread.configs
    .filter(c => c.selected && c.strategy !== 'NONE')
    .map(c => c.header);

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCountRef.current++;
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current <= 0) { dragCountRef.current = 0; setIsDragging(false); }
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCountRef.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) processReshape(file);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processReshape(file);
    e.target.value = '';
  };

  const processReshape = async (file: File) => {
    setIsProcessing(true);
    const bstr = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(evt.target?.result as string);
      reader.readAsBinaryString(file);
    });

    const { read, utils } = await import('xlsx');
    const wb = read(bstr, { type: 'binary' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = utils.sheet_to_json<any[]>(ws, { header: 1 });

    if (data.length === 0) { setIsProcessing(false); return; }

    const newHeaders = (data[0] as string[]).map(h => h?.toString() || '');
    const newRows = data.slice(1);

    // 动态导入反向重塑引擎
    const { reshapeData } = await import('../services/reshapeEngine');
    const result = reshapeData(newHeaders, newRows, currentThread.mappings, currentThread.originalHeaders);

    setReshapedData(result);
    setIsProcessing(false);
  };

  const handleExportReshaped = async () => {
    if (!reshapedData) return;
    const { utils, writeFileXLSX } = await import('xlsx');
    const ws = utils.aoa_to_sheet([reshapedData.headers, ...reshapedData.rows]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Reshaped');
    const outName = `reshaped_${currentThread.name.replace(/\.[^.]+$/, '')}.xlsx`;
    writeFileXLSX(wb, outName);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Thread 概览 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-5 mb-6">
        <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-info-circle text-[#3b82f6]"></i>
          源 Thread 信息
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-300">
            <i className="fa-solid fa-file-excel text-[#22c55e] mr-1.5"></i>
            {currentThread.name}
          </span>
          <span className="text-xs text-slate-500">
            <i className="fa-regular fa-clock mr-1"></i>
            {new Date(currentThread.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {maskedColHeaders.map((h, i) => (
            <span key={i} className="inline-flex items-center px-2.5 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded-full text-xs border border-[#3b82f6]/20">
              <i className="fa-solid fa-shield-halved text-[8px] mr-1"></i>
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* 上传区域 / 结果预览 */}
      {!reshapedData ? (
        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center min-h-[280px]
            rounded-2xl border-2 border-dashed p-10 text-center
            transition-all duration-300 cursor-pointer
            ${isDragging
              ? 'border-[#f59e0b] bg-[#f59e0b]/5 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
              : 'border-[#f59e0b]/30 bg-[#1a1f2e]/50 hover:border-[#f59e0b]/60'
            }
          `}
        >
          {isProcessing ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin text-3xl text-[#f59e0b] mb-4"></i>
              <p className="text-slate-300 font-medium">正在反向重塑...</p>
            </>
          ) : (
            <>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${isDragging ? 'bg-[#f59e0b]/20 scale-110' : 'bg-[#232a3b]'}`}>
                <i className={`fa-solid fa-rotate-left text-2xl ${isDragging ? 'text-[#f59e0b]' : 'text-[#f59e0b]/60'}`}></i>
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">上传脱敏后外部使用过的 Excel</h3>
              <p className="text-sm text-slate-500 max-w-md">
                系统将自动识别脱敏列，通过映射表将脱敏值还原为原始真实值，新增列原样保留。
              </p>
              <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={onFileChange} />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
              <span className="text-sm text-slate-300">还原了 <strong className="text-[#22c55e]">{reshapedData.stats.restoredCount}</strong> 列</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
              <span className="text-sm text-slate-300">发现 <strong className="text-[#3b82f6]">{reshapedData.stats.newCount}</strong> 个新增列</span>
            </div>
          </div>

          {/* 结果表格 */}
          <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-5 overflow-hidden">
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-table text-[#22c55e]"></i>
              重塑预览 (前 10 行)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    {reshapedData.headers.map((h, i) => {
                      const isRestored = reshapedData.restoredCols.includes(i);
                      const isNew = reshapedData.newCols.includes(i);
                      return (
                        <th key={i} className={`
                          px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider border-b whitespace-nowrap
                          ${isRestored ? 'text-[#22c55e] border-[#22c55e]/20 bg-[#22c55e]/5' :
                            isNew ? 'text-[#3b82f6] border-[#3b82f6]/20 bg-[#3b82f6]/5' :
                            'text-slate-500 border-slate-700/50'}
                        `}>
                          {isRestored && <i className="fa-solid fa-check text-[8px] mr-1"></i>}
                          {isNew && <i className="fa-solid fa-plus text-[8px] mr-1"></i>}
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {reshapedData.rows.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                      {row.map((cell, cIdx) => {
                        const isRestored = reshapedData.restoredCols.includes(cIdx);
                        const isNew = reshapedData.newCols.includes(cIdx);
                        return (
                          <td key={cIdx} className={`
                            px-3 py-2 whitespace-nowrap text-sm
                            ${isRestored ? 'text-[#86efac] bg-[#22c55e]/[0.03]' :
                              isNew ? 'text-[#93bbf5] bg-[#3b82f6]/[0.03]' :
                              'text-slate-400'}
                          `}>
                            {cell?.toString() ?? ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 导出按钮 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportReshaped}
              className="px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-download"></i>
              导出重塑结果
            </button>
            <button
              onClick={() => setReshapedData(null)}
              className="px-6 py-3 bg-[#232a3b] hover:bg-[#2a3347] text-slate-300 font-medium rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReshapePanel;
