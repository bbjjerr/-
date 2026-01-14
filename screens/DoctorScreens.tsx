import React, { useState, useEffect } from 'react';
import { ScreenName, IMAGES, Doctor } from '../types';
import { doctorService } from '../src/services/doctorService';

interface NavProps {
  onNavigate: (screen: ScreenName, data?: any) => void;
}

export const DoctorSearchScreen: React.FC<NavProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await doctorService.getAllDoctors();
        setDoctors(data);
      } catch (error) {
        console.error('Failed to load doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const categories = [
    { id: 'All', label: '全部' },
    { id: 'Vet', label: '兽医' },
    { id: 'Grooming', label: '美容' },
    { id: 'Dental', label: '牙科' },
  ];

  const filteredDoctors = doctors.filter(doc => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Vet') return doc.tags.some(tag => ['全科', '外科', '营养', '行为'].includes(tag));
    if (selectedCategory === 'Grooming') return doc.tags.some(tag => ['清洁', '护理', '美容'].includes(tag));
    if (selectedCategory === 'Dental') return doc.tags.includes('牙科');
    return false;
  });

  if (loading) {
    return (
      <div className="bg-background-light font-display text-primary antialiased min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light font-display text-primary antialiased min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-white pt-14 pb-8 px-6 rounded-b-[40px] shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] mb-2">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-[28px] font-black tracking-tight text-primary leading-[1.2]">
            欢迎来到<br />宠物医院
          </h1>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-7 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white text-neutral-600 border-neutral-100 shadow-sm hover:border-neutral-200'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6">
        <h2 className="text-[15px] font-bold mb-5 text-neutral-800 tracking-wide ml-1">
          附近医生
        </h2>

        <div className="flex flex-col gap-4">
          {filteredDoctors.map(doctor => (
            <div
              key={doctor.id}
              onClick={() => onNavigate(ScreenName.DOCTOR_DETAIL, doctor)}
              className="bg-white p-3.5 rounded-[24px] shadow-sm border border-neutral-50 flex gap-4 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer items-center"
            >
              <div className="shrink-0">
                <img src={doctor.image} alt={doctor.name} className="w-[88px] h-[88px] rounded-[20px] object-cover bg-neutral-100 shadow-sm" />
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="font-bold text-[17px] text-primary leading-tight truncate mb-1">{doctor.name}</h3>
                <p className="text-[11px] text-neutral-400 font-medium mb-2.5">{doctor.title}</p>

                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="material-symbols-outlined text-amber-400 text-[18px] material-symbols-filled">star</span>
                  <span className="text-[13px] font-bold text-primary">{doctor.rating}</span>
                  <span className="text-[11px] text-neutral-400 ml-0.5 font-medium tracking-tight">(120+ 评价)</span>
                </div>

                <div className="flex gap-2">
                  {doctor.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-neutral-50 text-neutral-500 rounded-lg text-[10px] font-bold border border-neutral-100">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {filteredDoctors.length === 0 && (
            <div className="py-10 text-center text-neutral-400">
              <p>该分类下暂无医生</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DoctorDetailScreen: React.FC<NavProps & { doctor?: Doctor, backScreen?: ScreenName }> = ({ onNavigate, doctor, backScreen }) => {
  const activeDoctor = doctor || {
    id: '1',
    name: '医生',
    title: '兽医',
    rating: 5.0,
    image: IMAGES.drSarah,
    tags: [],
    price: 200
  };

  return (
    <div className="bg-background-light font-display text-primary antialiased min-h-screen flex flex-col relative pb-safe">
      <div className="relative h-[380px] w-full">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${activeDoctor.image}")` }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background-light"></div>
        <div className="absolute top-0 left-0 w-full p-6 pt-12 flex items-center justify-between z-10">
          <button
            onClick={() => onNavigate(backScreen || ScreenName.DOCTOR_SEARCH)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <span className="material-symbols-outlined">favorite</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-background-light -mt-10 rounded-t-[40px] relative px-6 pt-8 pb-24 z-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-primary">{activeDoctor.name}</h1>
            <p className="text-neutral-500 font-medium">{activeDoctor.title}</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
            <span className="material-symbols-outlined text-amber-400 text-[20px] material-symbols-filled">star</span>
            <span className="text-sm font-bold text-amber-900">{activeDoctor.rating}</span>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 text-center">
            <p className="text-2xl font-bold text-primary mb-0.5">350+</p>
            <p className="text-xs text-neutral-400 font-medium">患者</p>
          </div>
          <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 text-center">
            <p className="text-2xl font-bold text-primary mb-0.5">15+</p>
            <p className="text-xs text-neutral-400 font-medium">经验(年)</p>
          </div>
          <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 text-center">
            <p className="text-2xl font-bold text-primary mb-0.5">{activeDoctor.satisfaction || '98%'}</p>
            <p className="text-xs text-neutral-400 font-medium">满意度</p>
          </div>
        </div>

        {activeDoctor.awards && activeDoctor.awards.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-gold">verified</span>
              专业荣誉
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeDoctor.awards.map((award, index) => (
                <div key={index} className="px-3 py-1.5 bg-accent-gold/10 text-yellow-700 rounded-lg text-xs font-bold border border-accent-gold/20">
                  {award}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">关于医生</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            {activeDoctor.name} 是一位经验丰富的兽医，专注于小动物内科和外科手术。她对待每一个小生命都充满爱心和耐心，致力于为您的宠物提供最优质的医疗服务。拥有超过15年的临床经验，曾多次获得行业奖项。
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-neutral-100 pb-8 pt-4 px-6 z-20 shadow-[0_-4px_30px_rgba(0,0,0,0.04)]">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => onNavigate(ScreenName.CHAT, activeDoctor)}
            className="w-14 h-14 rounded-2xl bg-neutral-100 text-primary flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button
            onClick={() => onNavigate(ScreenName.BOOKING, activeDoctor)}
            className="flex-1 h-14 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-neutral-800 transition-colors active:scale-[0.98] flex items-center justify-center"
          >
            立即预约
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppointmentsListScreen: React.FC<NavProps & { appointmentsList?: any[] }> = ({ onNavigate, appointmentsList = [] }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

  const upcomingAppointments = appointmentsList.filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled');
  const pastAppointments = appointmentsList.filter(apt => apt.status === 'completed' || apt.status === 'cancelled');

  const displayedList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="bg-background-light font-display antialiased min-h-screen flex flex-col pb-24">
      <div className="sticky top-0 z-30 bg-background-light/95 backdrop-blur-md px-6 pt-12 pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => onNavigate(ScreenName.USER_PROFILE)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors -ml-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">我的预约</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-neutral-100">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            即将进行
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            历史记录
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        {displayedList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 mt-20">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">event_busy</span>
            <p>暂无预约记录</p>
          </div>
        ) : (
          displayedList.map(apt => (
            <div
              key={apt.id}
              onClick={() => onNavigate(ScreenName.APPOINTMENT_DETAIL, apt)}
              className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-neutral-100 active:scale-[0.99] transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <img src={apt.image} alt={apt.doctorName} className="w-12 h-12 rounded-xl object-cover bg-neutral-100" />
                  <div>
                    <h3 className="font-bold text-primary">{apt.doctorName}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{apt.service}</p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                  ${apt.status === 'upcoming' ? 'bg-blue-50 text-blue-600' :
                    apt.status === 'completed' ? 'bg-green-50 text-green-600' :
                      apt.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                        'bg-neutral-100 text-neutral-500'}`
                }>
                  {apt.status === 'upcoming' ? '即将开始' :
                    apt.status === 'completed' ? '已完成' :
                      apt.status === 'in_progress' ? '进行中' : '已取消'}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-neutral-50">
                <div className="flex items-center gap-1.5 text-neutral-600">
                  <span className="material-symbols-outlined text-[18px] text-neutral-400">calendar_today</span>
                  <span className="text-xs font-bold">{apt.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-600">
                  <span className="material-symbols-outlined text-[18px] text-neutral-400">schedule</span>
                  <span className="text-xs font-bold">{apt.time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-600 ml-auto">
                  <span className="material-symbols-outlined text-[18px] text-neutral-400">pets</span>
                  <span className="text-xs font-bold">{apt.pet}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const AppointmentDetailScreen: React.FC<NavProps & { appointment: any, onCancelAppointment: (id: number) => void }> = ({ onNavigate, appointment, onCancelAppointment }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!appointment) return null;

  const handleCancel = () => {
    onCancelAppointment(appointment.id);
    onNavigate(ScreenName.APPOINTMENTS_LIST);
  };

  const isPast = appointment.status === 'completed' || appointment.status === 'cancelled';

  return (
    <div className="bg-background-light font-display antialiased min-h-screen flex flex-col relative pb-safe">
      <div className="sticky top-0 z-30 bg-background-light/95 backdrop-blur-md px-4 pt-12 pb-4 flex items-center justify-between border-b border-neutral-100">
        <button onClick={() => onNavigate(ScreenName.APPOINTMENTS_LIST)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">预约详情</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <img src={appointment.image} alt={appointment.doctorName} className="w-16 h-16 rounded-2xl object-cover bg-neutral-100 shadow-sm" />
            <div>
              <h2 className="text-lg font-bold text-primary">{appointment.doctorName}</h2>
              <p className="text-neutral-500 text-sm font-medium">{appointment.service}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase">日期</p>
                <p className="text-primary font-bold">{appointment.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase">时间</p>
                <p className="text-primary font-bold">{appointment.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase">地点</p>
                <p className="text-primary font-bold">中央宠物医院</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">pets</span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-bold uppercase">宠物</p>
                <p className="text-primary font-bold">{appointment.pet}</p>
              </div>
            </div>
          </div>
        </div>

        {!isPast && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate(ScreenName.CHAT, { id: appointment.doctorId, name: appointment.doctorName, image: appointment.image })}
              className="w-full h-14 bg-white border border-neutral-200 text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
            >
              <span className="material-symbols-outlined">chat</span>
              联系医生
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full h-14 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              取消预约
            </button>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-6 max-w-xs w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-center mb-2">取消预约?</h3>
            <p className="text-neutral-500 text-center text-sm mb-6">您确定要取消这次预约吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-12 rounded-xl bg-neutral-100 text-neutral-700 font-bold text-sm hover:bg-neutral-200"
              >
                保留
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-500/20"
              >
                是的，取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Booking Screen ---
export const BookingScreen: React.FC<NavProps & {
  appointments?: any[],
  allAppointments?: any[],
  pets?: any[],
  onAddAppointment?: (apt: any, cost: number) => void,
  doctor?: any,
  backScreen?: ScreenName,
  userPoints?: number
}> = ({
  onNavigate,
  appointments = [],
  allAppointments = [],
  pets = [],
  onAddAppointment,
  doctor,
  backScreen,
  userPoints = 0
}) => {
    const [selectedDate, setSelectedDate] = useState<string>('24');
    const [selectedTime, setSelectedTime] = useState<string>('15:30');
    const [selectedPet, setSelectedPet] = useState<string>(pets.length > 0 ? pets[0].id : '');
    const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

    useEffect(() => {
      if (pets.length > 0 && !selectedPet) {
        setSelectedPet(pets[0].id);
      }
    }, [pets, selectedPet]);

    const activeDoctor = doctor || { name: '莎拉·史密斯医生', image: IMAGES.drSarah, price: 300 };

    const getPetStatus = (petName: string) => {
      const activeApt = appointments.find(apt =>
        apt.pet === petName && (apt.status === 'in_progress' || apt.status === 'upcoming')
      );
      if (!activeApt) return null;
      return activeApt.status === 'in_progress' ? '进行中' : '已预约';
    };

    const sortedPets = [...pets].sort((a, b) => {
      const statusA = getPetStatus(a.name);
      const statusB = getPetStatus(b.name);
      // Free pets first
      if (!statusA && statusB) return -1;
      if (statusA && !statusB) return 1;
      return 0;
    });

    const dates = [
      { day: '24', week: '周四', hasDot: true },
      { day: '25', week: '周五' },
      { day: '26', week: '周六' },
      { day: '27', week: '周日' },
      { day: '28', week: '周一' },
    ];

    const getSlotStatus = (time: string) => {
      const fullDate = `2024年10月${selectedDate}日`;
      // Check availability against all appointments from all users
      const checkList = allAppointments.length > 0 ? allAppointments : appointments;
      const isBooked = checkList.some(apt =>
        apt.doctorName === activeDoctor.name &&
        apt.date === fullDate &&
        apt.time === time &&
        apt.status !== 'cancelled'
      );
      return isBooked ? 'full' : 'available';
    };

    const morningSlots = ['09:00', '10:30', '11:00', '11:30'].map(time => ({
      time,
      status: getSlotStatus(time)
    }));

    const afternoonSlots = ['14:00', '15:30', '16:00', '17:30'].map(time => ({
      time,
      status: getSlotStatus(time)
    }));

    useEffect(() => {
      if (toast.show) {
        const timer = setTimeout(() => {
          setToast(prev => ({ ...prev, show: false }));
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [toast.show]);

    const handleConfirm = () => {
      const cost = activeDoctor.price || 300;

      if (userPoints < cost) {
        setToast({ show: true, message: `积分不足：需要 ${cost} 积分，您当前只有 ${userPoints} 积分` });
        return;
      }

      const fullDate = `2024年10月${selectedDate}日`;

      // Check for duplicate appointment against global list
      const checkList = allAppointments.length > 0 ? allAppointments : appointments;
      const isDuplicate = checkList.some(apt =>
        apt.doctorName === activeDoctor.name &&
        apt.date === fullDate &&
        apt.time === selectedTime && apt.status !== 'cancelled'
      );

      if (isDuplicate) {
        setToast({ show: true, message: "预约失败：该时段已有预约" });
        return;
      }

      if (!selectedPet) {
        setToast({ show: true, message: "请选择服务宠物" });
        return;
      }

      // Check if selected pet is busy (upcoming or in_progress) - Local check
      const isPetBusy = appointments.some(apt =>
        apt.pet === selectedPet &&
        (apt.status === 'upcoming' || apt.status === 'in_progress')
      );

      if (isPetBusy) {
        setToast({ show: true, message: "预约失败：该宠物已有进行中或即将开始的预约" });
        return;
      }

      // Find pet name from ID
      const petObj = pets.find(p => p.id === selectedPet);
      const petName = petObj ? petObj.name : selectedPet;

      const appointmentData = {
        id: Date.now(),
        doctorName: activeDoctor.name,
        image: activeDoctor.image,
        date: fullDate,
        time: selectedTime,
        status: 'upcoming',
        service: '宠物全检',
        pet: petName
      };

      if (onAddAppointment) {
        onAddAppointment(appointmentData, cost);
      }

      onNavigate(ScreenName.APPOINTMENT_DETAIL, appointmentData);
    };

    return (
      <div className="bg-background-light font-display text-primary antialiased min-h-screen flex flex-col relative pb-safe overflow-x-hidden">
        {toast.show && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 w-max max-w-[90%]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">error</span>
              <span className="font-medium text-sm">{toast.message}</span>
            </div>
          </div>
        )}
        <nav className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-neutral-200/50">
          <div className="w-10"></div>
          <h1 className="text-[18px] font-bold tracking-wide">选择预约时间</h1>
          <button onClick={() => onNavigate(backScreen || ScreenName.DOCTOR_DETAIL)} className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-500">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </nav>
        <main className="flex-1 w-full max-w-md mx-auto pb-64 pt-4">
          <div className="mb-8">
            <div className="px-5 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {dates.map((item) => {
                const isSelected = selectedDate === item.day;
                return (
                  <button
                    key={item.day}
                    onClick={() => setSelectedDate(item.day)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-[90px] rounded-[22px] transition-all active:scale-95 ${isSelected ? 'bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-white' : 'bg-white border border-neutral-100 text-neutral-400 hover:border-neutral-300'}`}
                  >
                    <span className={`text-[13px] font-medium ${isSelected ? 'opacity-80' : ''}`}>{item.week}</span>
                    <span className={`text-[24px] font-bold leading-none mt-1 ${isSelected ? '' : 'text-neutral-800'}`}>{item.day}</span>
                    {item.hasDot && <span className={`w-1.5 h-1.5 rounded-full mt-2 ${isSelected ? 'bg-amber-400' : 'bg-transparent'}`}></span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-5 mb-8">
            <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>上午时段
            </h2>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {morningSlots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={slot.status === 'full'}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`relative py-3 rounded-[14px] text-[14px] font-bold transition-all text-center 
                                    ${slot.status === 'full'
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : selectedTime === slot.time
                        ? 'bg-primary text-white shadow-lg ring-2 ring-primary/20'
                        : 'bg-white border border-neutral-200 text-primary hover:border-primary'
                    }`}
                >
                  {slot.time}
                  {slot.status === 'full' && (
                    <span className="absolute -top-2 -right-2 bg-neutral-200 text-[9px] px-1.5 py-0.5 rounded text-neutral-500 font-bold">满</span>
                  )}
                </button>
              ))}
            </div>
            <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>下午时段
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {afternoonSlots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={slot.status === 'full'}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`relative py-3 rounded-[14px] text-[14px] font-bold transition-all text-center 
                                    ${slot.status === 'full'
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : selectedTime === slot.time
                        ? 'bg-primary text-white shadow-lg ring-2 ring-primary/20'
                        : 'bg-white border border-neutral-200 text-primary hover:border-primary'
                    }`}
                >
                  {slot.time}
                  {slot.status === 'full' && (
                    <span className="absolute -top-2 -right-2 bg-neutral-200 text-[9px] px-1.5 py-0.5 rounded text-neutral-500 font-bold">满</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>选择服务宠物
              </h2>
            </div>
            {sortedPets.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {sortedPets.map(pet => {
                  const status = getPetStatus(pet.name);
                  const isSelected = selectedPet === pet.id;

                  return (
                    <div
                      key={pet.id}
                      onClick={() => setSelectedPet(pet.id)}
                      className={`relative min-w-[170px] p-3 rounded-[20px] bg-white flex items-center gap-3 transition-all cursor-pointer border-2 ${isSelected
                        ? 'border-primary ring-0 shadow-md'
                        : 'border-transparent shadow-sm'
                        } ${status ? 'opacity-80 grayscale-[0.3]' : ''}`}
                    >
                      <img className="w-12 h-12 rounded-full object-cover shadow-sm bg-neutral-100" src={pet.image} alt={pet.name} />
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-primary">{pet.name}</span>
                        <span className="text-[11px] text-neutral-400 font-medium">{pet.breed}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[20px] absolute top-3 right-3 text-primary material-symbols-filled">check_circle</span>
                      )}
                      {/* Status Badge */}
                      {status && (
                        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${status === '进行中' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-dashed border-neutral-300 text-center text-neutral-400 text-sm">
                暂无可用宠物，请先去添加宠物
              </div>
            )}
          </div>
        </main>
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-neutral-100 pb-8 pt-5 px-6 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.04)]">
          <div className="max-w-md mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <img className="w-12 h-12 rounded-xl object-cover shadow-sm border border-neutral-100" src={activeDoctor.image} alt={activeDoctor.name} />
                <div>
                  <div className="text-[16px] font-bold text-primary leading-tight">{activeDoctor.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md">10月{selectedDate}日</span>
                    <span className="text-[11px] font-medium text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md">{selectedTime}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-black text-primary leading-none">¥{activeDoctor.price || 300}</div>
                <div className="text-[10px] text-neutral-400 font-medium mt-1">预约所需积分</div>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className={`w-full h-[56px] rounded-xl font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center tracking-wide gap-2 group ${(userPoints < (activeDoctor.price || 300))
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                : 'bg-primary text-white shadow-black/20 hover:bg-neutral-800'
                }`}
            >
              <span>{(userPoints < (activeDoctor.price || 300)) ? '积分不足' : `确认支付 ${activeDoctor.price || 300} 积分`}</span>
              {(userPoints >= (activeDoctor.price || 300)) && (
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };