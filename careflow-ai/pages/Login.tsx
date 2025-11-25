import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for demo
  const fillDemo = (role: string) => {
    setPassword('password123');
    if (role === 'admin') setEmail('admin@careflow.com');
    if (role === 'carer') setEmail('carer@careflow.com');
    if (role === 'family') setEmail('family@careflow.com');
    if (role === 'client') setEmail('client@careflow.com');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">CareFlow AI</h1>
          <p className="text-primary-100 mt-2">Secure Care Management Portal</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="name@careflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
              {!isSubmitting && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs text-center text-slate-400 uppercase tracking-wider font-semibold mb-4">Demo Credentials (Click to fill)</p>
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => fillDemo('admin')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Admin</button>
               <button onClick={() => fillDemo('carer')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Carer</button>
               <button onClick={() => fillDemo('family')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Family</button>
               <button onClick={() => fillDemo('client')} className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-medium">Client</button>
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;