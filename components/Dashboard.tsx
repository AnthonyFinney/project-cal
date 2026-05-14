import React from 'react';
import { usePlan } from '../hooks/usePlan';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Crown, Sparkles, Zap, CheckCircle, AlertTriangle, ArrowRight, Shield, Globe, Cpu } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

const Dashboard: React.FC = () => {
    const { planStatus, loading, refreshPlan } = usePlan();
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

    // Verify Stripe Payment
    React.useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const sessionId = query.get('session_id');

        if (sessionId) {
            console.log("Verifying payment...", sessionId);
            fetch(`http://localhost:8000/api/verify-session/${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert(`Upgrade Successful! Welcome to ${data.plan.toUpperCase()}.`);
                        refreshPlan(); // Reload plan hooks
                        // Clean URL
                        window.history.replaceState({}, '', '/dashboard');
                    }
                })
                .catch(err => console.error("Verification failed", err));
        }
    }, [refreshPlan]);

    if (loading || !planStatus) {
        return <div className="p-10 text-center animate-pulse text-gray-600 font-bold">Loading your dashboard...</div>;
    }

    const { plan, ai_calls_used, ai_calls_limit, worksheets_count, worksheets_limit } = planStatus;

    // Limits Display Logic
    const getLimitText = (limit: number | null) => limit === null ? '∞' : limit;
    const getUsagePercent = (used: number, limit: number | null) => {
        if (limit === null) return 0;
        return Math.min(100, (used / limit) * 100);
    };

    const aiPercent = getUsagePercent(ai_calls_used, ai_calls_limit);
    const worksheetsPercent = getUsagePercent(worksheets_count, worksheets_limit);

    // Dynamic color based on plan
    const planColor = plan === 'elite' ? 'bg-white/5' :
        plan === 'pro' ? 'bg-white/10' :
            'bg-background-dark';

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#111111] p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-7xl mx-auto space-y-8 pb-10">

                {/* Header Section */}
                <header className="flex justify-between items-end border-b-4 border-white/10 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Dashboard</h1>
                        <p className="text-white text-lg font-bold">Your command center for symbolic computation.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-black uppercase text-white">Billing Cycle Resets</p>
                        <p className="text-white font-mono font-bold">{new Date(planStatus.period_end).toLocaleDateString()}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Plan Status & Upsell */}
                    <div className="space-y-6">
                        {/* Current Plan Card */}
                        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 relative overflow-hidden group shadow-xl">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-4 rounded-2xl border border-white/10 ${planColor} shadow-xl`}>
                                        {plan === 'elite' ? <Crown size={32} className="text-white" /> :
                                            plan === 'pro' ? <Sparkles size={32} className="text-white" /> :
                                                <Zap size={32} className="text-white" />}
                                    </div>
                                    <div>
                                        <p className="text-white text-xs uppercase tracking-widest font-black">Current Plan</p>
                                        <h2 className="text-3xl font-black text-white uppercase">{plan} License</h2>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <FeatureRow icon={Cpu} text={`${getLimitText(ai_calls_limit)} AI Queries / mo`} active={true} />
                                    <FeatureRow icon={Globe} text={`${getLimitText(worksheets_limit)} Cloud Worksheets`} active={true} />
                                    <FeatureRow icon={Shield} text={plan === 'free' ? 'Community Support' : 'Priority Support'} active={plan !== 'free'} />
                                </div>

                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="w-full py-4 bg-primary border border-white/10 rounded-2xl text-white font-black uppercase shadow-xl hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    Manage Subscription
                                </button>
                            </div>
                        </div>

                        {/* Upgrade Prompt (Only for Free/Pro) */}
                        {plan !== 'elite' && (
                            <div className="bg-white/10 border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-xl">
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Unlock More Power</h3>
                                <p className="text-white text-sm font-bold mb-6">Upgrade to {plan === 'free' ? 'Pro' : 'Elite'} for higher limits and faster processing.</p>
                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="flex items-center gap-2 text-white font-black uppercase hover:underline group"
                                >
                                    View Plans <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Usage Metrics & Visualization */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Usage Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <UsageCard
                                title="AI Processing"
                                used={ai_calls_used}
                                limit={ai_calls_limit}
                                percent={aiPercent}
                                icon={<Cpu size={24} />}
                            />
                            <UsageCard
                                title="Cloud Storage"
                                used={worksheets_count}
                                limit={worksheets_limit}
                                percent={worksheetsPercent}
                                icon={<Globe size={24} />}
                            />
                        </div>

                        {/* Analytic Chart */}
                        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 h-96 flex flex-col shadow-xl">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <span className="w-2 h-8 bg-white/5 rounded-2xl border border-white/10"></span>
                                Usage Analytics
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'AI Requests', used: ai_calls_used, limit: ai_calls_limit || 100 },
                                        { name: 'Worksheets', used: worksheets_count, limit: worksheets_limit || 10 }
                                    ]} barSize={50}>
                                        <XAxis dataKey="name" stroke="#000" fontSize={12} tickLine={true} axisLine={true} tick={{ fontWeight: 'black', fill: '#000' }} />
                                        <YAxis stroke="#000" fontSize={12} tickLine={true} axisLine={true} tick={{ fontWeight: 'black', fill: '#000' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                            contentStyle={{ backgroundColor: '#fff', borderColor: '#000', borderRadius: '0px', borderWidth: '4px', boxShadow: '4px 4px 0px 0px #000' }}
                                            itemStyle={{ fontWeight: 'black', color: '#000' }}
                                        />
                                        <Bar dataKey="used" radius={[0, 0, 0, 0]}>
                                            {
                                                [0, 1].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ff5a1f' : '#00ead3'} stroke="#000" strokeWidth={3} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integration with UpgradeModal */}
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentPlan={plan}
                />
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const FeatureRow = ({ icon: Icon, text, active }: { icon: any, text: string, active: boolean }) => (
    <div className={`flex items-center gap-3 ${active ? 'text-white' : 'text-white/50'}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{text}</span>
        {active && <CheckCircle size={14} className="text-primary ml-auto" />}
    </div>
);

const UsageCard = ({ title, used, limit, percent, icon }: { title: string, used: number, limit: number | null, percent: number, icon: any }) => (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#111111] border border-white/10 rounded-2xl text-white shadow-xl">{icon}</div>
            <span className={`text-xs font-bold px-2 py-1 rounded-2xl border border-white/10 shadow-xl ${percent >= 100 ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                {percent.toFixed(0)}%
            </span>
        </div>
        <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white mb-4">
            {used} <span className="text-lg text-white/40">/ {limit === null ? '∞' : limit}</span>
        </p>
        <div className="w-full h-3 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
            <div
                className={`h-full border-r border-white/10 transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${percent}%` }}
            />
        </div>
    </div>
);

export default Dashboard;
