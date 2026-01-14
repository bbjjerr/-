import React, { useEffect, useMemo, useState } from 'react';
import { ScreenName } from '../types';
import { adminService, type AdminDoctorRow, type AdminRedeemCodeRow, type AdminStats, type AdminUserRow, type AdminAppointmentRow } from '../src/services/adminService';

type NavProps = {
  onNavigate: (screen: ScreenName, data?: any) => void;
};

type TabKey = 'overview' | 'users' | 'doctors' | 'appointments' | 'redeem';

export const AdminScreen: React.FC<NavProps & { isAdmin?: boolean }> = ({ onNavigate, isAdmin }) => {
  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([]);
  const [codes, setCodes] = useState<AdminRedeemCodeRow[]>([]);

  const [doctorDraft, setDoctorDraft] = useState({ name: '', title: '', image_url: '', price: 200, tags: '' });
  const [codeDraft, setCodeDraft] = useState({ code: '', points: 1000, max_uses: 1 });

  const tabs = useMemo(
    () => [
      { key: 'overview' as const, label: '概览' },
      { key: 'users' as const, label: '用户' },
      { key: 'doctors' as const, label: '医生' },
      { key: 'appointments' as const, label: '预约' },
      { key: 'redeem' as const, label: '兑换码' }
    ],
    []
  );

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
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-neutral-50 transition-colors"
            title="刷新"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                tab === t.key ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-600 border-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6 max-w-md mx-auto">
        {error && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 text-sm font-bold">{error}</div>}
        {loading && <div className="mb-4 text-neutral-400 text-sm font-bold">加载中...</div>}

        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="用户" value={stats?.users ?? '-'} />
            <StatCard label="医生" value={stats?.doctors ?? '-'} />
            <StatCard label="预约" value={stats?.appointments ?? '-'} />
            <StatCard label="会话" value={stats?.chats ?? '-'} />
            <StatCard label="消息" value={stats?.messages ?? '-'} />
            <StatCard label="兑换码" value={stats?.redeemCodes ?? '-'} />
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm">
            <div className="font-black text-primary mb-3">用户列表</div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between border-b border-neutral-50 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-bold text-primary text-sm truncate">{u.name}</div>
                    <div className="text-xs text-neutral-400 truncate">{u.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-primary">{u.points} 分</div>
                    <div className={`text-[10px] font-bold ${u.is_admin ? 'text-green-600' : 'text-neutral-400'}`}>{u.is_admin ? '管理员' : '普通用户'}</div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="text-sm text-neutral-400">暂无数据</div>}
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

const StatCard: React.FC<{ label: string; value: any }> = ({ label, value }) => {
  return (
    <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm">
      <div className="text-xs text-neutral-400 font-bold tracking-wide">{label}</div>
      <div className="text-2xl font-black text-primary mt-2">{value}</div>
    </div>
  );
};
