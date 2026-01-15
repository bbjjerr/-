import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ScreenName } from '../types';
import { adminService, type AdminDoctorRow, type AdminRedeemCodeRow, type AdminStats, type AdminUserRow, type AdminAppointmentRow, type AdminPetRow } from '../src/services/adminService';

type NavProps = {
  onNavigate: (screen: ScreenName, data?: any) => void;
};

type TabKey = 'overview' | 'users' | 'doctors' | 'appointments' | 'redeem';

// 图片上传组件
const ImageUploader: React.FC<{
  currentImage?: string;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}> = ({ currentImage, onUpload, uploading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <div
        onClick={handleClick}
        className={`w-24 h-24 rounded-2xl border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {currentImage ? (
          <img src={currentImage} alt="宠物照片" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-neutral-400">
            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
            <span className="text-[10px] mt-1">上传照片</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// 用户卡片组件
const UserCard: React.FC<{
  user: AdminUserRow;
  onManagePets: () => void;
}> = ({ user, onManagePets }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-xl">person</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-primary text-base truncate">{user.name}</h3>
            {user.is_admin && (
              <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full">管理员</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 truncate mt-0.5">{user.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-amber-500 text-sm">toll</span>
              <span className="text-sm font-bold text-primary">{user.points}</span>
              <span className="text-xs text-neutral-400">积分</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-50">
        <button
          onClick={onManagePets}
          className="w-full h-9 rounded-xl bg-primary/5 text-primary text-sm font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">pets</span>
          管理宠物
        </button>
      </div>
    </div>
  );
};

// 宠物卡片组件
const PetCard: React.FC<{
  pet: AdminPetRow;
  onDelete: () => void;
  onUpdateImage: (file: File) => Promise<void>;
  uploading?: boolean;
}> = ({ pet, onDelete, onUpdateImage, uploading }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
      <div className="flex gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
            {pet.image_url ? (
              <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                <span className="material-symbols-outlined text-3xl">pets</span>
              </div>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-neutral-800 transition-colors shadow-md">
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await onUpdateImage(file);
                e.target.value = '';
              }}
              disabled={uploading}
            />
          </label>
          {uploading && (
            <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-primary text-base">{pet.name}</h4>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-1">{pet.breed}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
              {pet.pet_type === 'dog' ? '🐕 狗' : '🐈 猫'}
            </span>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full">
              {pet.gender === 'male' ? '♂ 公' : '♀ 母'}
            </span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">
              {pet.age}岁
            </span>
            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">
              {pet.weight}kg
            </span>
          </div>
          {pet.description && (
            <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{pet.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminScreen: React.FC<NavProps & { isAdmin?: boolean }> = ({ onNavigate, isAdmin }) => {
  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [toast, setToast] = useState<{ show: boolean; message: string; isError: boolean }>({ show: false, message: '', isError: false });

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([]);
  const [codes, setCodes] = useState<AdminRedeemCodeRow[]>([]);
  
  // 用户宠物管理
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [userPets, setUserPets] = useState<AdminPetRow[]>([]);
  const [showPetModal, setShowPetModal] = useState(false);
  const [uploadingPetId, setUploadingPetId] = useState<string | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [newPetImageUploading, setNewPetImageUploading] = useState(false);

  // 搜索
  const [userSearch, setUserSearch] = useState('');

  const [doctorDraft, setDoctorDraft] = useState({ name: '', title: '', image_url: '', price: 200, tags: '' });
  const [codeDraft, setCodeDraft] = useState({ code: '', points: 1000, max_uses: 1 });
  const [petDraft, setPetDraft] = useState({
    name: '',
    breed: '',
    pet_type: 'dog' as 'dog' | 'cat',
    gender: 'male' as 'male' | 'female',
    age: 1,
    weight: 5,
    image_url: '',
    description: ''
  });

  const tabs = useMemo(
    () => [
      { key: 'overview' as const, label: '概览', icon: 'dashboard' },
      { key: 'users' as const, label: '用户', icon: 'group' },
      { key: 'doctors' as const, label: '医生', icon: 'medical_services' },
      { key: 'appointments' as const, label: '预约', icon: 'calendar_month' },
      { key: 'redeem' as const, label: '兑换码', icon: 'redeem' }
    ],
    []
  );

  // Toast 自动隐藏
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
  };

  // 过滤用户
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const search = userSearch.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

  const refresh = async () => {
    if (!isAdmin) return;
    setError('');
    setLoading(true);
    try {
      const base = await adminService.getStats();
      setStats(base);

      const [u, d, a, r] = await Promise.all([
        adminService.listUsers(50),
        adminService.listDoctors(50),
        adminService.listAppointments(50),
        adminService.listRedeemCodes(50)
      ]);

      setUsers(u);
      setDoctors(d);
      setAppointments(a);
      setCodes(r);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '加载后台数据失败（可能是 RLS 权限未开）');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const saveDoctor = async () => {
    setError('');
    setLoading(true);
    try {
      const tags = doctorDraft.tags
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await adminService.upsertDoctor({
        name: doctorDraft.name,
        title: doctorDraft.title,
        image_url: doctorDraft.image_url,
        price: Number(doctorDraft.price) || 200,
        tags
      });
      setDoctorDraft({ name: '', title: '', image_url: '', price: 200, tags: '' });
      await refresh();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '保存医生失败（可能缺少 doctors 的写权限）');
    } finally {
      setLoading(false);
    }
  };

  const saveCode = async () => {
    setError('');
    setLoading(true);
    try {
      await adminService.upsertRedeemCode({
        code: codeDraft.code.trim(),
        points: Number(codeDraft.points) || 0,
        max_uses: Number(codeDraft.max_uses) || 1,
        is_active: true
      });
      setCodeDraft({ code: '', points: 1000, max_uses: 1 });
      await refresh();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || '保存兑换码失败（可能缺少 redeem_codes 的写权限）');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPets = async (user: AdminUserRow) => {
    setError('');
    setLoading(true);
    try {
      const pets = await adminService.listPetsByUser(user.id, 50);
      setSelectedUser(user);
      setUserPets(pets);
      setShowPetModal(true);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || '加载用户宠物失败', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNewPetImage = async (file: File) => {
    setNewPetImageUploading(true);
    try {
      const url = await adminService.uploadPetImage(file);
      setPetDraft(d => ({ ...d, image_url: url }));
      showToast('图片上传成功');
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || '图片上传失败（请先在 Supabase 创建 pet-images bucket）', true);
    } finally {
      setNewPetImageUploading(false);
    }
  };

  const handleUpdatePetImage = async (petId: string, file: File) => {
    setUploadingPetId(petId);
    try {
      const url = await adminService.uploadPetImage(file, petId);
      await adminService.updatePet(petId, { image_url: url, avatar_url: url });
      if (selectedUser) await loadUserPets(selectedUser);
      showToast('宠物照片已更新');
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || '图片上传失败', true);
    } finally {
      setUploadingPetId(null);
    }
  };

  const savePetForUser = async () => {
    if (!selectedUser) return;
    if (!petDraft.name || !petDraft.breed) {
      showToast('请填写宠物名称和品种', true);
      return;
    }
    setLoading(true);
    try {
      await adminService.createPetForUser({
        userId: selectedUser.id,
        name: petDraft.name,
        breed: petDraft.breed,
        pet_type: petDraft.pet_type,
        gender: petDraft.gender,
        age: Number(petDraft.age) || 1,
        weight: Number(petDraft.weight) || 1,
        description: petDraft.description,
        image_url: petDraft.image_url
      });
      setPetDraft({ name: '', breed: '', pet_type: 'dog', gender: 'male', age: 1, weight: 5, image_url: '', description: '' });
      setShowAddPet(false);
      await loadUserPets(selectedUser);
      showToast('宠物添加成功');
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || '新增宠物失败', true);
    } finally {
      setLoading(false);
    }
  };

  const deletePetForUser = async (petId: string) => {
    if (!selectedUser) return;
    if (!confirm('确定要删除这只宠物吗？')) return;
    setLoading(true);
    try {
      await adminService.deletePet(petId);
      await loadUserPets(selectedUser);
      showToast('宠物已删除');
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || '删除宠物失败', true);
    } finally {
      setLoading(false);
    }
  };

  const closePetModal = () => {
    setShowPetModal(false);
    setSelectedUser(null);
    setUserPets([]);
    setShowAddPet(false);
    setPetDraft({ name: '', breed: '', pet_type: 'dog', gender: 'male', age: 1, weight: 5, image_url: '', description: '' });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background-light font-display p-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 shadow-soft">
          <div className="text-xl font-black text-primary mb-2">无后台权限</div>
          <div className="text-sm text-neutral-500 mb-6">当前账号不是管理员，无法访问后台管理系统。</div>
          <button
            onClick={() => onNavigate(ScreenName.USER_PROFILE)}
            className="w-full h-12 rounded-2xl bg-primary text-white font-bold"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light font-display pb-24">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[80] bg-black/90 text-white px-5 py-3 rounded-2xl backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${toast.isError ? 'text-red-400' : 'text-green-400'}`}>
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background-light/95 backdrop-blur-md px-6 pt-12 pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate(ScreenName.USER_PROFILE)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-neutral-50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-[18px] font-black text-primary">后台管理</div>
          <button
            onClick={refresh}
            className={`w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-neutral-50 transition-colors ${loading ? 'animate-spin' : ''}`}
            title="刷新"
            disabled={loading}
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.key ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-600 border-neutral-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6 max-w-lg mx-auto">
        {error && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm font-bold">{error}</div>}

        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="用户" value={stats?.users ?? '-'} icon="group" color="blue" />
            <StatCard label="医生" value={stats?.doctors ?? '-'} icon="medical_services" color="green" />
            <StatCard label="预约" value={stats?.appointments ?? '-'} icon="calendar_month" color="purple" />
            <StatCard label="会话" value={stats?.chats ?? '-'} icon="chat" color="amber" />
            <StatCard label="消息" value={stats?.messages ?? '-'} icon="mail" color="pink" />
            <StatCard label="兑换码" value={stats?.redeemCodes ?? '-'} icon="redeem" color="cyan" />
          </div>
        )}

        {tab === 'users' && (
          <>
            {/* 搜索栏 */}
            <div className="mb-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
                <input
                  type="text"
                  placeholder="搜索用户名或邮箱..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-white border border-neutral-200 pl-12 pr-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* 用户卡片网格 */}
            <div className="grid gap-3">
              {filteredUsers.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  onManagePets={() => loadUserPets(u)}
                />
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-10 text-neutral-400">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-30">search_off</span>
                  <p className="text-sm">未找到用户</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 宠物管理弹窗 */}
        {showPetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* 蒙层 */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closePetModal}
            />
            {/* 弹窗内容 */}
            <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
              {/* 弹窗头部 */}
              <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-neutral-100 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-primary text-lg">宠物管理</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{selectedUser.name} · {selectedUser.email}</p>
                  </div>
                  <button
                    onClick={closePetModal}
                    className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-neutral-600">close</span>
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* 宠物列表 */}
                {userPets.length > 0 ? (
                  <div className="grid gap-3">
                    {userPets.map(pet => (
                      <PetCard
                        key={pet.id}
                        pet={pet}
                        onDelete={() => deletePetForUser(pet.id)}
                        onUploadImage={(file) => handleUpdatePetImage(pet.id, file)}
                        isUploading={uploadingPetId === pet.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    <span className="material-symbols-outlined text-5xl mb-2 opacity-30">pets</span>
                    <p className="text-sm">该用户暂无宠物</p>
                  </div>
                )}

                {/* 添加宠物按钮/表单 */}
                {!showAddPet ? (
                  <button
                    onClick={() => setShowAddPet(true)}
                    className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                    添加新宠物
                  </button>
                ) : (
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-4 space-y-3 border border-primary/10">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-primary text-sm">添加新宠物</h4>
                      <button 
                        onClick={() => setShowAddPet(false)}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>

                    {/* 上传照片 */}
                    <div className="flex justify-center">
                      <ImageUploader
                        currentImage={petDraft.image_url || undefined}
                        onUpload={handleUploadNewPetImage}
                        isUploading={newPetImageUploading}
                        size="lg"
                      />
                    </div>

                    <input 
                      className="w-full h-11 rounded-xl bg-white border border-neutral-200 px-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="宠物名称 *" 
                      value={petDraft.name} 
                      onChange={e => setPetDraft(d => ({ ...d, name: e.target.value }))} 
                    />
                    <input 
                      className="w-full h-11 rounded-xl bg-white border border-neutral-200 px-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                      placeholder="品种 *" 
                      value={petDraft.breed} 
                      onChange={e => setPetDraft(d => ({ ...d, breed: e.target.value }))} 
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        className="h-11 rounded-xl bg-white border border-neutral-200 px-3 text-sm font-medium focus:border-primary outline-none" 
                        value={petDraft.pet_type} 
                        onChange={e => setPetDraft(d => ({ ...d, pet_type: e.target.value as 'dog' | 'cat' }))}
                      >
                        <option value="dog">🐕 狗狗</option>
                        <option value="cat">🐈 猫咪</option>
                      </select>
                      <select 
                        className="h-11 rounded-xl bg-white border border-neutral-200 px-3 text-sm font-medium focus:border-primary outline-none" 
                        value={petDraft.gender} 
                        onChange={e => setPetDraft(d => ({ ...d, gender: e.target.value as 'male' | 'female' }))}
                      >
                        <option value="male">♂ 公</option>
                        <option value="female">♀ 母</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full h-11 rounded-xl bg-white border border-neutral-200 px-4 pr-10 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                          placeholder="年龄" 
                          value={petDraft.age || ''} 
                          onChange={e => setPetDraft(d => ({ ...d, age: Number(e.target.value) }))} 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">岁</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number"
                          step="0.1"
                          className="w-full h-11 rounded-xl bg-white border border-neutral-200 px-4 pr-10 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                          placeholder="体重" 
                          value={petDraft.weight || ''} 
                          onChange={e => setPetDraft(d => ({ ...d, weight: Number(e.target.value) }))} 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">kg</span>
                      </div>
                    </div>
                    <textarea 
                      className="w-full h-20 rounded-xl bg-white border border-neutral-200 p-4 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" 
                      placeholder="宠物描述（可选）" 
                      value={petDraft.description} 
                      onChange={e => setPetDraft(d => ({ ...d, description: e.target.value }))} 
                    />
                    <button 
                      onClick={savePetForUser} 
                      disabled={loading || !petDraft.name || !petDraft.breed}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          保存中...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">check</span>
                          确认添加
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'doctors' && (
          <>
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm mb-4">
              <div className="font-black text-primary mb-3">新增/编辑医生（MVP）</div>
              <div className="space-y-3">
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="医生姓名" value={doctorDraft.name} onChange={e => setDoctorDraft(d => ({ ...d, name: e.target.value }))} />
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="职称" value={doctorDraft.title} onChange={e => setDoctorDraft(d => ({ ...d, title: e.target.value }))} />
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="头像 URL" value={doctorDraft.image_url} onChange={e => setDoctorDraft(d => ({ ...d, image_url: e.target.value }))} />
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="价格（整数）" value={doctorDraft.price} onChange={e => setDoctorDraft(d => ({ ...d, price: Number(e.target.value) }))} />
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="标签（逗号分隔，如：外科,全科）" value={doctorDraft.tags} onChange={e => setDoctorDraft(d => ({ ...d, tags: e.target.value }))} />
                <button onClick={saveDoctor} className="w-full h-12 rounded-2xl bg-primary text-white font-black">保存医生</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm">
              <div className="font-black text-primary mb-3">医生列表</div>
              <div className="space-y-3">
                {doctors.map(d => (
                  <div key={d.id} className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-bold text-primary text-sm truncate">{d.name}</div>
                      <div className="text-xs text-neutral-400 truncate">{d.title} · ¥{d.price}</div>
                    </div>
                    <div className="text-right text-xs font-bold text-neutral-500">⭐ {d.rating}</div>
                  </div>
                ))}
                {doctors.length === 0 && <div className="text-sm text-neutral-400">暂无数据</div>}
              </div>
            </div>
          </>
        )}

        {tab === 'appointments' && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm">
            <div className="font-black text-primary mb-3">预约列表</div>
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id} className="border-b border-neutral-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-primary text-sm">{a.doctors?.name || '医生'}</div>
                    <div className="text-[10px] font-black text-neutral-500 uppercase">{a.status}</div>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{a.appointment_date} {String(a.appointment_time).slice(0, 5)} · {a.pet_name} · ¥{a.cost}</div>
                  <div className="text-xs text-neutral-400 mt-1">用户：{a.users?.name || '-'}（{a.users?.email || '-'}）</div>
                </div>
              ))}
              {appointments.length === 0 && <div className="text-sm text-neutral-400">暂无数据</div>}
            </div>
          </div>
        )}

        {tab === 'redeem' && (
          <>
            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm mb-4">
              <div className="font-black text-primary mb-3">新增兑换码（MVP）</div>
              <div className="space-y-3">
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="兑换码（如 WELCOME2026）" value={codeDraft.code} onChange={e => setCodeDraft(d => ({ ...d, code: e.target.value }))} />
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="积分" value={codeDraft.points} onChange={e => setCodeDraft(d => ({ ...d, points: Number(e.target.value) }))} />
                <input className="w-full h-12 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-bold" placeholder="最大使用次数" value={codeDraft.max_uses} onChange={e => setCodeDraft(d => ({ ...d, max_uses: Number(e.target.value) }))} />
                <button onClick={saveCode} className="w-full h-12 rounded-2xl bg-primary text-white font-black">保存兑换码</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm">
              <div className="font-black text-primary mb-3">兑换码列表</div>
              <div className="space-y-3">
                {codes.map(c => (
                  <div key={c.id} className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-black text-primary text-sm truncate">{c.code}</div>
                      <div className="text-xs text-neutral-400">{c.current_uses}/{c.max_uses} · {c.is_active ? '启用' : '禁用'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-primary">+{c.points}</div>
                    </div>
                  </div>
                ))}
                {codes.length === 0 && <div className="text-sm text-neutral-400">暂无数据</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: any; icon?: string; color?: string }> = ({ label, value, icon, color = 'blue' }) => {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/30',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
  };
  
  return (
    <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm relative overflow-hidden">
      {icon && (
        <div className={`absolute -right-2 -top-2 w-16 h-16 rounded-full bg-gradient-to-br ${colorMap[color]} opacity-10`} />
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-neutral-400 font-bold tracking-wide">{label}</div>
          <div className="text-2xl font-black text-primary mt-2">{value}</div>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-center`}>
            <span className="material-symbols-outlined text-white text-lg">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};
