import React from 'react';
import { AppMode } from '../types';
import {
  Calculator, LineChart, LayoutGrid, Wallet,
  GraduationCap, Equal, BarChart3, Atom, ArrowRightLeft,
  Waves, Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {

  // Navigation Groups
  const groups = [
    {
      title: 'Núcleo',
      items: [
        { mode: AppMode.CONSOLE, icon: Calculator, label: 'Consola CAS' },
      ]
    },
    {
      title: 'Visualización',
      items: [
        {
          mode: AppMode.GRAPHING,
          icon: LineChart,
          label: 'Gráficas & Fourier',
          highlight: true
        },
      ]
    },
    {
      title: 'Álgebra Lineal',
      items: [
        { mode: AppMode.EQUATIONS, icon: Equal, label: 'Ecuaciones' },
        { mode: AppMode.MATRIX, icon: LayoutGrid, label: 'Matrices' },
        { mode: AppMode.VECTORS, icon: ArrowRightLeft, label: 'Vectores' },
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { mode: AppMode.STATISTICS, icon: BarChart3, label: 'Estadística' },
        { mode: AppMode.COMPLEX, icon: Atom, label: 'Complejos' },
        { mode: AppMode.ACCOUNTING, icon: Wallet, label: 'Contador PRO' },
      ]
    }
  ];

  return (
    <aside className="w-16 lg:w-64 bg-background border-r-4 border-black flex flex-col py-6 shrink-0 z-40 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 px-4 lg:px-6 mb-8 text-black shrink-0 group cursor-pointer" onClick={() => setMode(AppMode.CONSOLE)}>
        <div className="size-10 border-2 border-black bg-accent-yellow flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all">
          <span className="font-serif text-2xl italic font-bold">∫</span>
        </div>
        <div className="hidden lg:block relative">
          <h1 className="text-lg font-black tracking-tighter text-black leading-none uppercase">CAS</h1>
          <h1 className="text-lg font-black tracking-tighter text-primary leading-none uppercase">Cal</h1>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && group.title !== 'Núcleo' && (
              <h3 className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-black hidden lg:block">
                {group.title}
              </h3>
            )}

            <div className="flex flex-col gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.mode;
                const isHighlight = item.highlight;

                return (
                  <button
                    key={item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`flex items-center gap-3 px-3 py-3 border-2 border-black transition-all duration-100 group relative overflow-hidden text-left
                      ${isActive
                        ? 'bg-accent-yellow shadow-none translate-x-[2px] translate-y-[2px]'
                        : isHighlight
                          ? 'bg-accent-pink text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      }
                    `}
                  >
                    <div className={`relative ${isActive || isHighlight ? 'text-black' : ''}`}>
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 3 : 2}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                      {isHighlight && !isActive && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-black uppercase hidden lg:block`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Button */}
      <div className="mt-6 px-3 shrink-0">
        <button
          onClick={() => window.open('https://github.com/AldraAV/CASCal', '_blank')}
          className="w-full flex items-center gap-3 px-3 py-3 border-2 border-black bg-accent-green text-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <GraduationCap size={20} strokeWidth={2.5} />
          <span className="hidden lg:block">Feedback & Docs</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;