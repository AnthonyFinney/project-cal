import React from 'react';
import { Crown, Sparkles, User } from 'lucide-react';
import { usePlan, PlanStatus } from '../hooks/usePlan';

interface PlanBadgeProps {
    status: PlanStatus | null;
    onClick?: () => void;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ status, onClick }) => {
    // Fallback to free if status is null (e.g. backend offline or loading)
    const effectivePlan = status?.plan || 'free';

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'elite': return 'bg-pink-400 text-white border border-white/10 shadow-xl';
            case 'pro': return 'bg-blue-400 text-white border border-white/10 shadow-xl';
            case 'free': default: return 'bg-[#111111] text-white border border-white/10 shadow-xl';
        }
    };

    const getIcon = (plan: string) => {
        switch (plan) {
            case 'elite': return <Crown size={12} className="fill-black" />;
            case 'pro': return <Sparkles size={12} className="text-white" />;
            case 'free': default: return <User size={12} className="text-white" />;
        }
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-2 py-1 rounded-2xl border transition-all hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-xs font-bold ${getPlanColor(effectivePlan)}`}
        >
            {getIcon(effectivePlan)}
            <span className="uppercase tracking-wider">{effectivePlan}</span>
        </button>
    );
};

export default PlanBadge;
