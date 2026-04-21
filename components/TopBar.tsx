import React, { useState } from 'react';
import { User, Settings, Bell, Search, LogIn, LogOut } from 'lucide-react';
import { useCalculator, AngleMode } from '../CalculatorContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlan } from '../hooks/usePlan';
import AuthModal from './AuthModal';
import SettingsModal from './SettingsModal';
import UpgradeModal from './UpgradeModal';
import PlanBadge from './PlanBadge';

interface TopBarProps {
   onNavigate?: (mode: any) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onNavigate }) => {
   const { angleMode, setAngleMode } = useCalculator();
   const { user, loading, signOut } = useAuth();
   const { planStatus, refreshPlan } = usePlan();

   const [showAuthModal, setShowAuthModal] = useState(false);
   const [showSettingsModal, setShowSettingsModal] = useState(false);
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
   const [showNotificaciones, setShowNotificaciones] = useState(false);

   const modes: AngleMode[] = ['DEG', 'RAD', 'GRAD'];

   // Real Notificaciones
   const { notifications, markAllAsRead, unreadCount } = useNotifications();

   return (
      <>
         <header className="h-16 bg-background border-b-4 border-black flex items-center justify-between px-6 sticky top-0 z-30">

            {/* Search / Context */}
            <div className="flex items-center gap-4 flex-1">
               {/* Search Input (Hidden on mobile) */}
               <div className="relative group hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} strokeWidth={2.5} />
                  <input
                     type="text"
                     placeholder="Buscar funciones..."
                     className="bg-white border-2 border-black py-2 pl-10 pr-4 text-sm text-black font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-64 transition-all"
                  />
               </div>

               {/* Angle Mode Toggle */}
               <div className="flex items-center gap-1 border-2 border-black p-1 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {modes.map(mode => (
                     <button
                        key={mode}
                        onClick={() => setAngleMode(mode)}
                        className={`px-3 py-1 text-xs font-black transition-all ${angleMode === mode
                           ? 'bg-primary text-white'
                           : 'text-black hover:bg-accent-yellow'
                           }`}
                     >
                        {mode}
                     </button>
                  ))}
               </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
               {/* Plan Badge (Only if logged in) */}
               {user && (
                  <PlanBadge status={planStatus} onClick={() => onNavigate && onNavigate('dashboard')} />
               )}

               <div className="relative">
                  <button
                     onClick={() => setShowNotificaciones(!showNotificaciones)}
                     className="p-2 border-2 border-black bg-accent-green shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all relative"
                  >
                     <Bell size={20} strokeWidth={2.5} />
                     {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-3 bg-red-500 border-2 border-black rounded-full"></span>
                     )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotificaciones && (
                     <div className="absolute right-0 top-full mt-3 w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50">
                        {/* ... (Existing Notification UI) ... */}
                        <div className="p-3 border-b-2 border-black bg-accent-yellow flex justify-between items-center">
                           <h3 className="font-black text-sm uppercase">Notificaciones</h3>
                           <span className="text-[10px] font-black border border-black px-1">{unreadCount}</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                           {(!notifications || notifications.length === 0) ? (
                              <div className="p-4 text-center font-bold text-xs uppercase">No Notificaciones</div>
                           ) : notifications.map(n => (
                              <div key={n.id} className={`p-4 border-b-2 border-black hover:bg-accent-light transition-colors ${!n.read ? 'bg-accent-green/10' : ''}`}>
                                 <div className="flex gap-3">
                                   <span className="text-xl">{n.icon}</span>
                                   <div>
                                       <p className="text-sm font-black text-black leading-tight uppercase">{n.title}</p>
                                       <p className="text-xs font-bold text-black mt-1 leading-relaxed">{n.message}</p>
                                       <p className="text-[10px] font-black mt-2 uppercase">{n.time}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="p-2 border-t-2 border-black bg-background-dark text-center">
                           <button onClick={markAllAsRead} className="text-xs font-black uppercase text-black hover:underline">Marcar como leído</button>
                        </div>
                     </div>
                  )}
               </div>
               <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 border-2 border-black bg-accent-pink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
               >
                  <Settings size={20} strokeWidth={2.5} />
               </button>

               {/* User / Auth Section */}
               <div className="flex items-center gap-3 pl-4 border-l-2 border-black">
                  {loading ? (
                     <div className="size-9 border-2 border-black bg-gray-200 animate-pulse" />
                  ) : user ? (
                     <>
                        <div className="text-right hidden md:block">
                           <p className="text-xs font-black text-black leading-none uppercase truncate max-w-[120px]">
                              {user.email?.split('@')[0]}
                           </p>
                           <p className="text-[10px] font-black text-accent-green">ON</p>
                        </div>
                        <button
                           onClick={() => signOut()}
                           className="size-9 border-2 border-black bg-accent-yellow flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                           title="Sign out"
                        >
                           <LogOut size={16} strokeWidth={3} />
                        </button>
                     </>
                  ) : (
                     <button
                        onClick={() => setShowAuthModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary border-2 border-black text-white font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                     >
                        <LogIn size={16} strokeWidth={3} />
                        <span className="hidden md:inline">Iniciar Sesión</span>
                     </button>
                  )}
               </div>
            </div>
         </header>

         <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
         <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
         <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentPlan={planStatus?.plan} />
      </>
   );
};

export default TopBar;
