import React, { useState } from 'react';

// Refined, more modern icons
const PlusIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function TableEditor({ nodeId, tables = [], onUpdate }) {
  const [colWidths, setColWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});

  // ... (Keep all your existing handler functions exactly as they were)
  const handleTableDelete = (tableIndex) => {
    onUpdate(nodeId, (n) => ({
      ...n,
      tables: n.tables.filter((_, i) => i !== tableIndex)
    }));
  };

  const handleTableCellChange = (tableIndex, rowIndex, cellIndex, value) => {
    onUpdate(nodeId, (n) => {
      const newTables = [...n.tables];
      const newTable = [...newTables[tableIndex]];
      const newRow = [...newTable[rowIndex]];
      newRow[cellIndex] = value;
      newTable[rowIndex] = newRow;
      newTables[tableIndex] = newTable;
      return { ...n, tables: newTables };
    });
  };

  const handleCellPaste = (e, tIndex, rIndex, cIndex) => {
    const pasteData = e.clipboardData.getData('Text');
    if (!pasteData.includes('\t') && !pasteData.includes('\n')) return;
    e.preventDefault();
    const parsedTable = pasteData.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
    const cleanTable = parsedTable.filter(row => row.some(cell => cell !== ''));
    if (cleanTable.length === 0) return;

    onUpdate(nodeId, (n) => {
      const newTables = [...n.tables];
      const newTable = [...newTables[tIndex]].map(r => [...r]);

      cleanTable.forEach((pastedRow, pRowIdx) => {
        const targetRowIdx = rIndex + pRowIdx;
        if (targetRowIdx >= newTable.length) {
          const colCount = newTable[0] ? newTable[0].length : 1;
          newTable.push(Array(colCount).fill(''));
        }
        pastedRow.forEach((pastedCell, pColIdx) => {
          const targetColIdx = cIndex + pColIdx;
          if (targetColIdx >= newTable[targetRowIdx].length) {
            newTable.forEach(r => {
              while (r.length <= targetColIdx) r.push('');
            });
          }
          newTable[targetRowIdx][targetColIdx] = pastedCell;
        });
      });
      newTables[tIndex] = newTable;
      return { ...n, tables: newTables };
    });
  };

  const handleInsertRow = (tableIndex, rowIndex, position = 'after') => {
    onUpdate(nodeId, (n) => {
      const newTables = [...n.tables];
      const newTable = [...newTables[tableIndex]];
      const colCount = newTable[0] ? newTable[0].length : 1;
      const insertAt = position === 'before' ? rowIndex : rowIndex + 1;
      newTable.splice(insertAt, 0, Array(colCount).fill(''));
      newTables[tableIndex] = newTable;
      return { ...n, tables: newTables };
    });
  };

  const handleDeleteRow = (tableIndex, rowIndex) => {
    onUpdate(nodeId, (n) => {
      const newTables = [...n.tables];
      const newTable = [...newTables[tableIndex]];
      newTable.splice(rowIndex, 1);
      if (newTable.length === 0) {
        newTables.splice(tableIndex, 1);
      } else {
        newTables[tableIndex] = newTable;
      }
      return { ...n, tables: newTables };
    });
  };

  const handleInsertColumn = (tableIndex, colIndex, position = 'after') => {
    onUpdate(nodeId, (n) => {
      const newTables = [...n.tables];
      const insertAt = position === 'before' ? colIndex : colIndex + 1;
      const newTable = newTables[tableIndex].map(row => {
        const newRow = [...row];
        newRow.splice(insertAt, 0, '');
        return newRow;
      });
      newTables[tableIndex] = newTable;
      return { ...n, tables: newTables };
    });
  };

  const handleDeleteColumn = (tableIndex, colIndex) => {
    onUpdate(nodeId, (n) => {
      const newTables = [...n.tables];
      const newTable = newTables[tableIndex].map(row => {
        const newRow = [...row];
        newRow.splice(colIndex, 1);
        return newRow;
      });
      if (newTable[0].length === 0) {
        newTables.splice(tableIndex, 1);
      } else {
        newTables[tableIndex] = newTable;
      }
      return { ...n, tables: newTables };
    });
  };

  const handleResizeStart = (e, tIndex, index, type) => {
    e.preventDefault();
    const startPos = type === 'col' ? e.clientX : e.clientY;
    const startSize = type === 'col'
      ? (colWidths[`${tIndex}-${index}`] || 150)
      : (rowHeights[`${tIndex}-${index}`] || 45);

    const onMouseMove = (moveEvent) => {
      const delta = (type === 'col' ? moveEvent.clientX : moveEvent.clientY) - startPos;
      const newSize = Math.max(type === 'col' ? 50 : 30, startSize + delta);
      if (type === 'col') {
        setColWidths(prev => ({ ...prev, [`${tIndex}-${index}`]: newSize }));
      } else {
        setRowHeights(prev => ({ ...prev, [`${tIndex}-${index}`]: newSize }));
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (tables.length === 0) return null;

  return (
    <div className="mb-6 space-y-8">
      {tables.map((table, tIndex) => (
        <div key={tIndex} className="relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all">
          
          {/* Table Header / Toolbar */}
          <div className="flex justify-between items-center bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center bg-blue-100 text-blue-700 font-bold w-6 h-6 rounded text-xs">
                {tIndex + 1}
              </span>
              <span className="text-sm font-medium text-slate-600">
                {table.length} Rows &times; {table[0]?.length || 0} Columns
              </span>
            </div>
            <button
              onClick={() => handleTableDelete(tIndex)}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all outline-none focus:ring-2 focus:ring-red-500"
              title="Delete Table"
            >
              <TrashIcon />
            </button>
          </div>
          
          {/* Scrollable Table Area */}
          <div className="overflow-x-auto p-4 bg-slate-50/50">
            <table className="text-sm text-left border-collapse table-fixed bg-white ring-1 ring-slate-200 rounded-lg w-max shadow-sm">
              <thead>
                <tr>
                  {/* Top-left empty corner cell */}
                  <th className="w-10 bg-slate-100 border-b border-r border-slate-200 rounded-tl-lg"></th>
                  
                  {/* Column Headers */}
                  {table[0]?.map((_, cIndex) => (
                    <th 
                      key={`col-ctrl-${cIndex}`} 
                      className="p-0 border-b border-r border-slate-200 bg-slate-100 relative group/th font-normal"
                      style={{ width: colWidths[`${tIndex}-${cIndex}`] || 150 }}
                    >
                      <div className="flex items-center justify-center w-full h-8 opacity-0 group-hover/th:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center bg-white rounded shadow-sm ring-1 ring-slate-200 overflow-hidden">
                          <button onClick={() => handleInsertColumn(tIndex, cIndex, 'before')} title="Insert left" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 transition-colors"><ChevronLeftIcon /></button>
                          <div className="w-[1px] h-4 bg-slate-200"></div>
                          <button onClick={() => handleDeleteColumn(tIndex, cIndex)} title="Delete column" className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-1.5 transition-colors"><TrashIcon /></button>
                          <div className="w-[1px] h-4 bg-slate-200"></div>
                          <button onClick={() => handleInsertColumn(tIndex, cIndex, 'after')} title="Insert right" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 transition-colors"><ChevronRightIcon /></button>
                        </div>
                      </div>
                      
                      {/* Column Resizer */}
                      <div 
                        className="absolute right-[-4px] top-0 bottom-0 w-[8px] cursor-col-resize z-20 group/resizer flex justify-center"
                        onMouseDown={(e) => handleResizeStart(e, tIndex, cIndex, 'col')}
                      >
                        <div className="w-[2px] h-full bg-blue-400 opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
                      </div>
                    </th>
                  ))}
                  <th className="p-1 border-b border-slate-200 bg-slate-100 w-[40px] rounded-tr-lg"></th>
                </tr>
              </thead>

              <tbody>
                {table.map((row, rIndex) => (
                  <tr 
                    key={rIndex} 
                    className="group/tr"
                    style={{ height: rowHeights[`${tIndex}-${rIndex}`] || 45 }}
                  >
                    {/* Row Number / Resizer */}
                    <td className="bg-slate-100 border-r border-b border-slate-200 relative text-center text-xs font-medium text-slate-400 select-none">
                      {rIndex + 1}
                      
                      {/* Row Resizer */}
                      <div 
                        className="absolute bottom-[-4px] left-0 right-0 h-[8px] cursor-row-resize z-20 group/resizer flex items-center"
                        onMouseDown={(e) => handleResizeStart(e, tIndex, rIndex, 'row')}
                      >
                        <div className="h-[2px] w-full bg-blue-400 opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
                      </div>
                    </td>

                    {/* Cells */}
                    {row.map((cell, cIndex) => (
                      <td 
                        key={cIndex} 
                        className={`border-r border-b border-slate-200 p-0 relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:z-10 bg-white transition-colors
                          ${rIndex === 0 ? 'bg-slate-50 font-medium text-slate-800' : 'text-slate-600'}`}
                      >
                        <textarea
                          className="absolute inset-0 w-full h-full bg-transparent focus:outline-none focus:bg-blue-50/30 p-2.5 resize-none overflow-hidden"
                          value={cell}
                          onChange={(e) => handleTableCellChange(tIndex, rIndex, cIndex, e.target.value)}
                          onPaste={(e) => handleCellPaste(e, tIndex, rIndex, cIndex)}
                          title={cell} 
                          placeholder="..."
                        />
                      </td>
                    ))}
                    
                    {/* Row Controls */}
                    <td className="border-b border-slate-200 bg-white p-1 align-middle w-[48px]">
                      <div className="flex flex-col items-center justify-center opacity-0 group-hover/tr:opacity-100 transition-opacity duration-200 h-full">
                        <div className="flex flex-col items-center bg-white rounded shadow-sm ring-1 ring-slate-200 overflow-hidden">
                          <button onClick={() => handleInsertRow(tIndex, rIndex, 'before')} title="Insert above" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1 transition-colors"><ChevronUpIcon /></button>
                          <div className="h-[1px] w-4 bg-slate-200"></div>
                          <button onClick={() => handleDeleteRow(tIndex, rIndex)} title="Delete row" className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-1 transition-colors"><TrashIcon /></button>
                          <div className="h-[1px] w-4 bg-slate-200"></div>
                          <button onClick={() => handleInsertRow(tIndex, rIndex, 'after')} title="Insert below" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1 transition-colors"><ChevronDownIcon /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}