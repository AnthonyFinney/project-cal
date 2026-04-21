/**
 * CAS Cal - Equations Mode
 * 
 * Solve single equations and systems of equations:
 * - Single: x² + 2x - 3 = 0
 * - Systems: { 2x + y = 5, x - y = 1 }
 * - Inequalities: x² - 4 > 0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Play, X, ArrowRight } from 'lucide-react';
// @ts-ignore
import nerdamer from 'nerdamer';
import 'nerdamer/Solve';
import MathDisplay from './MathDisplay';

type EquationType = 'single' | 'system' | 'inequality';

interface Equation {
    id: number;
    lhs: string;
    rhs: string;
}

const EquationsMode: React.FC = () => {
    const [eqType, setEqType] = useState<EquationType>('single');
    const [equations, setEquations] = useState<Equation[]>([
        { id: 1, lhs: 'x^2 + 2x - 3', rhs: '0' }
    ]);
    const [variable, setVariable] = useState('x');
    const [result, setResult] = useState<string | null>(null);
    const [steps, setSteps] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const addEquation = () => {
        const nextId = Math.max(...equations.map(e => e.id)) + 1;
        setEquations([...equations, { id: nextId, lhs: '', rhs: '0' }]);
    };

    const removeEquation = (id: number) => {
        if (equations.length > 1) {
            setEquations(equations.filter(e => e.id !== id));
        }
    };

    const updateEquation = (id: number, field: 'lhs' | 'rhs', value: string) => {
        setEquations(equations.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const solveSingle = () => {
        try {
            const eq = equations[0];
            const fullEq = `${eq.lhs}-(${eq.rhs})`;

            // Solve using Nerdamer
            const solutions = nerdamer.solve(fullEq, variable);
            const solutionStr = solutions.toString();

            // Parse solutions
            const solArray = solutionStr
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .filter((s: string) => s.trim());

            setSteps([
                `Ecuación: ${eq.lhs} = ${eq.rhs}`,
                `Forma estándar: ${fullEq} = 0`,
                `Resolviendo para ${variable}...`
            ]);

            if (solArray.length === 0) {
                setResult('\\text{Sin solución}');
            } else if (solArray.length === 1) {
                setResult(`${variable} = ${solArray[0]}`);
            } else {
                setResult(`${variable} = ${solArray.join(', ')}`);
            }
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error solving equation');
            setResult(null);
        }
    };

    const solveSystem = () => {
        try {
            // Build system for Nerdamer
            const eqs = equations.map(eq => `${eq.lhs}-(${eq.rhs})`);
            const vars = variable.split(',').map(v => v.trim());

            // Nerdamer solve system
            const solution = nerdamer.solveEquations(eqs, vars);

            setSteps([
                'Sistema de ecuaciones:',
                ...equations.map(eq => `  ${eq.lhs} = ${eq.rhs}`),
                `Incógnitas: ${vars.join(', ')}`
            ]);

            // Format solution
            const solParts = vars.map((v, i) => `${v} = ${solution[i]}`);
            setResult(solParts.join(', \\quad '));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error solving system');
            setResult(null);
        }
    };

    const solveInequality = () => {
        try {
            const eq = equations[0];
            // Basic inequality solving (limited in Nerdamer)
            const fullExpr = `${eq.lhs}-(${eq.rhs})`;

            setSteps([
                `Desigualdad: ${eq.lhs} > ${eq.rhs}`,
                `Analizando: ${fullExpr} > 0`
            ]);

            // Find critical points (where expression = 0)
            const solutions = nerdamer.solve(fullExpr, variable);
            const criticalPoints = solutions.toString()
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .filter((s: string) => s.trim());

            if (criticalPoints.length > 0) {
                setResult(`\\text{Puntos críticos: } ${variable} = ${criticalPoints.join(', ')}`);
                setSteps([...steps, `Evaluar signos en intervalos: (-∞, ${criticalPoints[0]}), ...`]);
            } else {
                setResult('\\text{Verificar signo en todo } \\mathbb{R}');
            }
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error analyzing inequality');
            setResult(null);
        }
    };

    const solve = () => {
        setResult(null);
        setSteps([]);
        setError(null);

        switch (eqType) {
            case 'single':
                solveSingle();
                break;
            case 'system':
                solveSystem();
                break;
            case 'inequality':
                solveInequality();
                break;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Type Selector */}
            <div className="flex items-center gap-2 p-3 bg-white border-b-2 border-black">
                <span className="text-xs text-black uppercase tracking-wider mr-2 font-black">Tipo:</span>
                {(['single', 'system', 'inequality'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => {
                            setEqType(type);
                            if (type === 'single') {
                                setEquations([{ id: 1, lhs: 'x^2 + 2x - 3', rhs: '0' }]);
                                setVariable('x');
                            } else if (type === 'system') {
                                setEquations([
                                    { id: 1, lhs: '2x + y', rhs: '5' },
                                    { id: 2, lhs: 'x - y', rhs: '1' }
                                ]);
                                setVariable('x, y');
                            } else {
                                setEquations([{ id: 1, lhs: 'x^2 - 4', rhs: '0' }]);
                                setVariable('x');
                            }
                            setResult(null);
                            setSteps([]);
                        }}
                        className={`px-4 py-2 rounded-none text-sm font-black transition-all border-2 border-black ${eqType === type
                            ? 'bg-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
                            }`}
                    >
                        {type === 'single' && 'Ecuación'}
                        {type === 'system' && 'Sistema'}
                        {type === 'inequality' && 'Desigualdad'}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r-2 border-black">
                    <h2 className="text-xl font-black text-black mb-4">
                        {eqType === 'single' && '📐 Resolver Ecuación'}
                        {eqType === 'system' && '📊 Resolver Sistema'}
                        {eqType === 'inequality' && '⚖️ Analizar Desigualdad'}
                    </h2>

                    {/* Equations Input */}
                    <div className="space-y-3 mb-6">
                        {equations.map((eq, idx) => (
                            <div key={eq.id} className="flex items-center gap-2">
                                {eqType === 'system' && (
                                    <span className="text-black/60 text-xs w-8 font-black">({idx + 1})</span>
                                )}
                                <div className="flex-1 flex items-center gap-2 bg-white border-2 border-black rounded-none p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <input
                                        type="text"
                                        value={eq.lhs}
                                        onChange={(e) => updateEquation(eq.id, 'lhs', e.target.value)}
                                        placeholder="x^2 + 2x"
                                        className="flex-1 bg-transparent text-black font-mono focus:outline-none"
                                    />
                                    <span className="text-primary font-black">
                                        {eqType === 'inequality' ? '>' : '='}
                                    </span>
                                    <input
                                        type="text"
                                        value={eq.rhs}
                                        onChange={(e) => updateEquation(eq.id, 'rhs', e.target.value)}
                                        placeholder="0"
                                        className="w-24 bg-transparent text-black font-mono focus:outline-none text-right"
                                    />
                                </div>
                                {equations.length > 1 && (
                                    <button
                                        onClick={() => removeEquation(eq.id)}
                                        className="text-red-600 hover:text-red-500 border-2 border-black p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {eqType === 'system' && (
                        <button
                            onClick={addEquation}
                            className="text-primary hover:text-black font-black text-sm flex items-center gap-1 mb-6"
                        >
                            <Plus size={14} /> Añadir ecuación
                        </button>
                    )}

                    {/* Variable Input */}
                    <div className="mb-6">
                        <label className="text-xs text-black uppercase font-black block mb-1">
                            {eqType === 'system' ? 'Variables (separadas por coma)' : 'Variable'}
                        </label>
                        <input
                            type="text"
                            value={variable}
                            onChange={(e) => setVariable(e.target.value)}
                            className="w-full bg-white border-2 border-black rounded-none px-4 py-2 text-black font-mono focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                    </div>

                    {/* Solve Button */}
                    <button
                        onClick={solve}
                        className="w-full py-3 bg-primary text-white font-black rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                    >
                        <Play size={18} />
                        Resolver
                    </button>
                </div>

                {/* Result Panel */}
                <div className="hidden lg:flex w-1/2 p-6 flex-col">
                    <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
                        <ArrowRight size={20} className="text-primary" />
                        Solución
                    </h3>

                    {error && (
                        <div className="p-4 bg-red-200 border-2 border-red-800 text-red-800 rounded-none font-bold mb-4">
                            {error}
                        </div>
                    )}

                    {result ? (
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Big Result */}
                            <div className="p-6 bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <MathDisplay expression={result} />
                            </div>

                            {/* Steps */}
                            {steps.length > 0 && (
                                <div className="flex-1 bg-white border-2 border-black rounded-none p-4 overflow-y-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <h4 className="text-sm font-black text-black/60 uppercase mb-3">Pasos</h4>
                                    <ul className="space-y-2 text-sm font-mono">
                                        {steps.map((step, i) => (
                                            <li key={i} className="text-black flex items-start gap-2">
                                                <span className="text-primary font-black">{i + 1}.</span>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-black/40">
                            <div className="text-center">
                                <X size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold">Ingresa una ecuación y presiona Resolver</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EquationsMode;
