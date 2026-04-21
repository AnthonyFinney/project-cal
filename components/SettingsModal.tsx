import React, { useState, useEffect } from 'react';
import { X, Server, Cpu, Activity, Info, Volume2, Shield, Settings } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const checkBackend = async () => {
            const start = Date.now();
            try {
                const url = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
                // Simple ping if endpoint exists, or just fetch root/health
                await fetch(url + '/', { method: 'GET' });
                setBackendStatus('online');
                setLatency(Date.now() - start);
            } catch (e: any) {
                console.error("Backend Check Error:", e);
                setBackendStatus('offline');
                // Temporary: Show error in latency field to debug
                setLatency(e.message || 'Error');
            }
        };
        checkBackend();
    }, [isOpen]);

    const InfoRow = ({ icon: Icon, label, value, status }: any) => (
        <div className="flex items-center justify-between p-3 bg-white rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
                <Icon size={18} className="text-black" />
                <span className="text-sm text-black font-bold">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-bold ${status === 'online' ? 'text-green-600' : status === 'offline' ? 'text-red-600' : 'text-black'}`}>
                    {value}
                </span>
                {status === 'online' && <div className="size-2 rounded-none border border-black bg-green-500" />}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/60 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-black bg-white">
                    <h2 className="text-lg font-bold text-black flex items-center gap-2">
                        <Settings size={20} /> System Status
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-none border-2 border-black transition-all">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="text-xs font-bold text-black uppercase tracking-wider mb-2">Connectivity</div>

                    <InfoRow
                        icon={Server}
                        label="Backend API"
                        value={backendStatus === 'checking' ? 'Checking...' : backendStatus === 'online' ? `Online (${latency}ms)` : `Offline (${latency})`}
                        status={backendStatus}
                    />

                    <InfoRow
                        icon={Cpu}
                        label="Compute Engine"
                        value="Nerdamer (Client) + SymPy (Cloud)"
                        status="online"
                    />

                    <div className="text-xs font-bold text-black uppercase tracking-wider mb-2 mt-6">Application</div>

                    <InfoRow icon={Activity} label="Version" value="v1.0.0-beta" />
                    <InfoRow icon={Volume2} label="Audio Engine" value="Web Audio API (Synth)" />
                    <InfoRow icon={Shield} label="Session" value="Secure" />

                </div>

                <div className="p-4 border-t-2 border-black bg-white text-center">
                    <p className="text-xs text-black font-bold">CAS Cal &copy; 2026</p>
                </div>
            </div>
        </div>
    );
};

// Export Settings icon for consistency if needed elsewhere
export { Settings };

export default SettingsModal;
