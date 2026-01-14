import React, { useEffect, useState } from 'react';
import { IMAGES, ScreenName } from '../types';

interface AuthScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onLogin?: (email: string, pass: string) => Promise<boolean>;
  onRegister?: (name: string, email: string, pass: string) => Promise<boolean | string>;
  prefillEmail?: string;
}

export const WelcomeScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background-light font-display">
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl shadow-neutral-200/50 p-3 flex flex-col h-[80vh] max-h-[720px] min-h-[600px] relative">

        {/* Image Section */}
        <div className="relative flex-1 w-full rounded-[32px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700"
            style={{ backgroundImage: `url("${IMAGES.goldenRetrieverHead}")` }}
          ></div>

          {/* Icon Badge */}
          <div className="absolute top-5 left-5 w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
            <span className="material-symbols-outlined text-primary text-[24px]">pets</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col items-center pt-10 pb-8 px-6">
          <h1 className="text-4xl font-black text-primary mb-4 tracking-tight">爱宠托管</h1>
          <p className="text-center text-neutral-400 text-base font-medium leading-relaxed tracking-wide">
            给您的爱宠，<br />家一般的关怀
          </p>
        </div>

        {/* Action Section */}
        <div className="px-3 pb-3 w-full mt-auto">
          <button
            onClick={() => onNavigate(ScreenName.LOGIN)}
            className="w-full bg-[#1A1A1A] hover:bg-black text-white h-16 rounded-[24px] font-bold text-[16px] flex items-center justify-center gap-2 mb-4 transition-all active:scale-[0.98] shadow-xl shadow-neutral-900/10 group"
          >
            立即开启
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>

          <button
            onClick={() => onNavigate(ScreenName.LOGIN)}
            className="w-full text-center text-xs font-bold text-neutral-300 hover:text-primary transition-colors tracking-wide py-2"
          >
            已有账号？ 登录
          </button>
        </div>
      </div>
    </div>
  );
};

export const LoginScreen: React.FC<AuthScreenProps> = ({ onNavigate, onLogin, prefillEmail }) => {
  const [email, setEmail] = useState(prefillEmail );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    if (prefillEmail && prefillEmail !== email) {
      setEmail(prefillEmail);
      setPassword('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEmail]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin) return;
    if (isLoggingIn) return;
    // 基本验证
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    try {
      setIsLoggingIn(true);
      const success = await onLogin(email, password);
      if (success) {
        setToast({ show: true, message: '登录成功', isError: false });
        setTimeout(() => onNavigate(ScreenName.DOCTOR_SEARCH), 600);
      } else {
        setError('账号或密码错误，请重试');
        setToast({ show: true, message: '登录失败，请检查账号密码', isError: true });
      }
    } catch (e) {
      setError('登录失败，请稍后再试');
      setToast({ show: true, message: '登录失败，请稍后再试', isError: true });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden bg-background-light">
      {toast.show && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${toast.isError ? 'text-red-400' : 'text-green-400'}`}>
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="w-full max-w-[420px] mx-auto bg-white rounded-3xl shadow-soft p-2 sm:p-3 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-pastel/40 rounded-full blur-3xl pointer-events-none opacity-60"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-48 h-48 bg-blue-100/40 rounded-full blur-3xl pointer-events-none opacity-60"></div>

        <div className="relative w-full h-[220px] rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url("${IMAGES.goldenRetrieverHead}")` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-60"></div>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>pets</span>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="text-center mb-8">
            <h1 className="text-primary tracking-tight text-3xl font-extrabold leading-tight mb-2">欢迎回来</h1>
            <p className="text-neutral-500 text-base font-medium leading-normal">让我们照顾您的爱宠。</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="group relative">
              <label className="block text-sm font-bold text-neutral-400 tracking-wider mb-1.5 ml-1">电子邮箱地址</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-neutral-400 group-focus-within:text-primary transition-colors">mail</span>
                <input
                  className="flex w-full rounded-2xl border border-neutral-200 bg-background-light text-primary focus:border-transparent focus:ring-4 focus:ring-brand-pastel/50 h-14 pl-12 pr-4 text-base placeholder:text-neutral-400 transition-all duration-200 outline-none"
                  placeholder="hello@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div className="group relative">
              <div className="flex justify-between items-baseline mb-1.5 ml-1">
                <label className="block text-sm font-bold text-neutral-400 tracking-wider">密码</label>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-neutral-400 group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="flex w-full rounded-2xl border border-neutral-200 bg-background-light text-primary focus:border-transparent focus:ring-4 focus:ring-brand-pastel/50 h-14 pl-12 pr-12 text-base placeholder:text-neutral-400 transition-all duration-200 outline-none"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
                <div
                  className="absolute right-0 top-0 h-full flex items-center pr-4 cursor-pointer text-neutral-400 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs font-bold text-red-500">{error}</span>
                <a href="#" className="text-xs font-bold text-neutral-500 hover:text-primary transition-colors">忘记密码？</a>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-neutral-800 text-white font-bold text-lg h-14 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2 group">
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>登录</span>
                  <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs font-bold tracking-widest">或通过以下方式继续</span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className="flex-1 h-12 flex items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors">
                <img src={IMAGES.googleLogo} alt="Google" className="w-5 h-5" />
              </button>
              <button className="flex-1 h-12 flex items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors">
                <span className="material-symbols-outlined text-2xl">ios</span>
              </button>
            </div>
            <p className="text-center mt-8 text-neutral-600 text-sm">
              没有账号？
              <button onClick={() => onNavigate(ScreenName.REGISTER)} className="font-bold text-primary ml-1 hover:underline decoration-brand-pastel decoration-2 underline-offset-2">立即注册</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterScreen: React.FC<AuthScreenProps> = ({ onNavigate, onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
    if (!name || !email || !password) {
      setError('请填写所有必填项');
      return;
    }

    // 基本邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 密码长度验证
    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    if (!onRegister) {
      onNavigate(ScreenName.LOGIN);
      return;
    }

    setIsRegistering(true);
    try {
      const result = await onRegister(name, email, password);
      if (result === true) {
        setToast({ show: true, message: '注册成功，请登录', isError: false });
        setTimeout(() => onNavigate(ScreenName.LOGIN), 800);
      } else if (typeof result === 'string') {
        setError(result);
        setToast({ show: true, message: result, isError: true });
      } else {
        setError('注册失败：该邮箱可能已被注册或网络错误');
        setToast({ show: true, message: '注册失败：该邮箱可能已被注册', isError: true });
      }
    } catch {
      setError('注册失败，请稍后再试');
      setToast({ show: true, message: '注册失败，请稍后再试', isError: true });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden bg-background-light">
      {toast.show && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${toast.isError ? 'text-red-400' : 'text-green-400'}`}>
              {toast.isError ? 'error' : 'check_circle'}
            </span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="w-full max-w-[420px] mx-auto bg-white rounded-3xl shadow-soft p-2 sm:p-3 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-brand-pastel/40 rounded-full blur-3xl pointer-events-none opacity-60"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-48 h-48 bg-purple-100/40 rounded-full blur-3xl pointer-events-none opacity-60"></div>

        <div className="px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-primary tracking-tight text-3xl font-extrabold leading-tight mb-2">创建账号</h1>
            <p className="text-neutral-500 text-base font-medium leading-normal">开启您的爱宠护理之旅。</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            <div className="group relative">
              <label className="block text-sm font-bold text-neutral-400 tracking-wider mb-1.5 ml-1">用户名</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-neutral-400 group-focus-within:text-primary transition-colors">person</span>
                <input
                  className="flex w-full rounded-2xl border border-neutral-200 bg-background-light text-primary focus:border-transparent focus:ring-4 focus:ring-brand-pastel/50 h-14 pl-12 pr-4 text-base placeholder:text-neutral-400 transition-all duration-200 outline-none"
                  placeholder="您的名字"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div className="group relative">
              <label className="block text-sm font-bold text-neutral-400 tracking-wider mb-1.5 ml-1">电子邮箱地址</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-neutral-400 group-focus-within:text-primary transition-colors">mail</span>
                <input
                  className="flex w-full rounded-2xl border border-neutral-200 bg-background-light text-primary focus:border-transparent focus:ring-4 focus:ring-brand-pastel/50 h-14 pl-12 pr-4 text-base placeholder:text-neutral-400 transition-all duration-200 outline-none"
                  placeholder="hello@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div className="group relative">
              <div className="flex justify-between items-baseline mb-1.5 ml-1">
                <label className="block text-sm font-bold text-neutral-400 tracking-wider">密码</label>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-neutral-400 group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="flex w-full rounded-2xl border border-neutral-200 bg-background-light text-primary focus:border-transparent focus:ring-4 focus:ring-brand-pastel/50 h-14 pl-12 pr-12 text-base placeholder:text-neutral-400 transition-all duration-200 outline-none"
                  placeholder="设置密码"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
                <div
                  className="absolute right-0 top-0 h-full flex items-center pr-4 cursor-pointer text-neutral-400 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </div>
              </div>
              {error && <div className="mt-2 text-xs font-bold text-red-500 text-right">{error}</div>}
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-neutral-800 text-white font-bold text-lg h-14 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2 group">
              {isRegistering ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <span>注册</span>
                  <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-center mt-4 text-neutral-600 text-sm">
              已有账号？
              <button onClick={() => onNavigate(ScreenName.LOGIN)} className="font-bold text-primary ml-1 hover:underline decoration-brand-pastel decoration-2 underline-offset-2">立即登录</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};