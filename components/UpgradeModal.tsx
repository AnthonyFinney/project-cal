import React from 'react';
import { X, Check } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan?: 'free' | 'pro' | 'elite';
}

import { useAuth } from '../contexts/AuthContext';

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, currentPlan = 'free' }) => {
    const { user } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'yearly'>('monthly');

    if (!isOpen) return null;

    const getPrice = (monthly: number) => {
        if (billingPeriod === 'yearly') {
            const annual = monthly * 12 * 0.85; // 15% discount
            return (annual / 12).toFixed(2);
        }
        return monthly.toFixed(2);
    };

    const handleUpgrade = async (plan: 'pro' | 'elite') => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan,
                    user_id: user.id,
                    email: user.email
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe
            } else {
                alert('Error initiating checkout');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to payment server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-black hover:bg-gray-100 z-10 p-1 border-2 border-black rounded-none transition-all">
                    <X size={24} />
                </button>

                {/* Billing Toggle */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex bg-white p-1 rounded-none border-2 border-black scale-90 md:scale-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <button 
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-4 py-1.5 rounded-none text-xs font-black transition-all ${billingPeriod === 'monthly' ? 'bg-primary text-white' : 'text-black hover:bg-gray-100'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-4 py-1.5 rounded-none text-xs font-black transition-all flex items-center gap-2 ${billingPeriod === 'yearly' ? 'bg-primary text-white' : 'text-black hover:bg-gray-100'}`}
                    >
                        Yearly
                        <span className="bg-emerald-200 text-emerald-800 px-1.5 py-0.5 border border-emerald-800 rounded-none text-[10px]">-15%</span>
                    </button>
                </div>

                {/* Free Plan */}
                <div className="flex-1 p-8 pt-20 md:pt-16 flex flex-col border-b-2 md:border-b-0 md:border-r-2 border-black bg-white">
                    <h3 className="text-xl font-black text-black mb-2">Free</h3>
                    <div className="text-3xl font-black text-black mb-6">$0<span className="text-sm font-normal text-black/60">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-green-600" strokeWidth={3} /> Basic Math Engine</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-green-600" strokeWidth={3} /> 20 AI Calls / month</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-green-600" strokeWidth={3} /> 5 Cloud Worksheets</li>
                    </ul>
                    <button disabled className="w-full py-2 rounded-none border-2 border-black bg-gray-100 text-black/40 text-sm font-black cursor-not-allowed">
                        {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="flex-1 p-8 pt-16 md:pt-16 flex flex-col border-b-2 md:border-b-0 md:border-r-2 border-black bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1 border-b-2 border-l-2 border-black uppercase tracking-tight">POPUlar</div>
                    <h3 className="text-xl font-black text-blue-600 mb-2">Pro</h3>
                    <div className="text-3xl font-black text-black mb-6">${getPrice(4.99)}<span className="text-sm font-normal text-black/60">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-blue-600" strokeWidth={3} /> Fast Math Engine</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-blue-600" strokeWidth={3} /> 200 AI Calls / month</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-blue-600" strokeWidth={3} /> 50 Cloud Worksheets</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-blue-600" strokeWidth={3} /> Priority Support</li>
                    </ul>
                    <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={currentPlan === 'pro' || loading}
                        className={`w-full py-2 rounded-none text-white text-sm font-black transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${currentPlan === 'pro' ? 'bg-gray-100 text-black/40 cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {loading ? 'Processing...' : currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
                    </button>
                </div>

                {/* Elite Plan */}
                <div className="flex-1 p-8 pt-16 md:pt-16 flex flex-col border-b-2 md:border-b-0 md:border-r-2 border-black bg-white">
                    <h3 className="text-xl font-black text-purple-600 mb-2">Elite</h3>
                    <div className="text-3xl font-black text-black mb-6">${getPrice(14.99)}<span className="text-sm font-normal text-black/60">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-purple-600" strokeWidth={3} /> Everything in Pro</li>
                        <li className="flex gap-2 text-sm text-black font-black"><Check size={16} className="text-purple-600" strokeWidth={3} /> Unlimited AI</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-purple-600" strokeWidth={3} /> Unlimited Worksheets</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-purple-600" strokeWidth={3} /> Teacher Mode (Docs)</li>
                    </ul>
                    <button
                        onClick={() => handleUpgrade('elite')}
                        disabled={currentPlan === 'elite' || loading}
                        className={`w-full py-2 rounded-none text-white text-sm font-black transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${currentPlan === 'elite' ? 'bg-gray-100 text-black/40 cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]' : 'bg-purple-600 hover:bg-purple-500'}`}
                    >
                        {loading ? 'Processing...' : currentPlan === 'elite' ? 'Current Plan' : 'Get Elite'}
                    </button>
                </div>

                {/* Institutional Plan */}
                <div className="flex-1 p-8 pt-16 md:pt-16 flex flex-col bg-white">
                    <h3 className="text-xl font-black text-emerald-600 mb-2">Institucional</h3>
                    <div className="text-3xl font-black text-black mb-6">$99.00<span className="text-sm font-normal text-black/60">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-emerald-600" strokeWidth={3} /> Multi-usuario</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-emerald-600" strokeWidth={3} /> Admin Dashboard</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-emerald-600" strokeWidth={3} /> API Access</li>
                        <li className="flex gap-2 text-sm text-black font-medium"><Check size={16} className="text-emerald-600" strokeWidth={3} /> 24/7 Dedicated Support</li>
                    </ul>
                    <button
                        onClick={() => window.open('mailto:comercial@aldra.av', '_blank')}
                        className="w-full py-2 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        Contact Sales
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UpgradeModal;
