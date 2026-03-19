import React from 'react';
import { ThreadProvider, useThread } from './context/ThreadContext';
import { processDataLocal } from './services/anonymizer';
import Header from './components/Header';
import ThreadList from './components/ThreadList';
import FileUploader from './components/FileUploader';
import ConfigPanel from './components/ConfigPanel';
import PreviewTable from './components/PreviewTable';
import ReshapePanel from './components/ReshapePanel';

const AppContent: React.FC = () => {
  const { state } = useThread();

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <Header />
      <main className="pt-16 pb-12">
        {state.viewMode === 'list' && <ThreadList />}
        {state.viewMode === 'workspace' && <WorkspaceView />}
        {state.viewMode === 'reshape' && <ReshapePanel />}
      </main>

      {/* 底部安全提示 */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#0f1419]/90 backdrop-blur border-t border-slate-800 py-2.5 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <i className="fa-solid fa-lock text-[#22c55e]"></i>
          所有数据仅存储于本地浏览器，从不上传服务器
        </div>
      </footer>
    </div>
  );
};

function WorkspaceView() {
  const { state, handleExport } = useThread();
  const { fileData, configs, isProcessing } = state;

  const previewData = React.useMemo(() => {
    if (!fileData) return [];
    return processDataLocal(fileData.rows.slice(0, 5), configs);
  }, [fileData, configs]);

  if (!fileData) {
    return <FileUploader />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧配置面板 */}
        <div className="lg:col-span-1">
          <ConfigPanel />
        </div>

        {/* 右侧预览 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <i className="fa-solid fa-eye text-[#22c55e]"></i>
                实时脱敏预览
              </h2>
              <span className="text-[11px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">前 5 行</span>
            </div>
            <div className="overflow-x-auto">
              <PreviewTable
                headers={fileData.headers}
                rows={previewData}
                configs={configs}
              />
            </div>
          </div>

          {/* 导出按钮区域 */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isProcessing || !configs.some(c => c.selected && c.strategy !== 'NONE')}
              className="px-8 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none flex items-center gap-2 active:scale-95 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  处理中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-download"></i>
                  脱敏并导出 Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThreadProvider>
      <AppContent />
    </ThreadProvider>
  );
};

export default App;
