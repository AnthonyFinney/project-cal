import React, { useState } from 'react';
import { Bell, Settings, LogIn, LogOut, Calculator, LineChart, Grid, BarChart3, Atom, MoreHorizontal } from 'lucide-react';
import { useCalculator, AngleMode } from '../CalculatorContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlan } from '../hooks/usePlan';
import { AppMode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import SettingsModal from './SettingsModal';
import UpgradeModal from './UpgradeModal';
import PlanBadge from './PlanBadge';

interface TopBarProps {
   onNavigate?: (mode: AppMode) => void;
   currentMode?: AppMode;
}

const TopBar: React.FC<TopBarProps> = ({ onNavigate, currentMode }) => {
   const { angleMode, setAngleMode } = useCalculator();
   const { user, loading, signOut } = useAuth();
   const { planStatus } = usePlan();
   const { notifications, markAllAsRead, unreadCount } = useNotifications();

   const [showAuthModal, setShowAuthModal] = useState(false);
   const [showSettingsModal, setShowSettingsModal] = useState(false);
   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
   const [showNotificaciones, setShowNotificaciones] = useState(false);
   const [showMoreApps, setShowMoreApps] = useState(false);

   const modes: AngleMode[] = ['DEG', 'RAD', 'GRAD'];

   const mainApps = [
      { mode: AppMode.CONSOLE, icon: Calculator, label: 'Console' },
      { mode: AppMode.GRAPHING, icon: LineChart, label: 'Graph' },
      { mode: AppMode.MATRIX, icon: Grid, label: 'Matrix' }
   ];

   const moreApps = [
      { mode: AppMode.EQUATIONS, label: 'Equations' },
      { mode: AppMode.VECTORS, label: 'Vectors' },
      { mode: AppMode.STATISTICS, label: 'Statistics', icon: BarChart3 },
      { mode: AppMode.COMPLEX, label: 'Complex', icon: Atom },
      { mode: AppMode.ACCOUNTING, label: 'Accounting' }
   ];

   return (
      <>
         <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-14 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-between px-4 shadow-2xl"
         >
            {/* Left: Brand & Angle Mode */}
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.(AppMode.CONSOLE)}>
                  <div className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                     <span className="font-serif italic text-lg leading-none">∫</span>
                  </div>
                  <span className="font-semibold text-sm tracking-widest uppercase hidden sm:block">CAS</span>
               </div>

               <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

               <div className="hidden sm:flex items-center gap-1 p-0.5 bg-black/50 rounded-full border border-white/10">
                  {modes.map(mode => (
                     <button
                        key={mode}
                        onClick={() => setAngleMode(mode)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                           angleMode === mode ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                        }`}
                     >
                        {mode}
                     </button>
                  ))}
               </div>
            </div>

            {/* Center: Navigation Pill */}
            <div className="flex items-center gap-1">
               {mainApps.map((app) => {
                  const Icon = app.icon;
                  const isActive = currentMode === app.mode;
                  return (
                     <button
                        key={app.mode}
                        onClick={() => onNavigate?.(app.mode)}
                        className={`relative px-3 py-1.5 flex items-center gap-2 rounded-full text-xs font-medium transition-colors ${
                           isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                     >
                        {isActive && (
                           <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-full border border-white/10" />
                        )}
                        <Icon size={14} className="relative z-10" />
                        <span className="relative z-10 hidden md:block">{app.label}</span>
                     </button>
                  );
               })}
               
               {/* More Apps Dropdown */}
               <div className="relative">
                  <button 
                     onClick={() => setShowMoreApps(!showMoreApps)}
                     className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                     <MoreHorizontal size={16} />
                  </button>
                  <AnimatePresence>
                     {showMoreApps && (
                        <motion.div 
                           initial={{ opacity: 0, y: 10, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 10, scale: 0.95 }}
                           className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 p-1"
                        >
                           {moreApps.map(app => (
                              <button
                                 key={app.mode}
                                 onClick={() => { onNavigate?.(app.mode); setShowMoreApps(false); }}
                                 className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                                    currentMode === app.mode ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                 }`}
                              >
                                 {app.icon && <app.icon size={12} />}
                                 {app.label}
                              </button>
                           ))}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
               {user && <PlanBadge status={planStatus} onClick={() => onNavigate?.(AppMode.DASHBOARD)} />}

               <div className="relative">
                  <button
                     onClick={() => setShowNotificaciones(!showNotificaciones)}
                     className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                     <Bell size={16} />
                     {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 size-2 bg-white rounded-full border border-black shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                     )}
                  </button>
                  {/* Notification Dropdown (Minimalist) */}
                  <AnimatePresence>
                     {showNotificaciones && (
                        <motion.div 
                           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                           className="absolute right-0 top-full mt-3 w-72 bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                        >
                           <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                              <h3 className="font-semibold text-xs text-white">Notifications</h3>
                              {unreadCount > 0 && <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                           </div>
                           <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              {(!notifications || notifications.length === 0) ? (
                                 <div className="p-6 text-center text-xs text-white/40">All caught up</div>
                              ) : notifications.map(n => (
                                 <div key={n.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-white/[0.02]' : ''}`}>
                                    <div className="flex gap-3">
                                       <span className="text-lg opacity-80">{n.icon}</span>
                                       <div>
                                          <p className="text-xs font-semibold text-white/90">{n.title}</p>
                                          <p className="text-[10px] text-white/60 mt-0.5">{n.message}</p>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <button onClick={markAllAsRead} className="w-full p-2 text-center text-[10px] text-white/40 hover:text-white bg-black/20 hover:bg-black/40 transition-colors">
                              Mark all as read
                           </button>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>

               <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
               >
                  <Settings size={16} />
               </button>

               <div className="w-px h-4 bg-white/20 mx-1 hidden sm:block"></div>

               {loading ? (
                  <div className="size-8 rounded-full bg-white/10 animate-pulse" />
               ) : user ? (
                  <button
                     onClick={() => signOut()}
                     className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                     title="Sign out"
                  >
                     <LogOut size={16} />
                  </button>
               ) : (
                  <button
                     onClick={() => setShowAuthModal(true)}
                     className="flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-full font-semibold text-xs hover:bg-white/90 transition-colors"
                  >
                     <LogIn size={14} />
                     <span className="hidden sm:inline">Sign In</span>
                  </button>
               )}
            </div>
         </motion.header>

         <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
         <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
         <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentPlan={planStatus?.plan} />
      </>
   );
};

export default TopBar;
