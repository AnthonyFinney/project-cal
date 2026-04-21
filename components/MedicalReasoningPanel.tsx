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
            <div className="bg-white border-2 border-black rounded-none p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 text-black mb-4">
                    <Sparkles size={20} />
                    <h3 className="font-bold text-lg">Narrativa Clínica Asistida</h3>
                </div>
                
                {interpretation && (
                    <div className="p-4 bg-white border-2 border-black rounded-none mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 text-black text-xs font-bold uppercase mb-1">
                            <Stethoscope size={14} /> Análisis de Remisión
                        </div>
                        <p className="text-black text-sm font-bold leading-relaxed">{interpretation}</p>
                    </div>
                )}

                <div className="text-black text-sm font-medium leading-relaxed whitespace-pre-line prose max-w-none">
                    {narrative || "Inicie la simulación para generar un análisis clínico profundo..."}
                </div>
            </div>

            {/* Desglose Simbólico (SymbolicExplainer) */}
            <div className="bg-white border-2 border-black rounded-none p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 text-black mb-4">
                    <BookOpen size={20} />
                    <h3 className="font-bold text-lg">Desglose Matemático (Steps)</h3>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {steps ? steps.map((step, idx) => (
                        <div key={idx} className="space-y-3 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${idx * 150}ms` }}>
                            <h4 className="text-black font-bold text-sm flex items-center gap-2">
                                <span className="size-6 rounded-none bg-primary border-2 border-black text-black flex items-center justify-center text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{idx + 1}</span>
                                {step.title}
                            </h4>
                            <div className="p-4 bg-white border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-x-auto text-black">
                                <BlockMath math={step.latex} />
                            </div>
                            <p className="text-xs text-black font-bold italic">{step.description}</p>
                            {idx < steps.length - 1 && <div className="border-b-2 border-black pt-2" />}
                        </div>
                    )) : (
                        <div className="text-center py-20">
                            <div className="text-black">
                                <BlockMath math={"\\int \\text{BioLogic} \\, dt"} />
                            </div>
                            <p className="text-black font-bold text-sm mt-4">Esperando parámetros de simulación...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicalReasoningPanel;
