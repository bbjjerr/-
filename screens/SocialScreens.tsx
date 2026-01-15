import React, { useState, useEffect, useRef } from 'react';
import { IMAGES, ScreenName } from '../types';
import { chatService, type Message as DbMessage } from '../src/services/chatService';

interface NavProps {
  onNavigate: (screen: ScreenName, data?: any) => void;
}

export const ChatListScreen: React.FC<NavProps & { chats?: any[], onMarkAsRead?: (id: string) => void }> = ({ onNavigate, chats: propChats, onMarkAsRead }) => {
  const defaultChats = [
    { id: 1, name: '艾米丽·陈医生', message: '这是牙科图表参考。', time: '09:46 AM', unread: 0, image: IMAGES.drEmily },
    { id: 2, name: '莎拉·史密斯医生', message: '手术恢复得很好，不用担心。', time: '昨天', unread: 2, image: IMAGES.drSarah },
    { id: 3, name: '亚历克斯·约翰逊医生', message: '下周二的训练课需要改期吗？', time: '周一', unread: 0, image: IMAGES.drAlex },
  ];

  const chats = propChats || defaultChats;

  return (
    <div className="bg-background-light font-display antialiased min-h-screen flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background-light/95 backdrop-blur-md px-6 pt-12 pb-4 border-b border-neutral-100">
         <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-black tracking-tight text-primary">消息</h1>
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-neutral-50 transition-colors">
              <span className="material-symbols-outlined">edit_square</span>
            </button>
         </div>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-neutral-500">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-neutral-100 mb-4">
              <span className="material-symbols-outlined text-primary">chat</span>
            </div>
            <div className="font-bold text-primary mb-2">暂无消息</div>
            <div className="text-sm">去医生页面发起一次咨询吧</div>
            <button
              onClick={() => onNavigate(ScreenName.DOCTOR_SEARCH)}
              className="mt-6 h-12 px-6 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-neutral-800 transition-colors"
            >
              去找医生
            </button>
          </div>
        ) : chats.map(chat => (
          <button 
            key={chat.id}
            onClick={() => {
              if (onMarkAsRead) onMarkAsRead(String(chat.id));
              if (chat?.doctor_id) {
                onNavigate(ScreenName.CHAT, {
                  chatId: String(chat.id),
                  doctor: { id: chat.doctor_id, name: chat.name, image: chat.image }
                });
              } else {
                onNavigate(ScreenName.CHAT, { name: chat.name, image: chat.image });
              }
            }}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-50 shadow-sm active:scale-[0.99] transition-all hover:shadow-md"
          >
            <div className="relative">
              <img src={chat.image || IMAGES.drSarah} alt={chat.name} className="w-14 h-14 rounded-full object-cover bg-neutral-100" />
              {chat.unread > 0 && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10">
                  <span className="text-[10px] font-bold text-white">{chat.unread}</span>
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-primary text-[16px]">{chat.name}</h3>
                <span className="text-[11px] text-neutral-400 font-medium">{chat.time || ''}</span>
              </div>
              <p className="text-[13px] text-neutral-500 font-medium truncate max-w-[200px]">{chat.message || '暂无消息'}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ChatScreen: React.FC<NavProps & { userId?: string; chatId?: string | null; doctor?: any; backScreen?: ScreenName; onUpdateLastMessage?: (name: string, msg: string) => void }> = ({ onNavigate, userId, chatId: initialChatId, doctor, backScreen, onUpdateLastMessage }) => {
  const currentDoctor = doctor || {
    name: '艾米丽·陈医生',
    image: IMAGES.drEmily,
    title: '牙科专家'
  };

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: any; sender: 'user' | 'doctor'; text: string; time: string; image?: string }>>([]);

  useEffect(() => {
    setChatId(initialChatId || null);
    setMessages([]);
    setInputValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChatId, currentDoctor?.id]);

  const fallbackMessages = () => {
    const name = currentDoctor.name;
    if (name.includes('艾米丽')) {
      return [
        { id: 1, sender: 'doctor', text: '您好！我查看了 Max 的疫苗接种记录。一切看起来都是最新的。', time: '09:41 AM' },
        { id: 2, sender: 'user', text: '太好了！我需要尽快给他安排洗牙吗？', time: '09:42 AM' },
        { id: 3, sender: 'doctor', text: '是的，我建议在下个月内预约。', time: '09:45 AM' },
        { id: 4, sender: 'doctor', text: '这是牙科图表参考。', time: '09:46 AM', image: IMAGES.dentalChart }
      ];
    }
    return [{ id: 1, sender: 'doctor', text: '您好！有什么我可以帮您的吗？', time: '刚刚' }];
  };

  const mapInsertedMessage = (msg: any) => {
    // msg may be the raw row from realtime payload
    const createdAt = msg.created_at ? new Date(msg.created_at) : new Date();
    return {
      id: msg.id,
      sender: msg.sender_type as 'user' | 'doctor',
      text: msg.content,
      time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: msg.image_url
    };
  };

  useEffect(() => {
    let cancelled = false;
    let channel: any = null;

    const load = async () => {
      // If we don't have enough info to load from DB, keep demo messages.
      if (!userId || !currentDoctor?.id) {
        setMessages(fallbackMessages());
        return;
      }

      setIsLoadingMessages(true);
      try {
        const resolved = (initialChatId || chatId)
          ? { id: String(initialChatId || chatId) }
          : await chatService.getOrCreateChat(userId, currentDoctor.id);
        const resolvedChatId = String(initialChatId || chatId || resolved.id);
        if (cancelled) return;
        setChatId(resolvedChatId);

        const history = await chatService.getChatMessages(resolvedChatId);
        if (cancelled) return;
        setMessages(history);

        channel = chatService.subscribeToChat(resolvedChatId, (newRow: DbMessage) => {
          setMessages(prev => {
            if (prev.some(p => String(p.id) === String((newRow as any).id))) return prev;
            return [...prev, mapInsertedMessage(newRow)];
          });
        });
      } catch (e) {
        console.error('Failed to load chat messages', e);
        if (!cancelled) setMessages(fallbackMessages());
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (channel?.unsubscribe) channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentDoctor?.id, initialChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isSending) return;

    // No DB context: fall back to local-only behavior
    if (!userId || !currentDoctor?.id) {
      const newMessage = { id: Date.now(), sender: 'user' as const, text: inputValue, time: '刚刚' };
      setMessages(prev => [...prev, newMessage]);
      if (onUpdateLastMessage) onUpdateLastMessage(currentDoctor.name, inputValue);
      setInputValue('');
      return;
    }

    setIsSending(true);
    try {
      const resolved = (chatId || initialChatId)
        ? { id: String(chatId || initialChatId) }
        : await chatService.getOrCreateChat(userId, currentDoctor.id);
      const resolvedChatId = String(chatId || initialChatId || resolved.id);
      setChatId(resolvedChatId);

      const inserted = await chatService.sendMessage(userId, resolvedChatId, inputValue);
      setMessages(prev => {
        if (prev.some(p => String(p.id) === String((inserted as any).id))) return prev;
        return [...prev, mapInsertedMessage(inserted)];
      });
      if (onUpdateLastMessage) onUpdateLastMessage(currentDoctor.name, inputValue);
      setInputValue('');
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="bg-background-light text-primary font-display antialiased h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white/95 backdrop-blur-md border-b border-neutral-100 pt-12 pb-4 px-4 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => onNavigate(backScreen || ScreenName.DOCTOR_SEARCH)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-neutral-200 bg-center bg-cover border border-neutral-100" style={{ backgroundImage: `url('${currentDoctor.image}')` }}></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[16px] font-bold leading-tight text-primary">{currentDoctor.name}</h1>
              <span className="text-[12px] text-green-600 font-bold mt-0.5">在线中</span>
            </div>
          </div>
          {/* Removed Call and More buttons as per request */}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-5 flex flex-col gap-6 bg-background-light">
        {isLoadingMessages && (
          <div className="text-center text-neutral-400 text-sm font-medium">加载消息中...</div>
        )}
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {msg.sender === 'doctor' && (
              <div className="w-9 h-9 rounded-full bg-neutral-200 bg-center bg-cover shrink-0 mt-1" style={{ backgroundImage: `url('${currentDoctor.image}')` }}></div>
            )}
            
            <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                 msg.sender === 'user' 
                  ? 'bg-[#141414] text-white rounded-tr-none shadow-md' 
                  : 'bg-white text-primary rounded-tl-none border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
               } ${msg.image ? 'p-2' : ''}`}>
                 
                 {msg.image && (
                   <div className="rounded-xl overflow-hidden mb-2">
                     <img src={msg.image} alt="Attachment" className="w-full h-auto object-cover max-h-48" />
                   </div>
                 )}
                 <p className={`text-[14px] leading-relaxed font-medium ${msg.image ? 'px-2 pb-1' : ''}`}>
                    {msg.text}
                 </p>
               </div>
               
               <div className={`flex items-center gap-1.5 ${msg.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                  <span className="text-[11px] text-neutral-400 font-medium">{msg.time}</span>
                  {msg.sender === 'user' && (
                    <span className="material-symbols-outlined text-[16px] text-neutral-400">done_all</span>
                  )}
               </div>
            </div>
          </div>
        ))}
        
        {/* Space at bottom for scrolling */}
        <div ref={messagesEndRef} className="h-2"></div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-white p-4 pb-8 sticky bottom-0 z-50 border-t border-neutral-50">
        <div className="flex items-center gap-3">
           {/* Removed Image button and Send button */}
           <div className="flex-1 bg-neutral-50 rounded-[24px] h-14 flex items-center px-5 gap-3 transition-all duration-300 focus-within:bg-white focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-within:ring-1 focus-within:ring-neutral-200 border border-transparent focus-within:border-neutral-100">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-primary placeholder-neutral-400 text-[15px] font-medium"
                placeholder="发送消息..." 
              />
              <button className="text-neutral-400 hover:text-primary transition-colors">
                 <span className="material-symbols-outlined text-[24px]">mic</span>
              </button>
           </div>
        </div>
      </footer>
    </div>
  );
};

export const PetProfileScreen: React.FC<NavProps & { pets?: any[] }> = ({ onNavigate, pets = [] }) => {
  const [showModal, setShowModal] = useState(false);
  const [activePetIndex, setActivePetIndex] = useState(0);

  const activePet = pets[activePetIndex] || {
    id: 'placeholder',
    name: '暂无宠物',
    breed: '点击添加',
    gender: 'male',
    age: '0',
    weight: '0',
    image: '',
    avatar: '',
    description: '请添加您的宠物信息',
    medical: []
  };

  return (
    <div className="bg-background-light font-display text-primary antialiased">
      <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden pb-32">
        <div className="sticky top-0 z-40 flex items-center justify-between bg-background-light/80 backdrop-blur-md px-6 py-4">
          <div className="w-10 h-10"></div>
          <div className="text-sm font-bold tracking-wide" id="nav-title">{activePet.name}</div>
          <button onClick={() => setShowModal(true)} className="group flex h-10 w-auto px-4 items-center justify-center rounded-full bg-white shadow-sm transition-all active:scale-95">
            <span className="text-sm font-bold text-primary">编辑</span>
          </button>
        </div>
        
        {/* Hero Section */}
        <div className="px-6 pt-2 pb-6">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-sm group bg-neutral-100">
            {activePet.image && (
                <div key={activePet.id} className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 animate-in fade-in" style={{ backgroundImage: `url("${activePet.image}")` }}></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-4xl font-black text-white mb-2">{activePet.name}</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/30">{activePet.breed}</span>
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-inset ring-white/30">
                  <span className="material-symbols-outlined text-white text-[14px]">{activePet.gender === 'male' ? 'male' : 'female'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-4 shadow-sm border border-neutral-100 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-primary/40 mb-1" style={{ fontSize: '24px' }}>cake</span>
              <p className="text-primary text-lg font-bold leading-tight">{activePet.age} <span className="text-xs font-normal text-neutral-500">岁</span></p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-4 shadow-sm border border-neutral-100 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-primary/40 mb-1" style={{ fontSize: '24px' }}>monitor_weight</span>
              <p className="text-primary text-lg font-bold leading-tight">{activePet.weight} <span className="text-xs font-normal text-neutral-500">公斤</span></p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-4 shadow-sm border border-neutral-100 transition-transform active:scale-95">
              <span className="material-symbols-outlined text-primary/40 mb-1" style={{ fontSize: '24px' }}>pets</span>
              <p className="text-primary text-lg font-bold leading-tight">芯片 <span className="text-xs font-normal text-neutral-500">ID</span></p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="px-6 mb-8">
          <h3 className="text-primary text-lg font-bold leading-tight mb-3">关于宠物</h3>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
            <p className="text-neutral-600 text-base leading-loose">{activePet.description}</p>
          </div>
        </div>

        {/* Medical Section */}
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-primary text-lg font-bold leading-tight">医疗与护理</h3>
            {activePet.medical && activePet.medical.length > 3 && (
              <button className="text-sm font-semibold text-neutral-400 hover:text-primary transition-colors">查看全部</button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {activePet.medical && activePet.medical.length > 0 ? activePet.medical.map((item: any, index: number) => {
              // 支持数据库格式和本地格式的医疗记录
              const iconMap: Record<string, string> = {
                vaccines: 'vaccines',
                healing: 'healing',
                medication: 'medication',
                ecg_heart: 'ecg_heart',
                cut: 'content_cut',
                restaurant: 'restaurant',
              };
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                amber: 'bg-amber-50 text-amber-600',
                purple: 'bg-purple-50 text-purple-600',
                pink: 'bg-pink-50 text-pink-600',
              };
              
              // 根据记录格式解析图标和颜色
              const icon = item.icon ? iconMap[item.icon] || item.icon : 'medical_services';
              const colorClass = item.color ? colorMap[item.color] || colorMap.blue : (item.color || 'bg-neutral-100 text-primary');
              
              return (
                <div key={index} className="group flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm border border-neutral-100 transition-all hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-primary text-base font-bold leading-tight">{item.title}</p>
                      <p className="text-neutral-500 text-sm font-medium mt-1">{item.subtitle}</p>
                      {item.date && (
                        <p className="text-neutral-400 text-xs mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {item.date}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-neutral-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                </div>
              );
            }) : (
                 <div className="text-center py-6 text-neutral-400 bg-white rounded-2xl border border-neutral-50 border-dashed">
                     <span className="material-symbols-outlined text-3xl mb-2 opacity-30">medical_services</span>
                     <p>暂无医疗记录</p>
                 </div>
            )}
          </div>
        </div>

        {/* Pet Switcher */}
        <div className="px-6 mt-6 flex flex-col items-center">
             <div className="w-10 h-1 bg-neutral-200 rounded-full mb-6"></div>
             <div className="flex items-center gap-6 overflow-x-auto w-full justify-center pb-4 hide-scrollbar">
                {pets.map((pet, idx) => (
                    <button 
                        key={pet.id} 
                        onClick={() => setActivePetIndex(idx)}
                        className={`group relative flex flex-col items-center gap-2 transition-all duration-300 shrink-0 ${activePetIndex === idx ? 'scale-110' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
                    >
                        <div className={`w-14 h-14 rounded-full p-0.5 border-2 ${activePetIndex === idx ? 'border-primary' : 'border-transparent'} transition-colors`}>
                             <img src={pet.avatar} alt={pet.name} className="w-full h-full rounded-full object-cover shadow-sm bg-neutral-100" />
                        </div>
                        <span className={`text-xs font-bold transition-colors ${activePetIndex === idx ? 'text-primary' : 'text-neutral-400'}`}>{pet.name}</span>
                        {activePetIndex === idx && <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full"></div>}
                    </button>
                ))}
                <button 
                  onClick={() => setShowModal(true)} // Or handle add pet
                  className="group flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-all duration-300 shrink-0"
                >
                     <div className="w-14 h-14 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center bg-white/50 text-neutral-400 group-hover:border-primary group-hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">add</span>
                     </div>
                     <span className="text-xs font-bold text-neutral-400 group-hover:text-primary transition-colors">添加</span>
                </button>
             </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-primary">
                 <span className="material-symbols-outlined text-2xl">info</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">无法修改档案</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                为了您的宠物健康，宠物档案无法个人修改。如果想要更新宠物信息，请线下联系宠物医院。
              </p>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const UserProfileScreen: React.FC<NavProps & { userPoints?: number; pointHistory?: any[]; onRedeem?: (code: string) => Promise<boolean>, user?: any, onLogout?: () => void }> = ({ onNavigate, userPoints = 0, pointHistory, onRedeem, user, onLogout }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const defaultHistory: any[] = [];
  const historyData = pointHistory || defaultHistory;
  
  const currentUser = user || { name: '访客', avatar: '', joinedDate: '今天' };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleRedeem = async () => {
    if (!redeemCode.trim() || isRedeeming) return;
    
    if (onRedeem) {
        setIsRedeeming(true);
        try {
            const success = await onRedeem(redeemCode);
            if (success) {
                setToast({ show: true, message: '兑换成功！积分已更新', isError: false });
                setRedeemCode('');
                setShowRedeemModal(false);
            } else {
                setToast({ show: true, message: '无效的兑换码', isError: true });
            }
        } finally {
            setIsRedeeming(false);
        }
    } else {
        setRedeemCode('');
        setShowRedeemModal(false);
    }
  };
  
  const handleLogout = () => {
      setShowLogoutModal(false);
      if (onLogout) onLogout();
      onNavigate(ScreenName.LOGIN);
  }

  return (
    <div className="bg-background-light font-display antialiased text-primary transition-colors duration-200">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined ${toast.isError ? 'text-red-400' : 'text-green-400'}`}>
                    {toast.isError ? 'error' : 'check_circle'}
                </span>
                <span className="font-medium text-sm">{toast.message}</span>
            </div>
        </div>
      )}

      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-white">
        <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-white z-10 sticky top-0">
          <button onClick={() => onNavigate(ScreenName.DOCTOR_SEARCH)} className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold tracking-tight">个人中心</h2>
          <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
          </button>
        </div>
        <div className="flex flex-col items-center pt-2 pb-8 px-6">
          <div className="relative group cursor-pointer">
            <div className="w-28 h-28 rounded-full bg-cover bg-center border-4 border-white shadow-lg relative overflow-hidden bg-neutral-200" style={{ backgroundImage: currentUser.avatar ? `url('${currentUser.avatar}')` : 'none' }}>
                {!currentUser.avatar && <span className="material-symbols-outlined text-4xl text-neutral-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>}
            </div>
            <div className="absolute bottom-1 right-1 bg-accent-gold text-white rounded-full p-1.5 border-2 border-white shadow-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px] font-bold">edit</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-bold text-primary tracking-tight">{currentUser.name}</h1>
            <p className="text-neutral-500 text-sm font-medium mt-1">高级会员 · {currentUser.joinedDate}加入</p>
          </div>
        </div>
        <div className="px-6 pb-8">
          <div className="relative w-full overflow-hidden rounded-3xl bg-[#141414] text-white shadow-xl transform transition-transform hover:scale-[1.01] duration-300">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent-gold/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl"></div>
            <div className="relative p-6 flex flex-col justify-between h-full min-h-[180px]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1">身份登记</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight gold-gradient-text">{userPoints.toLocaleString()}</span>
                    <span className="text-accent-gold text-sm font-bold">分</span>
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                  <span className="material-symbols-outlined text-accent-gold" style={{ fontSize: '28px' }}>pets</span>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="h-2 w-24 bg-neutral-800 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-3/4 bg-gradient-to-r from-[#B8860B] to-[#F3E5AB]"></div>
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(true)} className="group flex items-center gap-2 px-4 py-2 bg-white text-[#141414] rounded-lg text-xs font-bold hover:bg-neutral-200 transition-colors">
                  历史记录
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-6 pb-24 flex-1">
          {user?.is_admin && (
            <button
              onClick={() => onNavigate(ScreenName.ADMIN)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all border border-transparent hover:shadow-sm group"
            >
              <div className="flex items-center justify-center shrink-0 size-12 rounded-xl bg-white shadow-sm text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>admin_panel_settings</span>
              </div>
              <div className="flex flex-col items-start flex-1">
                <span className="text-base font-bold text-primary leading-tight">后台管理</span>
                <span className="text-xs text-neutral-500 mt-1">管理医生、用户、预约、兑换码</span>
              </div>
              <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          )}
          <button 
            onClick={() => onNavigate(ScreenName.APPOINTMENTS_LIST)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all border border-transparent hover:shadow-sm group">
            <div className="flex items-center justify-center shrink-0 size-12 rounded-xl bg-white shadow-sm text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>calendar_month</span>
            </div>
            <div className="flex flex-col items-start flex-1">
              <span className="text-base font-bold text-primary leading-tight">我的预约</span>
              <span className="text-xs text-neutral-500 mt-1">管理近期行程</span>
            </div>
            <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary transition-colors">chevron_right</span>
          </button>
           <button onClick={() => setShowRedeemModal(true)} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all border border-transparent hover:shadow-sm group">
            <div className="flex items-center justify-center shrink-0 size-12 rounded-xl bg-white shadow-sm text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>redeem</span>
            </div>
            <div className="flex flex-col items-start flex-1">
              <span className="text-base font-bold text-primary leading-tight">兑换积分</span>
              <span className="text-xs text-neutral-500 mt-1">使用兑换码兑换积分</span>
            </div>
             <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-accent-gold/10 text-accent-gold text-[10px] font-bold uppercase tracking-wider">最新</span>
              <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary transition-colors">chevron_right</span>
            </div>
          </button>
          <button className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all border border-transparent hover:shadow-sm group" onClick={() => setShowLogoutModal(true)}>
            <div className="flex items-center justify-center shrink-0 size-12 rounded-xl bg-white shadow-sm text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>logout</span>
            </div>
            <div className="flex flex-col items-start flex-1">
              <span className="text-base font-bold text-primary leading-tight">退出登录</span>
              <span className="text-xs text-neutral-500 mt-1">安全退出当前账号</span>
            </div>
            <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary transition-colors">chevron_right</span>
          </button>
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setShowHistoryModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pointer-events-auto animate-in slide-in-from-bottom-full sm:zoom-in duration-300 max-h-[70vh] flex flex-col">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-primary">积分记录</h3>
               <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors">
                 <span className="material-symbols-outlined text-sm">close</span>
               </button>
            </div>
            
            <div className="overflow-y-auto flex-1 -mx-2 px-2">
               {historyData.length > 0 ? historyData.map((item) => (
                 <div key={item.id} className="flex items-center justify-between py-4 border-b border-neutral-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        item.points.startsWith('+') 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        <span className="material-symbols-outlined text-lg">
                          {item.type === 'redeem' ? 'redeem' : 
                           item.type === 'consume' ? 'shopping_cart' :
                           item.type === 'admin_add' ? 'add_circle' :
                           item.type === 'admin_deduct' ? 'remove_circle' :
                           item.type === 'admin_set' ? 'settings' :
                           item.type === 'refund' ? 'replay' :
                           item.points.startsWith('+') ? 'add' : 'remove'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-primary text-sm">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">{item.date}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-base ${item.points.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{item.points}</span>
                 </div>
               )) : <div className="text-center py-8 text-neutral-400">暂无积分记录</div>}
            </div>
          </div>
        </div>
      )}

      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRedeemModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-6 max-w-xs w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-center mb-2">兑换积分</h3>
            <p className="text-neutral-500 text-center text-sm mb-6">请输入您的积分兑换码</p>
            
            <input 
              type="text" 
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="请输入积分兑换码"
              className="w-full h-12 rounded-xl bg-neutral-50 border border-neutral-200 px-4 mb-6 text-center font-bold text-primary outline-none focus:border-primary transition-colors placeholder:font-normal placeholder:text-sm"
              autoFocus
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowRedeemModal(false)}
                disabled={isRedeeming}
                className="flex-1 h-12 rounded-xl bg-neutral-100 text-neutral-700 font-bold text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button 
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemCode.trim()}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-neutral-800 shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRedeeming ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    兑换中...
                  </>
                ) : '兑换'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-6 max-w-xs w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-center mb-2">确定要退出登入吗?</h3>
            <p className="text-neutral-500 text-center text-sm mb-6">您需要重新登录才能访问您的个人信息。</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 h-12 rounded-xl bg-neutral-100 text-neutral-700 font-bold text-sm hover:bg-neutral-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-neutral-800 shadow-lg shadow-primary/20 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};