import React from 'react';
import { Pill, Activity, Scissors, AlertCircle } from 'lucide-react';

interface TreatmentSelectorProps {
    activeTreatment: number;
    setTreatment: (t: number) => void;
}

const TreatmentSelector: React.FC<TreatmentSelectorProps> = ({ activeTreatment, setTreatment }) => {
    const treatments = [
        { id: 0, label: 'Sin Tratamiento', icon: AlertCircle, color: 'gray-500' },
        { id: 1, label: 'Prednisona', icon: Pill, color: 'primary' },
        { id: 2, label: 'Inmunoglobulina (IVIG)', icon: Activity, color: 'blue-500' },
        { id: 3, label: 'Esplenectomía', icon: Scissors, color: 'red-500' },
    ];

    return (
        <div className="bg-white border-2 border-black rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-4">Protocolo de Intervención</h3>
            <div className="grid grid-cols-1 gap-3">
                {treatments.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTreatment === t.id;
                    
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTreatment(t.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-none transition-all border-2 border-black text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]
                                ${isActive 
                                    ? `bg-primary/20 text-black` 
                                    : 'bg-white text-black'
                                }
                            `}
                        >
                            <Icon size={18} />
                            <span className="text-sm font-medium">{t.label}</span>
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-6 p-4 bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] text-black italic">
                    * La eficacia del tratamiento se calcula dinámicamente en el motor EquaCore mediante parámetros farmacodinámicos ($E_{max}$).
                </p>
            </div>
        </div>
    );
};

export default TreatmentSelector;
