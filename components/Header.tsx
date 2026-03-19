import React from 'react';
import { useThread } from '../context/ThreadContext';

const Header: React.FC = () => {
  const { state, handleBackToList } = useThread();
  const showBack = state.viewMode !== 'list';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0f1419]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 左侧品牌 + 返回 */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBackToList}
              className="mr-1 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all active:scale-90 cursor-pointer"
              title="返回列表"
            >
              <i className="fa-solid fa-chevron-left text-sm"></i>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-shield-halved text-white text-base"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 leading-tight">
                SecureData <span className="text-[#3b82f6]">Mask</span>
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-semibold leading-tight">
                HR数据脱敏专家
              </p>
            </div>
          </div>

          {/* 面包屑导航 */}
          {state.viewMode === 'workspace' && state.currentThread && (
            <div className="hidden sm:flex items-center gap-1.5 ml-3 text-xs text-slate-500">
              <i className="fa-solid fa-chevron-right text-[8px]"></i>
              <span className="text-slate-400 max-w-[200px] truncate" title={state.currentThread.name}>
                {state.currentThread.name}
              </span>
            </div>
          )}
          {state.viewMode === 'workspace' && !state.currentThread && state.fileData && (
            <div className="hidden sm:flex items-center gap-1.5 ml-3 text-xs text-slate-500">
              <i className="fa-solid fa-chevron-right text-[8px]"></i>
              <span className="text-slate-400">新建脱敏</span>
              <i className="fa-solid fa-chevron-right text-[8px]"></i>
              <span className="text-slate-300 max-w-[200px] truncate">{state.fileData.name}</span>
            </div>
          )}
          {state.viewMode === 'reshape' && state.currentThread && (
            <div className="hidden sm:flex items-center gap-1.5 ml-3 text-xs text-slate-500">
              <i className="fa-solid fa-chevron-right text-[8px]"></i>
              <span className="text-slate-400 max-w-[150px] truncate">{state.currentThread.name}</span>
              <i className="fa-solid fa-chevron-right text-[8px]"></i>
              <span className="text-[#f59e0b]">反向重塑</span>
            </div>
          )}
        </div>

        {/* 右侧状态指示 */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
            </span>
            本地运行
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
