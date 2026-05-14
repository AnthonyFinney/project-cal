/**
 * CAS Cal - Statistics Mode
 * 
 * Statistical analysis:
 * - Descriptive: mean, median, mode, std, variance
 * - Regression: linear, polynomial
 * - Probability: normal distribution, binomial
 */

import React, { useState, useCallback } from 'react';
import { BarChart3, TrendingUp, Calculator, Plus, Trash2, LineChart } from 'lucide-react';

type StatTab = 'descriptive' | 'regression' | 'probability';

interface DataPoint {
    id: number;
    x: number;
    y?: number;
}

interface DescriptiveResult {
    count: number;
    sum: number;
    mean: number;
    median: number;
    mode: number[];
    min: number;
    max: number;
    range: number;
    variance: number;
    std: number;
    q1: number;
    q3: number;
    iqr: number;
}

interface RegressionResult {
    slope: number;
    intercept: number;
    r2: number;
    equation: string;
}

const StatisticsMode: React.FC = () => {
    const [activeTab, setActiveTab] = useState<StatTab>('descriptive');

    // Descriptive data
    const [dataInput, setDataInput] = useState('1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10');
    const [descResult, setDescResult] = useState<DescriptiveResult | null>(null);

    // Regression data
    const [regPoints, setRegPoints] = useState<DataPoint[]>([
        { id: 1, x: 1, y: 2.1 },
        { id: 2, x: 2, y: 3.9 },
        { id: 3, x: 3, y: 6.2 },
        { id: 4, x: 4, y: 8.0 },
        { id: 5, x: 5, y: 9.8 },
    ]);
    const [regResult, setRegResult] = useState<RegressionResult | null>(null);

    // Probability
    const [probMean, setProbMean] = useState('0');
    const [probStd, setProbStd] = useState('1');
    const [probX, setProbX] = useState('1');
    const [probResult, setProbResult] = useState<string | null>(null);

    // Parse data string to array
    const parseData = (input: string): number[] => {
        return input.split(',')
            .map(s => parseFloat(s.trim()))
            .filter(n => !isNaN(n));
    };

    // Calculate descriptive statistics
    const calculateDescriptive = () => {
        const data = parseData(dataInput).sort((a, b) => a - b);
        if (data.length === 0) return;

        const n = data.length;
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        // Median
        const median = n % 2 === 0
            ? (data[n / 2 - 1] + data[n / 2]) / 2
            : data[Math.floor(n / 2)];

        // Mode
        const freq: Record<number, number> = {};
        data.forEach(v => freq[v] = (freq[v] || 0) + 1);
        const maxFreq = Math.max(...Object.values(freq));
        const mode = Object.entries(freq)
            .filter(([_, f]) => f === maxFreq)
            .map(([v, _]) => parseFloat(v));

        // Variance & Std
        const variance = data.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
        const std = Math.sqrt(variance);

        // Quartiles
        const q1Idx = Math.floor(n * 0.25);
        const q3Idx = Math.floor(n * 0.75);
        const q1 = data[q1Idx];
        const q3 = data[q3Idx];

        setDescResult({
            count: n,
            sum,
            mean,
            median,
            mode,
            min: data[0],
            max: data[n - 1],
            range: data[n - 1] - data[0],
            variance,
            std,
            q1,
            q3,
            iqr: q3 - q1
        });
    };

    // Linear regression
    const calculateRegression = () => {
        const points = regPoints.filter(p => p.y !== undefined);
        if (points.length < 2) return;

        const n = points.length;
        const sumX = points.reduce((a, p) => a + p.x, 0);
        const sumY = points.reduce((a, p) => a + (p.y || 0), 0);
        const sumXY = points.reduce((a, p) => a + p.x * (p.y || 0), 0);
        const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
        const sumY2 = points.reduce((a, p) => a + (p.y || 0) ** 2, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // R² coefficient
        const meanY = sumY / n;
        const ssRes = points.reduce((a, p) => {
            const predicted = slope * p.x + intercept;
            return a + (((p.y || 0) - predicted) ** 2);
        }, 0);
        const ssTot = points.reduce((a, p) => a + (((p.y || 0) - meanY) ** 2), 0);
        const r2 = 1 - (ssRes / ssTot);

        const sign = intercept >= 0 ? '+' : '';
        const equation = `y = ${slope.toFixed(4)}x ${sign} ${intercept.toFixed(4)}`;

        setRegResult({ slope, intercept, r2, equation });
    };

    // Normal distribution probability
    const calculateProbability = () => {
        const mean = parseFloat(probMean);
        const std = parseFloat(probStd);
        const x = parseFloat(probX);

        // Z-score
        const z = (x - mean) / std;

        // Approximate CDF using error function approximation
        const erf = (x: number): number => {
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const p = 0.3275911;

            const sign = x >= 0 ? 1 : -1;
            x = Math.abs(x);
            const t = 1.0 / (1.0 + p * x);
            const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            return sign * y;
        };

        const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));

        setProbResult(
            `Z = ${z.toFixed(4)}\n` +
            `P(X ≤ ${x}) = ${(cdf * 100).toFixed(2)}%\n` +
            `P(X > ${x}) = ${((1 - cdf) * 100).toFixed(2)}%`
        );
    };

    const addRegPoint = () => {
        const nextId = Math.max(...regPoints.map(p => p.id)) + 1;
        setRegPoints([...regPoints, { id: nextId, x: regPoints.length + 1, y: 0 }]);
    };

    const removeRegPoint = (id: number) => {
        if (regPoints.length > 2) {
            setRegPoints(regPoints.filter(p => p.id !== id));
        }
    };

    const updateRegPoint = (id: number, field: 'x' | 'y', value: number) => {
        setRegPoints(regPoints.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const tabs = [
        { id: 'descriptive' as StatTab, label: 'Descriptiva', icon: BarChart3 },
        { id: 'regression' as StatTab, label: 'Regresión', icon: TrendingUp },
        { id: 'probability' as StatTab, label: 'Probabilidad', icon: LineChart },
    ];

    return (
        <div className="flex flex-col h-full bg-[#111111]">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-3 bg-[#111111] border-b-2 border-white/10">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all border border-white/10 shadow-xl hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] ${activeTab === tab.id
                            ? 'bg-primary text-white'
                            : 'bg-[#111111] text-white'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r-2 border-white/10">

                    {/* Descriptive Tab */}
                    {activeTab === 'descriptive' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">📊 Estadística Descriptiva</h2>
                                <p className="text-sm text-white">
                                    Ingresa datos separados por comas
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-white uppercase font-bold block mb-2">
                                    Datos
                                </label>
                                <textarea
                                    value={dataInput}
                                    onChange={(e) => setDataInput(e.target.value)}
                                    rows={4}
                                    className="w-full bg-[#111111] border border-white/10 rounded-2xl px-4 py-3 text-white font-mono focus:outline-none focus:border-primary resize-none"
                                    placeholder="1, 2, 3, 4, 5..."
                                />
                            </div>

                            <button
                                onClick={calculateDescriptive}
                                className="w-full py-3 bg-primary text-white font-bold rounded-2xl border border-white/10 transition-all shadow-xl hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                            >
                                Calcular Estadísticas
                            </button>
                        </div>
                    )}

                    {/* Regression Tab */}
                    {activeTab === 'regression' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">📈 Regresión Lineal</h2>
                                <p className="text-sm text-white">
                                    y = mx + b
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-white uppercase font-bold">Puntos (x, y)</label>
                                    <button
                                        onClick={addRegPoint}
                                        className="text-primary hover:underline text-sm flex items-center gap-1 font-bold"
                                    >
                                        <Plus size={14} /> Añadir
                                    </button>
                                </div>

                                {regPoints.map((point) => (
                                    <div key={point.id} className="flex items-center gap-2">
                                        <span className="text-white text-xs font-bold">x:</span>
                                        <input
                                            type="number"
                                            value={point.x}
                                            onChange={(e) => updateRegPoint(point.id, 'x', parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-[#111111] border border-white/10 rounded-2xl px-2 py-1 text-white font-mono"
                                        />
                                        <span className="text-white text-xs font-bold">y:</span>
                                        <input
                                            type="number"
                                            value={point.y}
                                            onChange={(e) => updateRegPoint(point.id, 'y', parseFloat(e.target.value) || 0)}
                                            className="w-20 bg-[#111111] border border-white/10 rounded-2xl px-2 py-1 text-white font-mono"
                                        />
                                        {regPoints.length > 2 && (
                                            <button
                                                onClick={() => removeRegPoint(point.id)}
                                                className="text-red-600 hover:text-red-700 font-bold"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={calculateRegression}
                                className="w-full py-3 bg-primary text-white font-bold rounded-2xl border border-white/10 transition-all shadow-xl hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                            >
                                Calcular Regresión
                            </button>
                        </div>
                    )}

                    {/* Probability Tab */}
                    {activeTab === 'probability' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">🎲 Distribución Normal</h2>
                                <p className="text-sm text-white">
                                    P(X ≤ x) para N(μ, σ)
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-white uppercase font-bold block mb-1">μ (media)</label>
                                    <input
                                        type="number"
                                        value={probMean}
                                        onChange={(e) => setProbMean(e.target.value)}
                                        className="w-full bg-[#111111] border border-white/10 rounded-2xl px-3 py-2 text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white uppercase font-bold block mb-1">σ (std)</label>
                                    <input
                                        type="number"
                                        value={probStd}
                                        onChange={(e) => setProbStd(e.target.value)}
                                        className="w-full bg-[#111111] border border-white/10 rounded-2xl px-3 py-2 text-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white uppercase font-bold block mb-1">x</label>
                                    <input
                                        type="number"
                                        value={probX}
                                        onChange={(e) => setProbX(e.target.value)}
                                        className="w-full bg-[#111111] border border-white/10 rounded-2xl px-3 py-2 text-white font-mono"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={calculateProbability}
                                className="w-full py-3 bg-primary text-white font-bold rounded-2xl border border-white/10 transition-all shadow-xl hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                            >
                                Calcular Probabilidad
                            </button>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col overflow-y-auto">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calculator size={20} className="text-white" />
                        Resultados
                    </h3>

                    {activeTab === 'descriptive' && descResult && (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['n', descResult.count],
                                ['Σ', descResult.sum.toFixed(2)],
                                ['Media (x̄)', descResult.mean.toFixed(4)],
                                ['Mediana', descResult.median.toFixed(4)],
                                ['Moda', descResult.mode.join(', ')],
                                ['Mín', descResult.min],
                                ['Máx', descResult.max],
                                ['Rango', descResult.range.toFixed(2)],
                                ['Varianza (σ²)', descResult.variance.toFixed(4)],
                                ['Desv. Est. (σ)', descResult.std.toFixed(4)],
                                ['Q1', descResult.q1?.toFixed(2)],
                                ['Q3', descResult.q3?.toFixed(2)],
                                ['IQR', descResult.iqr?.toFixed(2)],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-[#111111] border border-white/10 rounded-2xl p-3 shadow-xl">
                                    <div className="text-xs text-white uppercase font-bold">{label}</div>
                                    <div className="text-lg font-bold text-primary font-mono">{value}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'regression' && regResult && (
                        <div className="space-y-4">
                            <div className="p-6 bg-[#111111] border border-white/10 rounded-2xl shadow-xl">
                                <div className="text-2xl font-bold text-white font-mono">
                                    {regResult.equation}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 shadow-xl">
                                    <div className="text-xs text-white uppercase font-bold">Pendiente (m)</div>
                                    <div className="text-lg font-bold text-white font-mono">{regResult.slope.toFixed(6)}</div>
                                </div>
                                <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 shadow-xl">
                                    <div className="text-xs text-white uppercase font-bold">Intercepto (b)</div>
                                    <div className="text-lg font-bold text-white font-mono">{regResult.intercept.toFixed(6)}</div>
                                </div>
                                <div className="bg-[#111111] border border-white/10 rounded-2xl p-3 col-span-2 shadow-xl">
                                    <div className="text-xs text-white uppercase font-bold">Coeficiente R²</div>
                                    <div className="text-xl font-bold text-primary font-mono">{regResult.r2.toFixed(6)}</div>
                                    <div className="text-xs text-white mt-1 font-bold">
                                        {regResult.r2 >= 0.9 ? '✓ Muy buen ajuste' :
                                            regResult.r2 >= 0.7 ? '○ Ajuste aceptable' :
                                                '✗ Ajuste débil'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'probability' && probResult && (
                        <div className="p-6 bg-[#111111] border border-white/10 rounded-2xl shadow-xl">
                            <pre className="text-lg text-white font-mono whitespace-pre-wrap">
                                {probResult}
                            </pre>
                        </div>
                    )}

                    {!descResult && !regResult && !probResult && (
                        <div className="flex-1 flex items-center justify-center text-white">
                            <div className="text-center">
                                <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold">Ingresa datos y presiona Calcular</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsMode;
