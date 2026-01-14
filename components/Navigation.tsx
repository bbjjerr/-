import React from 'react';
import { ScreenName } from '../types';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { icon: 'medical_services', label: '医生', screen: ScreenName.DOCTOR_SEARCH, filled: true },
    { icon: 'chat', label: '聊天', screen: ScreenName.CHAT_LIST },
    { icon: 'pets', label: '爱宠', screen: ScreenName.PET_PROFILE },
    { icon: 'person', label: '我的', screen: ScreenName.USER_PROFILE },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#191919]/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.screen)}
              className={`flex-1 flex flex-col items-center gap-1 transition-colors group p-2 ${isActive ? 'text-primary dark:text-white relative' : 'text-neutral-400 hover:text-primary dark:hover:text-white'}`}
            >
              {isActive && (
                <div className="w-8 h-1 bg-primary dark:bg-white rounded-full absolute -top-2"></div>
              )}
              <span className={`material-symbols-outlined text-[26px] ${isActive ? 'material-symbols-filled' : 'group-hover:-translate-y-0.5 transition-transform'}`}>
                {item.icon}
              </span>
              <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-6 bg-transparent w-full"></div> 
    </div>
  );
};