/**
 * CAS Cal - Graphing Mode
 * 
 * Wrapper component with mode toggle between:
 * - Standard: Traditional function graphing
 * - Epicycles PRO: Fourier visualization with drawing support
 */

import React, { useState } from 'react';
import { LineChart, CircleDot, Sparkles } from 'lucide-react';
import StandardGraphing from './StandardGraphing';
import EpicyclesPRO from './EpicyclesPRO';

type GraphMode = 'standard' | 'epicycles';

const GraphingMode: React.FC = () => {
  const [mode, setMode] = useState<GraphMode>('standard');

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Mode Toggle */}
      <div className="flex items-center gap-3 p-4 border-b-4 border-white/10 shrink-0">
        <span className="text-[10px] text-white font-black uppercase tracking-widest mr-2">Modo:</span>
        <button
          onClick={() => setMode('standard')}
          className={`flex items-center gap-2 px-6 py-2 border border-white/10 text-sm font-black transition-all ${mode === 'standard'
            ? 'bg-white/10 shadow-none translate-x-[1px] translate-y-[1px]'
            : 'bg-[#111111] hover:bg-gray-100 text-white shadow-xl'
            }`}
        >
          <LineChart size={16} strokeWidth={3} />
          ESTÁNDAR
        </button>
        <button
          onClick={() => setMode('epicycles')}
          className={`flex items-center gap-2 px-6 py-2 border border-white/10 text-sm font-black transition-all ${mode === 'epicycles'
            ? 'bg-white/5 text-white shadow-none translate-x-[1px] translate-y-[1px]'
            : 'bg-[#111111] hover:bg-gray-100 text-white shadow-xl'
            }`}
        >
          <Sparkles size={16} strokeWidth={3} />
          EPICYCLES PRO
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'standard' ? <StandardGraphing /> : <EpicyclesPRO />}
      </div>
    </div>
  );
};

export default GraphingMode;