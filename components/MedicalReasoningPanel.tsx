import React from 'react';
import { Sparkles, BookOpen, Stethoscope, ChevronDown } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MedicalReasoningPanelProps {
    narrative?: string;
    steps?: any[];
    interpretation?: string;
}

const MedicalReasoningPanel: React.FC<MedicalReasoningPanelProps> = ({ narrative, steps, interpretation }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:col-span-3">
            
            {/* Narrativa Clínica (AIExplainer) */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-white mb-4">
                    <Sparkles size={20} />
                    <h3 className="font-bold text-lg">Narrativa Clínica Asistida</h3>
                </div>
                
                {interpretation && (
                    <div className="p-4 bg-[#111111] border border-white/10 rounded-2xl mb-4 shadow-xl">
                        <div className="flex items-center gap-2 text-white text-xs font-bold uppercase mb-1">
                            <Stethoscope size={14} /> Análisis de Remisión
                        </div>
                        <p className="text-white text-sm font-bold leading-relaxed">{interpretation}</p>
                    </div>
                )}

                <div className="text-white text-sm font-medium leading-relaxed whitespace-pre-line prose max-w-none">
                    {narrative || "Inicie la simulación para generar un análisis clínico profundo..."}
                </div>
            </div>

            {/* Desglose Simbólico (SymbolicExplainer) */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 space-y-6 shadow-xl">
                <div className="flex items-center gap-2 text-white mb-4">
                    <BookOpen size={20} />
                    <h3 className="font-bold text-lg">Desglose Matemático (Steps)</h3>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {steps ? steps.map((step, idx) => (
                        <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 150}ms` }}>
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                                <span className="size-6 rounded-2xl bg-primary border border-white/10 text-white flex items-center justify-center text-[10px] font-bold shadow-xl">{idx + 1}</span>
                                {step.title}
                            </h4>
                            <div className="p-4 bg-[#111111] border border-white/10 rounded-2xl shadow-xl overflow-x-auto text-white">
                                <BlockMath math={step.latex} />
                            </div>
                            <p className="text-xs text-white font-bold italic">{step.description}</p>
                            {idx < steps.length - 1 && <div className="border-b-2 border-white/10 pt-2" />}
                        </div>
                    )) : (
                        <div className="text-center py-20">
                            <div className="text-white">
                                <BlockMath math={"\\int \\text{BioLogic} \\, dt"} />
                            </div>
                            <p className="text-white font-bold text-sm mt-4">Esperando parámetros de simulación...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicalReasoningPanel;
