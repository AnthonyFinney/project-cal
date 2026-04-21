import React, { useState, useCallback } from 'react';
import { Plus, Minus, RotateCcw, Copy } from 'lucide-react';
import MathDisplay from './MathDisplay';
import apiService from '../services/apiService';

interface MatrixState {
    rows: number;
    cols: number;
    values: string[][];
}

const createEmptyMatrix = (rows: number, cols: number): string[][] => {
    return Array(rows).fill(null).map(() => Array(cols).fill('0'));
};

const MatrixMode: React.FC = () => {
    const [matrixA, setMatrixA] = useState<MatrixState>({
        rows: 3,
        cols: 3,
        values: [['4', '-2', '1'], ['0', '5', '-1'], ['3', '8', '2']]
    });

    const [matrixB, setMatrixB] = useState<MatrixState>({
        rows: 3,
        cols: 1,
        values: [['1'], ['0'], ['-5']]
    });

    const [results, setResults] = useState<Array<{ command: string; result: string }>>([]);
    const [loading, setLoading] = useState(false);

    const matrixToString = (m: MatrixState): string => {
        return `Matrix([${m.values.map(row => `[${row.join(',')}]`).join(',')}])`;
    };

    const updateMatrixValue = (
        matrix: 'A' | 'B',
        row: number,
        col: number,
        value: string
    ) => {
        const setter = matrix === 'A' ? setMatrixA : setMatrixB;
        const current = matrix === 'A' ? matrixA : matrixB;

        const newValues = [...current.values];
        newValues[row] = [...newValues[row]];
        newValues[row][col] = value;

        setter({ ...current, values: newValues });
    };

    const resizeMatrix = (matrix: 'A' | 'B', newRows: number, newCols: number) => {
        const setter = matrix === 'A' ? setMatrixA : setMatrixB;
        const current = matrix === 'A' ? matrixA : matrixB;

        const newValues = createEmptyMatrix(newRows, newCols);
        for (let r = 0; r < Math.min(current.rows, newRows); r++) {
            for (let c = 0; c < Math.min(current.cols, newCols); c++) {
                newValues[r][c] = current.values[r]?.[c] || '0';
            }
        }

        setter({ rows: newRows, cols: newCols, values: newValues });
    };

    const executeOperation = async (operation: string) => {
        setLoading(true);
        try {
            let expr = '';
            let displayCmd = operation;

            switch (operation) {
                case 'det(A)':
                    expr = `${matrixToString(matrixA)}.det()`;
                    break;
                case 'inv(A)':
                    expr = `${matrixToString(matrixA)}.inv()`;
                    break;
                case 'transpose(A)':
                    expr = `${matrixToString(matrixA)}.T`;
                    break;
                case 'eigenvals(A)':
                    expr = `${matrixToString(matrixA)}.eigenvals()`;
                    break;
                case 'A × B':
                    expr = `${matrixToString(matrixA)} * ${matrixToString(matrixB)}`;
                    displayCmd = 'A * B';
                    break;
                case 'rref(A)':
                    expr = `${matrixToString(matrixA)}.rref()`;
                    break;
                default:
                    expr = operation;
            }

            const response = await apiService.simplify(expr);
            setResults(prev => [...prev, { command: displayCmd, result: response.result || response.latex || 'Error' }]);
        } catch (error: any) {
            setResults(prev => [...prev, { command: operation, result: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => setResults([]);

    const MatrixEditor = ({
        label,
        matrix,
        matrixKey
    }: {
        label: string;
        matrix: MatrixState;
        matrixKey: 'A' | 'B'
    }) => (
        <div className="bg-white rounded-none border-2 border-black overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-4 py-3 border-b-2 border-black bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-none border-2 border-black ${matrixKey === 'A' ? 'bg-primary text-white' : 'bg-white text-black'} flex items-center justify-center font-black font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                        {label}
                    </div>
                    <span className="font-black text-black">Matrix {label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => resizeMatrix(matrixKey, Math.max(1, matrix.rows - 1), matrix.cols)}
                        className="p-1 hover:bg-gray-100 border-2 border-black text-black transition-all"
                        title="Remove row"
                    >
                        <Minus size={14} />
                    </button>
                    <span className="text-xs text-black font-black font-mono">{matrix.rows} × {matrix.cols}</span>
                    <button
                        onClick={() => resizeMatrix(matrixKey, matrix.rows + 1, matrix.cols)}
                        className="p-1 hover:bg-gray-100 border-2 border-black text-black transition-all"
                        title="Add row"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
            <div className="p-6 flex items-center justify-center bg-white min-h-[200px]">
                <div className="flex relative before:absolute before:inset-y-0 before:-left-3 before:w-3 before:border-2 before:border-r-0 before:border-black before:rounded-none after:absolute after:inset-y-0 after:-right-3 after:w-3 after:border-2 after:border-l-0 after:border-black after:rounded-none">
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${matrix.cols}, minmax(0, 1fr))` }}
                    >
                        {matrix.values.flatMap((row, r) =>
                            row.map((val, c) => (
                                <input
                                    key={`${r}-${c}`}
                                    type="text"
                                    value={val}
                                    onChange={(e) => updateMatrixValue(matrixKey, r, c, e.target.value)}
                                    className="w-14 h-12 bg-white border-2 border-black rounded-none text-center text-black font-mono focus:bg-gray-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div className="px-4 py-2 border-t-2 border-black bg-white flex justify-end gap-2">
                <button
                    onClick={() => resizeMatrix(matrixKey, matrix.rows, Math.max(1, matrix.cols - 1))}
                    className="text-xs text-black font-black hover:underline"
                >
                    - Col
                </button>
                <button
                    onClick={() => resizeMatrix(matrixKey, matrix.rows, matrix.cols + 1)}
                    className="text-xs text-black font-black hover:underline"
                >
                    + Col
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white p-6 lg:p-10 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
                <header className="flex justify-between items-center border-b-2 border-black pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-black tracking-tight">Matrix Operations</h2>
                        <p className="text-black/60 mt-1 font-bold">Linear Algebra Workspace</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setMatrixA({ rows: 3, cols: 3, values: createEmptyMatrix(3, 3) });
                                setMatrixB({ rows: 3, cols: 1, values: createEmptyMatrix(3, 1) });
                            }}
                            className="px-4 py-2 bg-white border-2 border-black rounded-none hover:bg-gray-100 text-black text-sm font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MatrixEditor label="A" matrix={matrixA} matrixKey="A" />
                    <MatrixEditor label="B" matrix={matrixB} matrixKey="B" />
                </div>

                {/* Operations Toolbar */}
                <div className="flex justify-center">
                    <div className="bg-white border-2 border-black rounded-none p-2 flex gap-2 flex-wrap justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {['det(A)', 'inv(A)', 'transpose(A)', 'eigenvals(A)', 'A × B', 'rref(A)'].map(op => (
                            <button
                                key={op}
                                onClick={() => executeOperation(op)}
                                disabled={loading}
                                className="px-4 py-2 rounded-none bg-white border-2 border-black hover:bg-primary hover:text-white text-black text-sm font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                            >
                                {op}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Console */}
                <div className="bg-white rounded-none border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="px-4 py-2 border-b-2 border-black bg-white flex justify-between">
                        <span className="text-xs font-black text-black uppercase tracking-wider">Console Output</span>
                        <button onClick={clearResults} className="text-xs text-primary font-black cursor-pointer hover:underline">
                            Clear
                        </button>
                    </div>
                    <div className="p-4 font-mono text-sm space-y-3 h-48 overflow-y-auto">
                        {results.length === 0 ? (
                            <p className="text-black/40 text-center py-8 font-bold">Click an operation to see results...</p>
                        ) : (
                            results.map((r, i) => (
                                <div key={i} className="border-b border-black/10 pb-2">
                                    <div className="flex gap-2 text-black/50">
                                        <span className="text-primary font-black">&gt;</span>
                                        <span className="font-bold">{r.command}</span>
                                    </div>
                                    <div className="pl-4 text-primary font-black mt-1">
                                        = <MathDisplay expression={r.result} inline />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatrixMode;
