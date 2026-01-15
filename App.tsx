import React, { useState, useEffect, useRef } from 'react';
import { ScreenName, IMAGES } from './types';
import { WelcomeScreen, LoginScreen, RegisterScreen } from './screens/AuthScreens';
import { AdminScreen } from './screens/AdminScreens';
import { DoctorSearchScreen, DoctorDetailScreen, BookingScreen, AppointmentDetailScreen, AppointmentsListScreen } from './screens/DoctorScreens';
import { ChatScreen, ChatListScreen, PetProfileScreen, UserProfileScreen } from './screens/SocialScreens';
import { BottomNav } from './components/Navigation';
import { authService, UserProfile } from './src/services/authService';
import { appointmentService, Appointment } from './src/services/appointmentService';
import { doctorService } from './src/services/doctorService';
import { petService } from './src/services/petService';
import { chatService, ChatSession } from './src/services/chatService';
import { pointService, PointHistoryItem } from './src/services/pointService';

const App: React.FC = () => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(ScreenName.WELCOME);
  const [doctorDetailBackScreen, setDoctorDetailBackScreen] = useState<ScreenName>(ScreenName.DOCTOR_SEARCH);
  const [bookingBackScreen, setBookingBackScreen] = useState<ScreenName>(ScreenName.DOCTOR_DETAIL);
  const [chatBackScreen, setChatBackScreen] = useState<ScreenName>(ScreenName.DOCTOR_SEARCH);

  // Selection State
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // User Data State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);

  // Loading State
  const [loading, setLoading] = useState(true);

  // Prefill login email after register
  const [prefillLoginEmail, setPrefillLoginEmail] = useState<string>('');

  // Toast for welcome message after login
  const [welcomeToast, setWelcomeToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const pendingWelcomeRef = useRef(false);

  // If user just registered, force them back to login (avoid auto-redirect to app on SIGNED_IN)
  const forceLoginAfterRegisterRef = useRef(false);

  // --- Initialization ---

  // Check auth session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        if (!isMounted) return;
        
        if (session?.user) {
          setCurrentScreen(ScreenName.DOCTOR_SEARCH);
          // 延迟加载用户数据，不阻塞首屏
          setTimeout(() => {
            if (isMounted) loadUserData();
          }, 100);
        } else {
          setCurrentScreen(ScreenName.WELCOME);
        }
      } catch (error) {
        console.error('Failed to initialize auth session', error);
        if (isMounted) {
          setUser(null);
          setCurrentScreen(ScreenName.WELCOME);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      try {
        // 处理页面刷新时的初始会话恢复
        if (event === 'INITIAL_SESSION') {
          // 初始会话已在 initAuth 中处理，这里跳过避免重复
          return;
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Token 刷新时不需要重新加载页面
          console.log('Token refreshed successfully');
          return;
        }
        
        if (event === 'SIGNED_IN' && session) {
          if (forceLoginAfterRegisterRef.current) {
            forceLoginAfterRegisterRef.current = false;
            await authService.signOut();
            setUser(null);
            setCurrentScreen(ScreenName.LOGIN);
            return;
          }
          setCurrentScreen(ScreenName.DOCTOR_SEARCH);
          loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrentScreen(ScreenName.LOGIN);
        }
      } catch (error) {
        console.error('Auth state change handler failed', error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!welcomeToast.show) return;
    const timer = setTimeout(() => setWelcomeToast({ show: false, message: '' }), 2000);
    return () => clearTimeout(timer);
  }, [welcomeToast.show]);

  const loadUserData = async () => {
    try {
      const profile = await authService.getCurrentUserProfile();
      if (!profile) {
        console.warn('No user profile found, user may need to log in again');
        return;
      }
      
      setUser(profile);
      setUserPoints(profile.points);

      if (pendingWelcomeRef.current) {
        pendingWelcomeRef.current = false;
        setWelcomeToast({ show: true, message: `欢迎回来，${profile.name || '用户'}！` });
      }

      // Parallel fetch for other data
      const [userPets, userApts, userChats, history] = await Promise.all([
        petService.getUserPets(profile.id),
        appointmentService.getUserAppointments(profile.id),
        chatService.getUserChats(profile.id),
        pointService.getPointHistory(profile.id)
      ]);

      setPets(userPets);
      setAppointments(userApts);
      setChats(userChats);
      setPointHistory(history);
    } catch (error) {
      console.error('Failed to load user data', error);
    }
  };

  // --- Auth Handlers ---

  const handleRegister = async (name: string, email: string, pass: string): Promise<boolean | string> => {
    try {
      forceLoginAfterRegisterRef.current = true;
      setPrefillLoginEmail(email);
      await authService.signUp(email, pass, name);
      // Auth state listener will handle redirection
      return true;
    } catch (e: any) {
      console.error('Registration error:', e);
      forceLoginAfterRegisterRef.current = false;
      // 返回具体的错误信息
      return e.message || '注册失败，请重试';
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
      await authService.signIn(email, pass);
      setPrefillLoginEmail('');
      pendingWelcomeRef.current = true;
      // Auth state listener will handle redirection
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
  };

  // --- Data Mutators ---

  const handleAddAppointment = async (newAppointment: any, cost: number) => {
    if (!user) return;
    try {
      // Optimistic update (optional, but good for UX)
      // For now, we await the server response
      await appointmentService.createAppointment({
        userId: user.id,
        doctorId: selectedDoctor.id, // Ensure selectedDoctor has ID
        petId: pets.find(p => p.name === newAppointment.pet)?.id, // Need pet ID
        petName: newAppointment.pet,
        date: newAppointment.date.replace(/年|月/g, '-').replace(/日/g, ''), // Format date if needed
        time: newAppointment.time,
        service: newAppointment.service,
        cost: cost
      });

      // Deduct points locally and on server (handled by server logic usually, but here we might need manual call or trigger)
      // Our pointService doesn't have explicit deduct, assuming booking appointment handles it or we call update points
      // The implementation plan didn't specify point deduction logic in service, but we can refetch

      await loadUserData(); // Refresh all data
    } catch (e) {
      console.error("Booking failed", e);
      alert("预约失败，请重试");
    }
  };

  const handleCancelAppointment = async (id: number) => {
    try {
      await appointmentService.cancelAppointment(id.toString());
      await loadUserData(); // Refresh
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    // Chat service implementation required for this specifically
    // For now we just refresh chats
    // await chatService.markRead(id); 
    // setChats(...)
  };

  const handleUpdateLastMessage = (name: string, message: string) => {
    // Real-time subscription in ChatList will handle this automatically usually
    // Or we manually refresh
    if (user) chatService.getUserChats(user.id).then(setChats);
  };

  const handleRedeemPoints = async (code: string) => {
    if (!user) return false;
    const success = await pointService.redeemCode(user.id, code);
    if (success) {
      await loadUserData(); // Refresh points and history
    }
    return success;
  };

  // --- Navigation Logic ---

  const navigate = (screen: ScreenName, data?: any) => {
    if (screen === ScreenName.CHAT) {
      if (data?.doctor) {
        setSelectedDoctor(data.doctor);
        setSelectedChatId(data.chatId || null);
      } else {
        if (data) setSelectedDoctor(data);
        setSelectedChatId(null);
      }
      setChatBackScreen(currentScreen);
    }
    if (screen === ScreenName.CHAT_LIST) {
      if (user) chatService.getUserChats(user.id).then(setChats);
    }
    if (screen === ScreenName.APPOINTMENT_DETAIL && data) {
      setSelectedAppointment(data);
    }
    if (screen === ScreenName.BOOKING) {
      setSelectedDoctor(data || null);
      if ([ScreenName.DOCTOR_DETAIL, ScreenName.APPOINTMENT_DETAIL].includes(currentScreen)) {
        setBookingBackScreen(currentScreen);
      } else {
        setBookingBackScreen(ScreenName.DOCTOR_DETAIL);
      }
    }
    if (screen === ScreenName.DOCTOR_DETAIL) {
      if (data) setSelectedDoctor(data);

      if ([
        ScreenName.DOCTOR_SEARCH,
        ScreenName.APPOINTMENT_DETAIL,
        ScreenName.APPOINTMENTS_LIST
      ].includes(currentScreen)) {
        setDoctorDetailBackScreen(currentScreen);
      }
    }
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const showBottomNav = [
    ScreenName.DOCTOR_SEARCH,
    ScreenName.CHAT_LIST,
    ScreenName.PET_PROFILE,
    ScreenName.USER_PROFILE
  ].includes(currentScreen);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-primary">
      {welcomeToast.show && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[70] bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <span className="font-medium text-sm">{welcomeToast.message}</span>
          </div>
        </div>
      )}
      {currentScreen === ScreenName.WELCOME && <WelcomeScreen onNavigate={navigate} />}
      {currentScreen === ScreenName.LOGIN && <LoginScreen onNavigate={navigate} onLogin={handleLogin} prefillEmail={prefillLoginEmail} />}
      {currentScreen === ScreenName.REGISTER && <RegisterScreen onNavigate={navigate} onRegister={handleRegister} />}

      {/* Protected Routes */}
      {currentScreen === ScreenName.DOCTOR_SEARCH && <DoctorSearchScreen onNavigate={navigate} />}
      {currentScreen === ScreenName.DOCTOR_DETAIL && <DoctorDetailScreen onNavigate={navigate} doctor={selectedDoctor} backScreen={doctorDetailBackScreen} />}
      {currentScreen === ScreenName.BOOKING && <BookingScreen
        onNavigate={navigate}
        appointments={appointments}
        allAppointments={[]} // We might need to fetch all doctor appts for slots
        pets={pets}
        onAddAppointment={handleAddAppointment}
        doctor={selectedDoctor}
        backScreen={bookingBackScreen}
        userPoints={userPoints}
      />}
      {currentScreen === ScreenName.APPOINTMENTS_LIST && <AppointmentsListScreen onNavigate={navigate} appointmentsList={appointments} />}
      {currentScreen === ScreenName.APPOINTMENT_DETAIL && <AppointmentDetailScreen onNavigate={navigate} appointment={selectedAppointment} onCancelAppointment={handleCancelAppointment} />}
      {currentScreen === ScreenName.CHAT && <ChatScreen onNavigate={navigate} userId={user?.id} chatId={selectedChatId} doctor={selectedDoctor} backScreen={chatBackScreen} onUpdateLastMessage={handleUpdateLastMessage} />}
      {currentScreen === ScreenName.CHAT_LIST && <ChatListScreen onNavigate={navigate} chats={chats} onMarkAsRead={handleMarkAsRead} />}
      {currentScreen === ScreenName.PET_PROFILE && <PetProfileScreen onNavigate={navigate} pets={pets} />}
      {currentScreen === ScreenName.USER_PROFILE && <UserProfileScreen onNavigate={navigate} user={user} userPoints={userPoints} pointHistory={pointHistory} onRedeem={handleRedeemPoints} onLogout={handleLogout} />}
      {currentScreen === ScreenName.ADMIN && <AdminScreen onNavigate={navigate} isAdmin={Boolean(user?.is_admin)} />}

      {showBottomNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={navigate} />
      )}
    </div>
  );
};

export default App;