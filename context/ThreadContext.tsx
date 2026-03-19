import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  Thread, ThreadSummary, SheetData, ColumnConfig,
  ViewMode, MaskingStrategy, ColumnMapping,
} from '../types';
import { matchHRFields, setSelectionByLevel } from '../services/hrFieldMatcher';
import { processDataWithMappings } from '../services/anonymizer';
import {
  listThreads, saveThread, deleteThread, getThread,
  exportThread, importThread, generateThreadId,
} from '../services/threadDB';
import { SensitivityLevel } from '../types';

// ===== State =====

export interface AppState {
  viewMode: ViewMode;
  threadList: ThreadSummary[];
  currentThread: Thread | null;
  fileData: SheetData | null;
  configs: ColumnConfig[];
  isProcessing: boolean;
  isLoading: boolean;
}

const initialState: AppState = {
  viewMode: 'list',
  threadList: [],
  currentThread: null,
  fileData: null,
  configs: [],
  isProcessing: false,
  isLoading: true,
};

// ===== Actions =====

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_THREAD_LIST'; payload: ThreadSummary[] }
  | { type: 'SET_CURRENT_THREAD'; payload: Thread | null }
  | { type: 'SET_FILE_DATA'; payload: SheetData | null }
  | { type: 'SET_CONFIGS'; payload: ColumnConfig[] }
  | { type: 'UPDATE_CONFIG'; payload: { index: number; config: ColumnConfig } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_WORKSPACE' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, viewMode: action.payload };
    case 'SET_THREAD_LIST':
      return { ...state, threadList: action.payload };
    case 'SET_CURRENT_THREAD':
      return { ...state, currentThread: action.payload };
    case 'SET_FILE_DATA':
      return { ...state, fileData: action.payload };
    case 'SET_CONFIGS':
      return { ...state, configs: action.payload };
    case 'UPDATE_CONFIG': {
      const next = [...state.configs];
      next[action.payload.index] = action.payload.config;
      return { ...state, configs: next };
    }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_WORKSPACE':
      return {
        ...state,
        currentThread: null,
        fileData: null,
        configs: [],
        viewMode: 'list',
      };
    default:
      return state;
  }
}

// ===== Context =====

interface ThreadContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // 高级 action 封装
  loadThreadList: () => Promise<void>;
  handleFileUpload: (file: File) => void;
  handleSmartMask: () => void;
  handleExport: () => Promise<void>;
  handleDeleteThread: (id: string) => Promise<void>;
  handleEnterThread: (id: string) => Promise<void>;
  handleEnterReshape: (id: string) => Promise<void>;
  handleExportMapping: (id: string) => Promise<void>;
  handleImportMapping: (jsonStr: string) => Promise<void>;
  handleBackToList: () => void;
  handleQuickSelect: (levels: SensitivityLevel[]) => void;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

export function useThread(): ThreadContextValue {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error('useThread must be used within ThreadProvider');
  return ctx;
}

// ===== Provider =====

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 加载 Thread 列表
  const loadThreadList = useCallback(async () => {
    const list = await listThreads();
    dispatch({ type: 'SET_THREAD_LIST', payload: list });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // 初始化：加载列表
  useEffect(() => {
    loadThreadList();
  }, [loadThreadList]);

  // 上传文件
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      // 动态导入 xlsx
      import('xlsx').then(({ read, utils }) => {
        const wb = read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (data.length > 0) {
          const headers = (data[0] as string[]).map(h => h?.toString() || '');
          const rows = data.slice(1);
          const sheetData: SheetData = { name: file.name, headers, rows };
          dispatch({ type: 'SET_FILE_DATA', payload: sheetData });

          // 自动 HR 字段识别
          const autoConfigs = matchHRFields(headers);
          dispatch({ type: 'SET_CONFIGS', payload: autoConfigs });
          dispatch({ type: 'SET_VIEW', payload: 'workspace' });
        }
      });
    };
    reader.readAsBinaryString(file);
  }, []);

  // 一键智能脱敏
  const handleSmartMask = useCallback(() => {
    if (!state.fileData) return;
    const autoConfigs = matchHRFields(state.fileData.headers);
    dispatch({ type: 'SET_CONFIGS', payload: autoConfigs });
  }, [state.fileData]);

  // 快速等级选择
  const handleQuickSelect = useCallback((levels: SensitivityLevel[]) => {
    const updated = setSelectionByLevel(state.configs, levels);
    dispatch({ type: 'SET_CONFIGS', payload: updated });
  }, [state.configs]);

  // 脱敏并导出
  const handleExport = useCallback(async () => {
    if (!state.fileData) return;
    dispatch({ type: 'SET_PROCESSING', payload: true });

    // 使用 setTimeout 避免阻塞 UI
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        const { maskedRows, mappings } = processDataWithMappings(
          state.fileData!.rows,
          state.configs
        );

        // 创建 Thread
        const thread: Thread = {
          id: generateThreadId(),
          name: state.fileData!.name,
          createdAt: Date.now(),
          originalHeaders: state.fileData!.headers,
          maskedHeaders: state.fileData!.headers, // 表头不变
          originalData: state.fileData!.rows,
          maskedData: maskedRows,
          configs: state.configs,
          mappings,
          rowCount: state.fileData!.rows.length,
        };

        // 保存到 IndexedDB
        await saveThread(thread);
        dispatch({ type: 'SET_CURRENT_THREAD', payload: thread });

        // 导出 Excel
        const { utils, writeFileXLSX } = await import('xlsx');
        const worksheet = utils.aoa_to_sheet([state.fileData!.headers, ...maskedRows]);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Anonymized');
        const outName = `masked_${state.fileData!.name.replace(/\.[^.]+$/, '')}.xlsx`;
        writeFileXLSX(workbook, outName);

        // 刷新列表
        await loadThreadList();
        dispatch({ type: 'SET_PROCESSING', payload: false });
        resolve();
      }, 100);
    });
  }, [state.fileData, state.configs, loadThreadList]);

  // 删除 Thread
  const handleDeleteThread = useCallback(async (id: string) => {
    await deleteThread(id);
    await loadThreadList();
  }, [loadThreadList]);

  // 进入 Thread 工作区（查看历史记录）
  const handleEnterThread = useCallback(async (id: string) => {
    const thread = await getThread(id);
    if (thread) {
      dispatch({ type: 'SET_CURRENT_THREAD', payload: thread });
      dispatch({ type: 'SET_FILE_DATA', payload: {
        name: thread.name,
        headers: thread.originalHeaders,
        rows: thread.originalData,
      }});
      dispatch({ type: 'SET_CONFIGS', payload: thread.configs });
      dispatch({ type: 'SET_VIEW', payload: 'workspace' });
    }
  }, []);

  // 进入反向重塑
  const handleEnterReshape = useCallback(async (id: string) => {
    const thread = await getThread(id);
    if (thread) {
      dispatch({ type: 'SET_CURRENT_THREAD', payload: thread });
      dispatch({ type: 'SET_VIEW', payload: 'reshape' });
    }
  }, []);

  // 导出映射文件
  const handleExportMapping = useCallback(async (id: string) => {
    const jsonStr = await exportThread(id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thread_mapping_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // 导入映射文件
  const handleImportMapping = useCallback(async (jsonStr: string) => {
    await importThread(jsonStr);
    await loadThreadList();
  }, [loadThreadList]);

  // 返回列表
  const handleBackToList = useCallback(() => {
    dispatch({ type: 'RESET_WORKSPACE' });
  }, []);

  const value: ThreadContextValue = {
    state,
    dispatch,
    loadThreadList,
    handleFileUpload,
    handleSmartMask,
    handleExport,
    handleDeleteThread,
    handleEnterThread,
    handleEnterReshape,
    handleExportMapping,
    handleImportMapping,
    handleBackToList,
    handleQuickSelect,
  };

  return (
    <ThreadContext.Provider value={value}>
      {children}
    </ThreadContext.Provider>
  );
}
