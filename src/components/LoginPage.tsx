import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  Theater,
  AlertCircle,
  Building2,
  User,
} from 'lucide-react';

interface LoginPageProps {
  onSkipLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSkipLogin }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const user = login(email, password);
    if (user) {
      setIsLoading(false);
    } else {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@teatro.edu.co', password: 'admin123', role: 'Admin', color: 'bg-amber-500' },
    { email: 'taquilla@teatro.edu.co', password: 'taquilla123', role: 'Taquillero', color: 'bg-indigo-500' },
    { email: 'espectador@teatro.edu.co', password: 'espectador123', role: 'Espectador', color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
            <Theater className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Teatro Escolar 2026
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistema de Boletería y Asignación de Asientos
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Iniciar Sesión</h2>
          </div>

          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="correo@teatro.edu.co"
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar</span>
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] text-slate-400 mb-3 text-center font-medium">
              Cuentas de demostración
            </p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between text-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg ${acc.color} flex items-center justify-center text-white font-bold text-[10px] shadow-sm`}>
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <div className="text-left">
                      <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {acc.role}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {acc.password}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skip login for public */}
        {onSkipLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={onSkipLogin}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Entrar como público sin cuenta →
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <Building2 className="w-3 h-3" />
            <span>Colegio Mayor • Teatro Escolar 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
