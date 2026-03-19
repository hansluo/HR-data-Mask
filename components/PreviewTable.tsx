import React from 'react';
import { ColumnConfig, MaskingStrategy } from '../types';

interface PreviewTableProps {
  headers: string[];
  rows: any[][];
  configs: ColumnConfig[];
}

const PreviewTable: React.FC<PreviewTableProps> = ({ headers, rows, configs }) => {
  const isMaskedCol = (colIdx: number): boolean => {
    const cfg = configs[colIdx];
    return !!(cfg && cfg.selected && cfg.strategy !== MaskingStrategy.NONE);
  };

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          {headers.map((h, i) => {
            const masked = isMaskedCol(i);
            return (
              <th
                key={i}
                className={`
                  px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider
                  border-b whitespace-nowrap
                  ${masked
                    ? 'text-[#3b82f6] border-[#3b82f6]/20 bg-[#3b82f6]/5'
                    : 'text-slate-500 border-slate-700/50 bg-[#0f1419]/50'
                  }
                `}
              >
                {masked && (
                  <i className="fa-solid fa-shield-halved text-[8px] mr-1.5 text-[#3b82f6]/70"></i>
                )}
                {h}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-3 py-8 text-center text-slate-500 text-sm italic">
              暂无预览数据
            </td>
          </tr>
        ) : (
          rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
              {row.map((cell, cIdx) => {
                const masked = isMaskedCol(cIdx);
                return (
                  <td
                    key={cIdx}
                    className={`
                      px-3 py-2 whitespace-nowrap text-sm
                      ${masked
                        ? 'text-[#93bbf5] bg-[#3b82f6]/[0.03] font-mono text-xs'
                        : 'text-slate-400'
                      }
                    `}
                  >
                    {cell?.toString() ?? ''}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default PreviewTable;
