import React from 'react';
import { User, Calendar, ShieldAlert, HeartPulse } from 'lucide-react';

const PatientCard: React.FC = () => {
    return (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-4 mb-2">
                <div className="size-12 rounded-2xl bg-blue-400 border border-white/10 flex items-center justify-center text-white">
                    <User size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">José M.</h3>
                    <div className="flex items-center gap-2 text-white text-xs font-bold">
                        <Calendar size={12} />
                        <span>12 años, Masculino</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white font-medium">Diagnóstico:</span>
                    <span className="text-red-600 font-bold px-2 py-0.5 bg-[#111111] border border-white/10 rounded-2xl">PTI Severa</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white font-medium">Peso:</span>
                    <span className="text-white font-bold">42 kg</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white font-medium">Estado Inmune:</span>
                    <span className="text-white font-bold flex items-center gap-1">
                        <ShieldAlert size={14} className="text-orange-600" /> Reactivo
                    </span>
                </div>
            </div>

            <div className="pt-4 border-t-2 border-white/10">
                <div className="flex items-center gap-2 text-white text-xs font-bold uppercase mb-2">
                    <HeartPulse size={14} />
                    Simbología Médica
                </div>
                <p className="text-[10px] text-white leading-relaxed font-bold">
                    $P(t)$: Recuento de plaquetas poblacional.<br/>
                    $A(t)$: Anticuerpos anti-plaquetarios activos.
                </p>
            </div>
        </div>
    );
};

export default PatientCard;
