import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import SocialLogins from '../components/SocialLogins';

const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>;

interface LoginPageProps {
  onClose: () => void;
}

interface FormComponentProps {
    formData: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    t: (key: string) => string;
}

interface RegisterFormComponentProps extends FormComponentProps {
    showPassword: boolean;
    setShowPassword: (show: boolean) => void;
}

const LoginForm: React.FC<FormComponentProps> = ({ formData, handleInputChange, t }) => (
    <div className="space-y-4">
      <div>
        <label htmlFor="email-modal" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
          {t('login.emailLabel')}
        </label>
        <input 
          id="email-modal" 
          name="email" 
          type="email" 
          autoComplete="email" 
          required 
          value={formData.email} 
          onChange={handleInputChange} 
          className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all placeholder-zinc-300 dark:placeholder-zinc-600" 
          placeholder="user@example.com" 
        />
      </div>
      <div>
        <label htmlFor="password-modal" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
          Password
        </label>
        <input 
          id="password-modal" 
          name="password" 
          type="password" 
          autoComplete="current-password" 
          required 
          value={formData.password} 
          onChange={handleInputChange} 
          className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all placeholder-zinc-300 dark:placeholder-zinc-600" 
          placeholder="••••••••" 
        />
      </div>
    </div>
);

const RegisterForm: React.FC<RegisterFormComponentProps> = ({ formData, handleInputChange, showPassword, setShowPassword, t }) => (
    <div className="space-y-4 max-h-[38dvh] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
      <div>
        <label htmlFor="name-register" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Full Name</label>
        <input id="name-register" name="name" type="text" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all placeholder-zinc-300 dark:placeholder-zinc-600" placeholder="John Doe" />
      </div>
      <div>
        <label htmlFor="email-register" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">{t('login.emailLabel')}</label>
        <input id="email-register" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all placeholder-zinc-300 dark:placeholder-zinc-600" placeholder="user@example.com" />
      </div>
      <div>
        <label htmlFor="password-register" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Password</label>
        <div className="relative">
            <input id="password-register" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 pr-12 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all placeholder-zinc-300 dark:placeholder-zinc-600" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
        <PasswordStrengthIndicator password={formData.password} />
      </div>
      <div>
        <label htmlFor="confirmPassword-register" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Confirm Password</label>
        <input id="confirmPassword-register" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all placeholder-zinc-300 dark:placeholder-zinc-600" placeholder="••••••••" />
      </div>
      <div>
        <label htmlFor="role-register" className="block text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">{t('login.roleLabel')}</label>
        <select id="role-register" name="role" required value={formData.role} onChange={handleInputChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-sm transition-all">
          <optgroup label="Core Roles" className="text-zinc-800 dark:text-zinc-100">
            <option>Farmer</option>
            <option>Agrodealer</option>
            <option>Agrovet</option>
            <option>Agronomist</option>
            <option>LogisticsProvider</option>
          </optgroup>
          <optgroup label="Admin Roles" className="text-zinc-800 dark:text-zinc-100">
            <option>Admin</option>
            <option>SuperAdmin</option>
          </optgroup>
        </select>
      </div>
    </div>
);

const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Farmer' as UserRole
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithEmail } = useAuth();
  // Legacy email/password path — phone+OTP is the primary flow at /login.
  // This file remains as the admin/agronomist fallback per DESIGN_SPEC §9.2.5.
  const login = (email: string, _password: string) => loginWithEmail(email, _password);
  const register = async (_details: Omit<User, 'id'>) => { throw new Error('Public registration uses phone OTP. Open /login.'); };
  const socialLogin = async (_provider: 'Google' | 'Apple' | 'Facebook') => { throw new Error('Social login is no longer supported.'); };
  const { t } = useLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (view === 'register') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
      } else {
        const newUser: Omit<User, 'id'> = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        };
        await register(newUser);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple' | 'Facebook') => {
    setError('');
    setIsLoading(true);
    try {
      await socialLogin(provider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during social login.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/50 dark:bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md p-8 md:p-10 space-y-6 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer z-30" 
          aria-label="Close login modal"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center space-y-4 relative z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-brand-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] relative overflow-hidden group">
            <span className="text-3xl relative z-10">🌿</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black bg-gradient-to-r from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent leading-none tracking-tight">
              {view === 'login' ? t('login.welcome') : 'Create Account'}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {view === 'login' ? t('login.signInTo') : 'Join the Mkulima community'}
            </p>
            {view === 'login' && (
              <div className="mt-2 inline-block px-3 py-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-400 italic">
                  Data purged. Use <span className="font-extrabold text-emerald-600 dark:text-emerald-300">admin@mkulima.com</span> / <span className="font-extrabold text-emerald-600 dark:text-emerald-300">password</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
          {view === 'login' 
            ? <LoginForm formData={formData} handleInputChange={handleInputChange} t={t} /> 
            : <RegisterForm 
                formData={formData} 
                handleInputChange={handleInputChange} 
                showPassword={showPassword} 
                setShowPassword={setShowPassword}
                t={t} 
              />
          }
          {error && <p className="text-xs text-red-500 text-center font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 py-2.5 px-4 rounded-xl animate-fade-in">⚠️ {error}</p>}
          <div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-brand-600 hover:from-emerald-600 hover:to-brand-700 text-white font-black rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-base cursor-pointer disabled:bg-zinc-400"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>{view === 'login' ? t('login.signingIn') : 'Registering...'}</span>
                </>
              ) : (
                <span>{view === 'login' ? t('login.signIn') : 'Register'}</span>
              )}
            </button>
          </div>
        </form>

        <div className="relative z-10">
          <SocialLogins onSocialLogin={handleSocialLogin} isLoading={isLoading} />
        </div>

        <div className="text-center text-sm pt-2 relative z-10">
          <button 
            onClick={() => setView(view === 'login' ? 'register' : 'login')} 
            className="font-bold text-brand-green-dark dark:text-brand-green-light hover:underline hover:text-brand-green transition-all"
          >
            {view === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;